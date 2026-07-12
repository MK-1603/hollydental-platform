import express from "express";
import { db } from "../config/db.js";
import { patients, appointments, products, suppliers, invoices } from "../db/schema.js";
import { ilike, or } from "drizzle-orm";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const q = req.query.q;
    if (!q || typeof q !== "string" || q.length < 2) {
      return res.json([]);
    }

    const searchTerm = `%${q}%`;

    // Concurrent DB queries
    const [pats, appts, prods, sups, invs] = await Promise.all([
      db.select().from(patients).where(
        or(
          ilike(patients.firstName, searchTerm),
          ilike(patients.lastName, searchTerm),
          ilike(patients.phone, searchTerm),
          ilike(patients.email, searchTerm)
        )
      ).limit(5),
      
      db.select().from(appointments).where(
        ilike(appointments.status, searchTerm)
      ).limit(5),
      
      db.select().from(products).where(
        ilike(products.name, searchTerm)
      ).limit(5),
      
      db.select().from(suppliers).where(
        or(
          ilike(suppliers.name, searchTerm),
          ilike(suppliers.contactName, searchTerm)
        )
      ).limit(5),
      
      db.select().from(invoices).where(
        ilike(invoices.invoiceNumber, searchTerm)
      ).limit(5)
    ]);

    const results = [
      ...pats.map(p => ({
        id: `pat-${p.id}`,
        title: `${p.firstName} ${p.lastName}`,
        subtitle: p.email || p.phone,
        type: "Patient",
        href: `/admin/patients/${p.id}`
      })),
      ...appts.map(a => ({
        id: `appt-${a.id}`,
        title: `Appointment - ${a.status.replace("_", " ")}`,
        subtitle: `${a.appointmentDate} at ${a.appointmentTime}`,
        type: "Appointment",
        href: `/admin/appointments`
      })),
      ...prods.map(p => ({
        id: `prod-${p.id}`,
        title: p.name,
        subtitle: `€${p.price}`,
        type: "Product",
        href: `/admin/products`
      })),
      ...sups.map(s => ({
        id: `sup-${s.id}`,
        title: s.name,
        subtitle: s.contactName || s.email || s.status,
        type: "Supplier",
        href: `/admin/suppliers`
      })),
      ...invs.map(i => ({
        id: `inv-${i.id}`,
        title: `Invoice ${i.invoiceNumber}`,
        subtitle: `€${i.totalAmount} - ${i.status}`,
        type: "Invoice",
        href: `/admin/payments`
      }))
    ];

    res.json(results);
  } catch (error) {
    next(error);
  }
});

export default router;
