import express from "express";
import multer from "multer";
import { db } from "../config/db.js";
import { products } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { logActivity } from "../lib/auditLog.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { invalidateCache } from "../middleware/cache.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/upload", verifyToken, requireRole("admin"), upload.single("file"), async (req, res, next) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "No file provided." });
  }
  try {
    const uploadResult = await uploadToCloudinary(file.buffer, file.originalname);
    return res.status(200).json({
      message: "Image uploaded successfully.",
      imageUrl: uploadResult.secure_url,
    });
  } catch (error) {
    next(error);
  }
});

function requireDb(res) {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ message: "Products service is not configured." });
    return false;
  }
  return true;
}

/**
 * GET /api/products — public catalogue.
 *
 * The clinic's admin manages the catalogue manually. We don't ship a hidden
 * mock seed any more — empty just means "no products yet" so the UI can
 * surface an honest empty state to staff.
 */
router.get("/", async (_req, res) => {
  if (!requireDb(res)) return;
  try {
    const list = await db
      .select()
      .from(products)
      .orderBy(products.category, products.displayOrder, desc(products.createdAt));
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id — single product by ID (public).
 * Used by the patient portal product detail page.
 */
router.get("/:id", async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, req.params.id))
      .limit(1);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
});


/* POST create — admin only. */
router.post("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  const {
    name,
    description,
    price,
    priceTo,
    imageUrl,
    stockCount,
    category,
    displayOrder,
  } = req.body || {};
  if (!name || price === undefined || price === null || price === "") {
    return res
      .status(400)
      .json({ message: "Product name and price are required." });
  }
  const numericPrice = Number.parseFloat(String(price));
  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ message: "Price must be a positive number." });
  }
  let numericPriceTo = null;
  if (priceTo !== undefined && priceTo !== null && priceTo !== "") {
    const parsed = Number.parseFloat(String(priceTo));
    if (Number.isNaN(parsed) || parsed < numericPrice) {
      return res
        .status(400)
        .json({ message: "Upper price must be a number ≥ price." });
    }
    numericPriceTo = parsed;
  }
  const safeCategory =
    category && ["procedure", "extra"].includes(String(category))
      ? String(category)
      : "extra";
  try {
    const [inserted] = await db
      .insert(products)
      .values({
        name: String(name).trim(),
        description: description ? String(description).slice(0, 4000) : "",
        price: numericPrice.toFixed(2),
        priceTo: numericPriceTo === null ? null : numericPriceTo.toFixed(2),
        imageUrl: imageUrl ? String(imageUrl).slice(0, 1000) : "",
        stockCount:
          stockCount === undefined || stockCount === null
            ? 0
            : Math.max(0, parseInt(String(stockCount), 10) || 0),
        category: safeCategory,
        displayOrder:
          displayOrder !== undefined && displayOrder !== null
            ? Math.max(0, parseInt(String(displayOrder), 10) || 0)
            : 0,
      })
      .returning();
    await logActivity(req, "product.created", {
      targetType: "product",
      targetId: inserted.id,
      metadata: { name: inserted.name, category: inserted.category },
    });
    invalidateCache("products");
    res.status(201).json(inserted);
  } catch (error) {
    next(error);
  }
});

/* PUT update — admin only. */
router.put("/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  const {
    name,
    description,
    price,
    priceTo,
    imageUrl,
    stockCount,
    category,
    displayOrder,
  } = req.body || {};
  try {
    const [updated] = await db
      .update(products)
      .set({
        name: name !== undefined ? String(name).trim() : undefined,
        description:
          description !== undefined
            ? String(description).slice(0, 4000)
            : undefined,
        price:
          price !== undefined && price !== null && price !== ""
            ? Number.parseFloat(String(price)).toFixed(2)
            : undefined,
        priceTo:
          priceTo === undefined
            ? undefined
            : priceTo === null || priceTo === ""
            ? null
            : Number.parseFloat(String(priceTo)).toFixed(2),
        imageUrl:
          imageUrl !== undefined ? String(imageUrl).slice(0, 1000) : undefined,
        stockCount:
          stockCount !== undefined
            ? Math.max(0, parseInt(String(stockCount), 10) || 0)
            : undefined,
        category:
          category !== undefined &&
          ["procedure", "extra"].includes(String(category))
            ? String(category)
            : undefined,
        displayOrder:
          displayOrder !== undefined
            ? Math.max(0, parseInt(String(displayOrder), 10) || 0)
            : undefined,
        updatedAt: new Date(),
      })
      .where(eq(products.id, req.params.id))
      .returning();
    if (!updated) {
      return res.status(404).json({ message: "Product not found." });
    }
    await logActivity(req, "product.updated", {
      targetType: "product",
      targetId: updated.id,
    });
    invalidateCache("products");
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

/* DELETE — admin only. */
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, req.params.id))
      .returning();
    if (!deleted) {
      return res.status(404).json({ message: "Product not found." });
    }
    await logActivity(req, "product.deleted", {
      targetType: "product",
      targetId: deleted.id,
    });
    res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    next(error);
  }
});

export default router;
