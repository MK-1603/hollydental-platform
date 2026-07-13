import express from "express";
import { db } from "../config/db.js";
import { suppliers } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/suppliers
 */
router.get("/", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const list = await db
      .select()
      .from(suppliers)
      .orderBy(desc(suppliers.createdAt));
      
    res.json(list || []);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/suppliers
 */
router.post("/", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { name, contactName, phone, email, status } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const newSupplier = await db.insert(suppliers).values({
      name,
      contactName,
      phone,
      email,
      status: status || "active"
    }).returning();

    res.status(201).json(newSupplier[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/suppliers/:id
 */
router.put("/:id", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, contactName, phone, email, status } = req.body;

    const updated = await db.update(suppliers).set({
      name,
      contactName,
      phone,
      email,
      status,
      updatedAt: new Date()
    }).where(eq(suppliers.id, id)).returning();

    if (updated.length === 0) return res.status(404).json({ message: "Supplier not found" });
    
    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/suppliers/:id
 */
router.delete("/:id", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await db.delete(suppliers).where(eq(suppliers.id, id)).returning();
    
    if (deleted.length === 0) return res.status(404).json({ message: "Supplier not found" });
    
    res.json({ message: "Supplier deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
