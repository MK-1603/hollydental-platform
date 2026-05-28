import express from "express";
import crypto from "crypto";
import { db } from "../config/db.js";
import { invoices, patients } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";

const router = express.Router();

// Mock invoices in memory
const mockInvoices = [
  {
    id: "inv-mock-1",
    patientId: "mock-patient-id",
    invoiceNumber: "INV-2026-0001",
    issueDate: new Date("2026-05-15"),
    dueDate: new Date("2026-05-30"),
    items: [
      { description: "Dental Checkup & Exam", quantity: 1, price: 60.00 },
      { description: "Teeth Cleaning", quantity: 1, price: 90.00 }
    ],
    subtotal: "150.00",
    vatAmount: "0.00",
    totalAmount: "150.00",
    status: "paid",
    paidAt: new Date("2026-05-15"),
  },
  {
    id: "inv-mock-2",
    patientId: "mock-patient-id",
    invoiceNumber: "INV-2026-0002",
    issueDate: new Date("2026-05-25"),
    dueDate: new Date("2026-06-08"),
    items: [
      { description: "Teeth Whitening", quantity: 1, price: 300.00 }
    ],
    subtotal: "300.00",
    vatAmount: "0.00",
    totalAmount: "300.00",
    status: "pending",
    paidAt: null,
  }
];

// 1. GET ALL Invoices (Admin only)
router.get("/invoices", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const allInvs = await db.select().from(invoices);
      return res.status(200).json(allInvs);
    }
    return res.status(200).json(mockInvoices);
  } catch (error) {
    return res.status(500).json({ message: "Failed to retrieve invoices." });
  }
});

// 2. GET MY Invoices (Patient only)
router.get("/invoices/my", verifyToken, requireRole("patient"), async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const pRows = await db.select().from(patients).where(eq(patients.userId, req.user.id)).limit(1);
      if (pRows.length === 0) return res.status(200).json([]);
      const myInvs = await db.select().from(invoices).where(eq(invoices.patientId, pRows[0].id));
      return res.status(200).json(myInvs);
    }
    return res.status(200).json(mockInvoices.filter(i => i.patientId === "mock-patient-id"));
  } catch (error) {
    return res.status(500).json({ message: "Failed to retrieve your invoices." });
  }
});

// 3. POST Create Invoice (Admin only)
router.post("/invoices", verifyToken, requireRole("admin"), async (req, res) => {
  const { patientId, items, subtotal, vatAmount, totalAmount, dueDate } = req.body;

  if (!patientId || !items || !totalAmount) {
    return res.status(400).json({ message: "Missing required invoice details." });
  }

  try {
    const invNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInvoice = {
      id: crypto.randomUUID(),
      patientId,
      invoiceNumber: invNum,
      issueDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
      items,
      subtotal: subtotal.toString(),
      vatAmount: vatAmount.toString(),
      totalAmount: totalAmount.toString(),
      status: "pending",
      createdBy: req.user.id,
      createdAt: new Date(),
    };

    if (process.env.DATABASE_URL) {
      await db.insert(invoices).values(newInvoice);
    } else {
      mockInvoices.push(newInvoice);
    }

    return res.status(201).json({
      message: "Invoice created successfully.",
      invoice: newInvoice,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create invoice." });
  }
});

// 4. PUT Pay Invoice (Admin or Patient own)
router.put("/invoices/:id/pay", verifyToken, async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      // If client is a patient, verify invoice belongs to them
      if (req.user.role === "patient") {
        const pRows = await db.select().from(patients).where(eq(patients.userId, req.user.id)).limit(1);
        if (pRows.length === 0) return res.status(404).json({ message: "Patient profile not found." });
        
        const invRows = await db.select().from(invoices).where(eq(invoices.id, req.params.id)).limit(1);
        if (invRows.length === 0) return res.status(404).json({ message: "Invoice not found." });
        
        if (invRows[0].patientId !== pRows[0].id) {
          return res.status(403).json({ message: "Forbidden: This invoice is not yours." });
        }
      }

      const updated = await db.update(invoices)
        .set({ status: "paid", paidAt: new Date() })
        .where(eq(invoices.id, req.params.id))
        .returning();
      if (updated.length === 0) return res.status(404).json({ message: "Invoice not found." });
      return res.status(200).json(updated[0]);
    } else {
      const inv = mockInvoices.find(i => i.id === req.params.id);
      if (!inv) return res.status(404).json({ message: "Invoice not found." });
      inv.status = "paid";
      inv.paidAt = new Date();
      return res.status(200).json(inv);
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to process payment." });
  }
});

// 5. GET Invoice PDF (Admin or Patient own)
router.get("/invoices/:id/pdf", verifyToken, async (req, res) => {
  try {
    let inv;
    if (process.env.DATABASE_URL) {
      const rows = await db.select().from(invoices).where(eq(invoices.id, req.params.id)).limit(1);
      inv = rows[0];
    } else {
      inv = mockInvoices.find(i => i.id === req.params.id);
    }

    if (!inv) return res.status(404).json({ message: "Invoice not found." });

    // Mock HTML/PDF Response placeholder
    res.setHeader("Content-Type", "application/pdf");
    return res.send(Buffer.from("MOCK_PDF_STREAM_CONTENT_HOLLYHILL_DENTAL"));
  } catch (error) {
    return res.status(500).json({ message: "Failed to render PDF." });
  }
});

// 6. GET Revenue analytics (Admin only)
router.get("/revenue", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const result = await db.select({
        total: sql`SUM(total_amount)`,
      }).from(invoices).where(eq(invoices.status, "paid"));
      return res.status(200).json({ totalPaid: result[0]?.total || "0.00" });
    }
    const total = mockInvoices
      .filter(i => i.status === "paid")
      .reduce((sum, i) => sum + parseFloat(i.totalAmount), 0);
    return res.status(200).json({ totalPaid: total.toFixed(2) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load revenue." });
  }
});

export default router;
