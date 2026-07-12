import express from "express";
import { db } from "../config/db.js";
import { invoices, orders, patients } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/payments
 * Aggregates all invoices and orders into a unified transactions list
 */
router.get("/", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const [allInvoices, allOrders] = await Promise.all([
      db.select({
        id: invoices.id,
        ref: invoices.invoiceNumber,
        patientId: invoices.patientId,
        amount: invoices.totalAmount,
        status: invoices.status,
        date: invoices.createdAt,
        type: "invoice"
      }).from(invoices).orderBy(desc(invoices.createdAt)).limit(50),
      
      db.select({
        id: orders.id,
        ref: orders.id,
        patientId: orders.patientId,
        customerName: orders.customerName,
        amount: orders.totalAmount,
        status: orders.status,
        date: orders.createdAt,
        method: orders.paymentMethod,
        type: "order"
      }).from(orders).orderBy(desc(orders.createdAt)).limit(50)
    ]);

    // Simple patient lookup map (in a real scenario, use JOINs)
    const patientIds = [...new Set([
      ...allInvoices.map(i => i.patientId).filter(Boolean),
      ...allOrders.map(o => o.patientId).filter(Boolean)
    ])];
    
    let patientsMap = {};
    if (patientIds.length > 0) {
      // In PostgreSQL, `inArray` can be problematic if array is empty, hence the if block
      const pts = await db.select().from(patients); // We fetch all for demo simplicity, since patient set is small
      pts.forEach(p => { patientsMap[p.id] = `${p.firstName} ${p.lastName}` });
    }

    const transactions = [
      ...allInvoices.map(i => ({
        id: i.ref,
        patient: patientsMap[i.patientId] || "Unknown Patient",
        amount: parseFloat(i.amount),
        method: "Credit Card", // Assuming CC for invoices
        status: i.status === "paid" ? "completed" : "pending",
        date: i.date.toISOString().split("T")[0],
        type: "income"
      })),
      ...allOrders.map(o => ({
        id: `ORD-${o.ref.split("-")[0].toUpperCase()}`,
        patient: patientsMap[o.patientId] || o.customerName || "Walk-in Customer",
        amount: parseFloat(o.amount),
        method: o.method === "cash" ? "Cash" : "Bank Transfer",
        status: o.status === "completed" || o.status === "paid" ? "completed" : "pending",
        date: o.date.toISOString().split("T")[0],
        type: "income"
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

export default router;
