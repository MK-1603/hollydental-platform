/**
 * billing.js — Invoice management
 *
 * All routes use the database exclusively. Mock in-memory invoices have been
 * removed — they were a development artifact that would surface fabricated
 * data to real users in any environment where DATABASE_URL is unset.
 */
import express from "express";
import crypto from "crypto";
import { db } from "../config/db.js";
import { invoices, patients } from "../db/schema.js";
import { eq, desc, sql, and } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { logActivity } from "../lib/auditLog.js";

const router = express.Router();

function requireDb(res) {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ message: "Billing service is not configured." });
    return false;
  }
  return true;
}

// 1. GET ALL Invoices (Admin only)
router.get("/invoices", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const allInvs = await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.createdAt));
    return res.status(200).json(allInvs);
  } catch (error) {
    next(error);
  }
});

// 2. GET MY Invoices (Patient only)
router.get("/invoices/my", verifyToken, requireRole("patient"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const pRows = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, req.user.id))
      .limit(1);
    if (pRows.length === 0) return res.status(200).json([]);

    const myInvs = await db
      .select()
      .from(invoices)
      .where(eq(invoices.patientId, pRows[0].id))
      .orderBy(desc(invoices.createdAt));
    return res.status(200).json(myInvs);
  } catch (error) {
    next(error);
  }
});

// 3. POST Create Invoice (Admin only)
router.post("/invoices", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  const { patientId, items, subtotal, vatAmount, totalAmount, dueDate } = req.body || {};

  if (!patientId || !items || !totalAmount) {
    return res.status(400).json({ message: "Missing required invoice details." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items must be a non-empty array." });
  }

  try {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const invNum = `INV-${year}-${rand}`;

    const [inserted] = await db
      .insert(invoices)
      .values({
        id: crypto.randomUUID(),
        patientId,
        invoiceNumber: invNum,
        issueDate: new Date(),
        dueDate: dueDate
          ? new Date(dueDate)
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        items,
        subtotal: String(subtotal || "0.00"),
        vatAmount: String(vatAmount || "0.00"),
        totalAmount: String(totalAmount),
        status: "pending",
        createdBy: req.user.id,
      })
      .returning();

    await logActivity(req, "invoice.created", {
      targetType: "invoice",
      targetId: inserted.id,
      metadata: { invoiceNumber: inserted.invoiceNumber, patientId },
    });

    return res.status(201).json({
      message: "Invoice created successfully.",
      invoice: inserted,
    });
  } catch (error) {
    next(error);
  }
});

// 3.5 PUT Update Invoice (Admin only)
router.put("/invoices/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const { status } = req.body;
    const [inv] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, req.params.id))
      .limit(1);
    
    if (!inv) return res.status(404).json({ message: "Invoice not found." });

    const updateData = {};
    if (status) updateData.status = status;
    
    // Automatically set or unset paidAt if status changes
    if (status === "paid" && inv.status !== "paid") updateData.paidAt = new Date();
    if (status !== "paid" && inv.status === "paid") updateData.paidAt = null;

    if (Object.keys(updateData).length === 0) {
       return res.status(200).json(inv);
    }

    const [updated] = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, req.params.id))
      .returning();

    await logActivity(req, "invoice.updated", {
      targetType: "invoice",
      targetId: req.params.id,
      metadata: { invoiceNumber: inv.invoiceNumber, status }
    });

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

// 4. PUT Mark Invoice as Paid (Admin or Patient who owns it)
router.put("/invoices/:id/pay", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    if (req.user.role === "patient") {
      const pRows = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, req.user.id))
        .limit(1);
      if (pRows.length === 0) {
        return res.status(404).json({ message: "Patient profile not found." });
      }
      const [inv] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, req.params.id))
        .limit(1);
      if (!inv) return res.status(404).json({ message: "Invoice not found." });
      if (inv.patientId !== pRows[0].id) {
        return res.status(403).json({ message: "Forbidden." });
      }
    }

    const [updated] = await db
      .update(invoices)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(invoices.id, req.params.id))
      .returning();

    if (!updated) return res.status(404).json({ message: "Invoice not found." });

    await logActivity(req, "invoice.paid", {
      targetType: "invoice",
      targetId: req.params.id,
    });

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

// 5. GET Invoice by ID (Admin or Patient who owns it)
router.get("/invoices/:id", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const [inv] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, req.params.id))
      .limit(1);
    if (!inv) return res.status(404).json({ message: "Invoice not found." });

    if (req.user.role === "patient") {
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, req.user.id))
        .limit(1);
      if (!patient || inv.patientId !== patient.id) {
        return res.status(403).json({ message: "Forbidden." });
      }
    }
    return res.status(200).json(inv);
  } catch (error) {
    next(error);
  }
});

// 6. GET Invoice PDF — placeholder (returns metadata only; real PDF generation
//    requires a PDF library like puppeteer or pdfkit — wire up separately)
router.get("/invoices/:id/pdf", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const [inv] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, req.params.id))
      .limit(1);
    if (!inv) return res.status(404).json({ message: "Invoice not found." });

    // Ownership check for patients
    if (req.user.role === "patient") {
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, req.user.id))
        .limit(1);
      if (!patient || inv.patientId !== patient.id) {
        return res.status(403).json({ message: "Forbidden." });
      }
    }

    // TODO: generate real PDF with pdfkit / puppeteer
    return res.status(501).json({
      message: "PDF generation not yet implemented.",
      invoice: inv,
    });
  } catch (error) {
    next(error);
  }
});

// 7. GET Revenue total (Admin only)
router.get("/revenue", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const [result] = await db
      .select({ total: sql`COALESCE(SUM(${invoices.totalAmount}), 0)` })
      .from(invoices)
      .where(eq(invoices.status, "paid"));
    return res.status(200).json({ totalPaid: result?.total || "0.00" });
  } catch (error) {
    next(error);
  }
});

// 8. DELETE Invoice (Admin only)
router.delete("/invoices/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const [inv] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, req.params.id))
      .limit(1);
      
    if (!inv) return res.status(404).json({ message: "Invoice not found." });

    await db.delete(invoices).where(eq(invoices.id, req.params.id));
    
    await logActivity(req, "invoice.deleted", {
      targetType: "invoice",
      targetId: req.params.id,
      metadata: { invoiceNumber: inv.invoiceNumber }
    });
    
    return res.status(200).json({ message: "Invoice deleted successfully." });
  } catch (error) {
    next(error);
  }
});

export default router;
