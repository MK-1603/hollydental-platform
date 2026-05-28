import express from "express";
import multer from "multer";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { db } from "../config/db.js";
import { orders, products, users, patients } from "../db/schema.js";
import { and, desc, eq } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { logActivity } from "../lib/auditLog.js";
import { sendPush } from "../lib/push.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/upload-receipt", verifyToken, upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "No file provided." });
  }
  try {
    const uploadResult = await uploadToCloudinary(file.buffer, file.originalname);
    return res.status(200).json({
      message: "Receipt uploaded successfully.",
      imageUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("[receipt-upload] failed", error);
    return res.status(500).json({ message: "Failed to upload receipt." });
  }
});

function requireDb(res) {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ message: "Orders service is not configured." });
    return false;
  }
  return true;
}

const ALLOWED_PAYMENT_METHODS = new Set(["cash", "upi", "card"]);
const ALLOWED_STATUSES = new Set([
  "pending",
  "paid",
  "ready",
  "completed",
  "cancelled",
]);

/**
 * GET /api/orders/payment-config
 *
 * Public endpoint surfacing the clinic's UPI payee details so the patient
 * UI can render a QR code without us hard-coding it. Configurable via env:
 *   UPI_VPA   — virtual payment address (required for UPI to be enabled)
 *   UPI_NAME  — payee display name shown in the UPI app
 */
router.get("/payment-config", (_req, res) => {
  const vpa = process.env.UPI_VPA || "";
  const name =
    process.env.UPI_NAME || process.env.UPI_PAYEE_NAME || "Hollyhill Dental";
  res.status(200).json({
    cash: { enabled: true },
    upi: {
      enabled: Boolean(vpa),
      vpa,
      name,
    },
  });
});

async function resolvePatientForUser(userId) {
  const rows = await db
    .select()
    .from(patients)
    .where(eq(patients.userId, userId))
    .limit(1);
  return rows[0] || null;
}

async function notifyAdmins(payload) {
  try {
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));
    await Promise.all(admins.map((admin) => sendPush(admin.id, payload)));
  } catch (_) {
    // Best-effort; never throw from the notification path.
  }
}

/**
 * GET /api/orders/my — authenticated patient's order history.
 */
router.get("/my", verifyToken, async (req, res) => {
  if (!requireDb(res)) return;
  if (req.user.role !== "patient") {
    return res.status(403).json({ message: "Forbidden." });
  }
  try {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, req.user.id))
      .orderBy(desc(orders.createdAt));
    res.status(200).json(rows);
  } catch (error) {
    console.error("[orders] GET /my failed", error);
    res.status(500).json({ message: "Failed to retrieve orders." });
  }
});

/**
 * GET /api/orders — admin queue. Optional ?status= filter.
 */
router.get("/", verifyToken, requireRole("admin"), async (req, res) => {
  if (!requireDb(res)) return;
  try {
    const status = String(req.query.status || "").trim();
    const filter = status && ALLOWED_STATUSES.has(status)
      ? eq(orders.status, status)
      : undefined;
    const rows = filter
      ? await db.select().from(orders).where(filter).orderBy(desc(orders.createdAt))
      : await db.select().from(orders).orderBy(desc(orders.createdAt));
    res.status(200).json(rows);
  } catch (error) {
    console.error("[orders] GET / failed", error);
    res.status(500).json({ message: "Failed to retrieve orders." });
  }
});

/**
 * POST /api/orders — patient places a new order.
 *
 * Body: { productId, quantity?, paymentMethod, upiReference?, notes? }
 *
 * Cash orders go straight to "pending" (admin marks paid on pickup).
 * UPI orders also start as "pending" until admin confirms the bank deposit
 * arrived; we never trust the client about money having moved.
 */
router.post("/", verifyToken, async (req, res) => {
  if (!requireDb(res)) return;
  if (req.user.role !== "patient") {
    return res.status(403).json({ message: "Only patients can place orders." });
  }
  const {
    productId,
    quantity,
    paymentMethod,
    upiReference,
    notes,
  } = req.body || {};

  if (!productId) {
    return res.status(400).json({ message: "productId is required." });
  }
  if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
    return res.status(400).json({
      message: "paymentMethod must be 'cash' or 'upi'.",
    });
  }

  const qty = Math.max(1, Math.min(20, parseInt(String(quantity ?? 1), 10) || 1));

  if (paymentMethod === "upi") {
    const cleaned = String(upiReference || "").trim();
    if (cleaned.length < 6 || cleaned.length > 80) {
      return res.status(400).json({
        message:
          "Please paste the 12-character UPI reference number from your bank app.",
      });
    }
    if (!process.env.UPI_VPA) {
      return res.status(503).json({
        message: "UPI payments aren't configured. Please choose cash on pickup.",
      });
    }
  }

  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    if (product.stockCount !== null && product.stockCount < qty) {
      return res
        .status(409)
        .json({ message: "Not enough stock for the requested quantity." });
    }

    const profile = await resolvePatientForUser(req.user.id);

    const unitPrice = parseFloat(String(product.price)) || 0;
    const total = unitPrice * qty;

    const [inserted] = await db
      .insert(orders)
      .values({
        userId: req.user.id,
        patientId: profile?.id || null,
        productId: product.id,
        productName: product.name,
        unitPrice: unitPrice.toFixed(2),
        quantity: qty,
        totalAmount: total.toFixed(2),
        paymentMethod,
        upiReference:
          paymentMethod === "upi" ? String(upiReference).trim() : null,
        status: paymentMethod === "card" ? "paid" : "pending",
        paidAt: paymentMethod === "card" ? new Date() : null,
        customerName: profile
          ? `${profile.firstName} ${profile.lastName}`.trim()
          : null,
        customerPhone: profile?.phone || null,
        customerEmail: profile?.email || req.user.email || null,
        notes: notes ? String(notes).slice(0, 500) : null,
      })
      .returning();

    // Decrement stock optimistically. If two orders race the worst case is
    // a small over-sell, which the admin can resolve manually.
    if (product.stockCount !== null) {
      const nextStock = Math.max(0, product.stockCount - qty);
      await db
        .update(products)
        .set({ stockCount: nextStock, updatedAt: new Date() })
        .where(eq(products.id, product.id));
    }

    await logActivity(req, "order.placed", {
      targetType: "order",
      targetId: inserted.id,
      metadata: {
        productId: product.id,
        paymentMethod,
        total: total.toFixed(2),
      },
    });

    notifyAdmins({
      title: "New product order",
      body: `${product.name} × ${qty} (${paymentMethod.toUpperCase()})`,
      url: "/admin/orders",
      tag: `order-${inserted.id}`,
    });

    res.status(201).json({
      message: "Order placed. The clinic will confirm shortly.",
      order: inserted,
    });
  } catch (error) {
    console.error("[orders] POST failed", error);
    res.status(500).json({ message: "Failed to place order." });
  }
});

/**
 * GET /api/orders/:id — single order detail (patient owns it or admin).
 */
router.get("/:id", verifyToken, async (req, res) => {
  if (!requireDb(res)) return;
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, req.params.id))
      .limit(1);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (req.user.role !== "admin" && order.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden." });
    }

    let patientProfile = null;
    if (order.patientId) {
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, order.patientId))
        .limit(1);
      if (patient) {
        patientProfile = patient;
      }
    }

    res.status(200).json({
      ...order,
      patientProfile,
    });
  } catch (error) {
    console.error("[orders] GET /:id failed", error);
    res.status(500).json({ message: "Failed to retrieve order." });
  }
});

/**
 * PATCH /api/orders/:id — admin updates the order status.
 *
 * Body: { status, notes? }
 */
router.patch("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  if (!requireDb(res)) return;
  const { status, notes } = req.body || {};
  if (!status || !ALLOWED_STATUSES.has(status)) {
    return res.status(400).json({
      message: `status must be one of: ${[...ALLOWED_STATUSES].join(", ")}.`,
    });
  }
  try {
    const updatePayload = { status, updatedAt: new Date() };
    if (notes !== undefined) updatePayload.notes = notes;
    if (status === "paid") updatePayload.paidAt = new Date();
    if (status === "completed") updatePayload.fulfilledAt = new Date();
    if (status === "cancelled") updatePayload.cancelledAt = new Date();

    const [updated] = await db
      .update(orders)
      .set(updatePayload)
      .where(eq(orders.id, req.params.id))
      .returning();
    if (!updated) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Restock on admin cancel
    if (status === "cancelled" && updated.productId) {
      const [p] = await db.select().from(products).where(eq(products.id, updated.productId)).limit(1);
      if (p) {
        await db.update(products).set({
          stockCount: (p.stockCount || 0) + (updated.quantity || 1),
          updatedAt: new Date(),
        }).where(eq(products.id, p.id));
      }
    }

    if (updated.userId) {
      const friendly = {
        pending: "received and pending payment",
        paid: "marked as paid",
        ready: "ready for pickup",
        completed: "completed",
        cancelled: "cancelled",
      }[status];
      sendPush(updated.userId, {
        title: "Order update",
        body: `Your order for ${updated.productName} is ${friendly}.`,
        url: "/portal/products",
        tag: `order-${updated.id}`,
      }).catch(() => {});
    }

    await logActivity(req, "order.status_changed", {
      targetType: "order",
      targetId: updated.id,
      metadata: { status, notes: notes || null },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("[orders] PATCH failed", error);
    res.status(500).json({ message: "Failed to update order." });
  }
});

/**
 * DELETE /api/orders/:id — patient cancels their own order while still
 * pending. Admin can cancel any order.
 */
router.delete("/:id", verifyToken, async (req, res) => {
  if (!requireDb(res)) return;
  try {
    const [target] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, req.params.id))
      .limit(1);
    if (!target) return res.status(404).json({ message: "Order not found." });

    if (req.user.role !== "admin") {
      if (target.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden." });
      }
      if (!["pending", "paid"].includes(target.status)) {
        return res.status(400).json({
          message: "This order can no longer be cancelled by you. Please contact the clinic.",
        });
      }
    }

    await db
      .update(orders)
      .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, target.id));

    // Restock the product on cancellation.
    if (target.productId) {
      const [p] = await db
        .select()
        .from(products)
        .where(eq(products.id, target.productId))
        .limit(1);
      if (p) {
        await db
          .update(products)
          .set({
            stockCount: (p.stockCount || 0) + (target.quantity || 1),
            updatedAt: new Date(),
          })
          .where(eq(products.id, p.id));
      }
    }

    await logActivity(req, "order.cancelled", {
      targetType: "order",
      targetId: target.id,
    });
    res.status(200).json({ message: "Order cancelled." });
  } catch (error) {
    console.error("[orders] DELETE failed", error);
    res.status(500).json({ message: "Failed to cancel order." });
  }
});

/**
 * PATCH /api/orders/:id/submit-receipt — patients submit payment receipt screenshot url or text reference.
 */
router.patch("/:id/submit-receipt", verifyToken, async (req, res) => {
  if (!requireDb(res)) return;
  const { upiReference } = req.body || {};
  if (!upiReference) {
    return res.status(400).json({ message: "upiReference or receipt photo is required." });
  }
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id)).limit(1);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden. This is not your order." });
    }
    if (order.status !== "pending") {
      return res.status(400).json({ message: "Only pending orders can have their payment updated." });
    }

    const [updated] = await db
      .update(orders)
      .set({
        upiReference,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id))
      .returning();

    return res.status(200).json({
      message: "Payment proof submitted successfully.",
      order: updated,
    });
  } catch (error) {
    console.error("[orders] submit-receipt failed", error);
    return res.status(500).json({ message: "Failed to submit receipt." });
  }
});

export default router;
