import express from "express";
import { db } from "../config/db.js";
import {
  appointments,
  patients,
  invoices,
  services,
  users,
} from "../db/schema.js";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";

const router = express.Router();

function requireDb(res) {
  if (!process.env.DATABASE_URL) {
    res
      .status(503)
      .json({ message: "Analytics service is not configured." });
    return false;
  }
  return true;
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Build the rolling N month window centred on the current month.
 */
function rollingMonths(count = 6) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: SHORT_MONTHS[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
    });
  }
  return months;
}

async function revenueByMonth() {
  const months = rollingMonths(6);
  const totals = await db
    .select({
      ym: sql`to_char(${invoices.paidAt}, 'YYYY-MM')`.as("ym"),
      total: sql`COALESCE(SUM(${invoices.totalAmount}), 0)`.as("total"),
    })
    .from(invoices)
    .where(eq(invoices.status, "paid"))
    .groupBy(sql`to_char(${invoices.paidAt}, 'YYYY-MM')`);

  const map = new Map(
    totals.map((row) => [row.ym, parseFloat(row.total) || 0])
  );

  return months.map((m) => {
    const key = `${m.year}-${String(m.month + 1).padStart(2, "0")}`;
    return { name: m.label, revenue: map.get(key) || 0 };
  });
}

async function appointmentsByWeek() {
  const now = new Date();
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(now.getDate() - 27);
  const startStr = fourWeeksAgo.toISOString().split("T")[0];

  const rows = await db
    .select({
      day: appointments.appointmentDate,
      count: sql`COUNT(*)`.as("count"),
    })
    .from(appointments)
    .where(gte(appointments.appointmentDate, startStr))
    .groupBy(appointments.appointmentDate);

  const buckets = [0, 0, 0, 0];
  rows.forEach((row) => {
    const d = new Date(row.day);
    const diffDays = Math.floor((d.getTime() - fourWeeksAgo.getTime()) / 86400000);
    const idx = Math.min(3, Math.max(0, Math.floor(diffDays / 7)));
    buckets[idx] += Number(row.count) || 0;
  });
  return buckets.map((count, i) => ({ name: `Week ${i + 1}`, count }));
}

async function patientsByQuarter() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const rows = await db
    .select({
      created: patients.createdAt,
    })
    .from(patients)
    .where(gte(patients.createdAt, startOfYear));

  const counts = [0, 0, 0, 0];
  rows.forEach((row) => {
    const month = new Date(row.created).getMonth();
    counts[Math.floor(month / 3)] += 1;
  });
  return counts.map((count, i) => ({ name: `Q${i + 1}`, count }));
}

/* 1. GET dashboard overview. */
router.get("/overview", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const today = new Date().toISOString().split("T")[0];
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [activePatientsRow] = await db
      .select({ count: sql`COUNT(*)` })
      .from(patients);
    const [apptTodayRow] = await db
      .select({ count: sql`COUNT(*)` })
      .from(appointments)
      .where(eq(appointments.appointmentDate, today));

    const [paidThisMonthRow] = await db
      .select({ total: sql`COALESCE(SUM(${invoices.totalAmount}), 0)` })
      .from(invoices)
      .where(
        and(eq(invoices.status, "paid"), gte(invoices.paidAt, startOfMonth))
      );
    const [pendingTotalsRow] = await db
      .select({ total: sql`COALESCE(SUM(${invoices.totalAmount}), 0)` })
      .from(invoices)
      .where(eq(invoices.status, "pending"));

    const [revenueHistory, appointmentHistory, patientHistory] = await Promise.all([
      revenueByMonth(),
      appointmentsByWeek(),
      patientsByQuarter(),
    ]);

    return res.status(200).json({
      totalAppointmentsToday: Number(apptTodayRow?.count || 0),
      activePatientsCount: Number(activePatientsRow?.count || 0),
      monthlyRevenue: parseFloat(paidThisMonthRow?.total || "0"),
      pendingInvoices: parseFloat(pendingTotalsRow?.total || "0"),
      revenueHistory,
      appointmentHistory,
      patientHistory,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/revenue", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const data = await revenueByMonth();
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/appointments", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const data = await appointmentsByWeek();
    return res.status(200).json(data);
  } catch (error) {
        next(error);
  }
});

router.get("/patients", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const data = await patientsByQuarter();
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /analytics/activity — recent clinical events for the dashboard feed.
 * Pulls the latest appointments, paid invoices and new patients, merges them
 * into a single chronologically sorted timeline, and returns the top N rows.
 *
 * Each entry has a stable shape so the client doesn't need to parse server
 * internals: { id, type, text, time, actor }.
 */
router.get("/activity", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 8));
  try {
    // Latest appointment bookings/changes
    const apptRows = await db
      .select({
        id: appointments.id,
        status: appointments.status,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        date: appointments.appointmentDate,
        time: appointments.appointmentTime,
        firstName: patients.firstName,
        lastName: patients.lastName,
        serviceName: services.name,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .orderBy(desc(appointments.updatedAt))
      .limit(limit);

    // Latest paid invoices
    const invoiceRows = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        paidAt: invoices.paidAt,
        createdAt: invoices.createdAt,
        status: invoices.status,
        total: invoices.totalAmount,
        firstName: patients.firstName,
        lastName: patients.lastName,
      })
      .from(invoices)
      .leftJoin(patients, eq(invoices.patientId, patients.id))
      .orderBy(desc(invoices.createdAt))
      .limit(limit);

    // Newest patients
    const patientRows = await db
      .select({
        id: patients.id,
        firstName: patients.firstName,
        lastName: patients.lastName,
        createdAt: patients.createdAt,
      })
      .from(patients)
      .orderBy(desc(patients.createdAt))
      .limit(limit);

    const events = [];

    for (const a of apptRows) {
      const fullName = `${a.firstName || ""} ${a.lastName || ""}`.trim() || "A patient";
      const service = a.serviceName || "an appointment";
      let text;
      switch (a.status) {
        case "cancelled":
          text = `${fullName}'s ${service} was cancelled`;
          break;
        case "completed":
          text = `${fullName} completed ${service}`;
          break;
        case "confirmed":
          text = `${fullName}'s ${service} on ${a.date} confirmed`;
          break;
        case "no_show":
          text = `${fullName} marked no-show for ${service}`;
          break;
        default:
          text = `${fullName} booked ${service}`;
      }
      events.push({
        id: `appt-${a.id}-${a.updatedAt?.getTime?.() || a.createdAt?.getTime?.() || 0}`,
        type: "appointment",
        text,
        at: a.updatedAt || a.createdAt,
      });
    }

    for (const inv of invoiceRows) {
      const fullName = `${inv.firstName || ""} ${inv.lastName || ""}`.trim();
      if (inv.status === "paid" && inv.paidAt) {
        events.push({
          id: `inv-paid-${inv.id}`,
          type: "invoice",
          text: `Invoice ${inv.invoiceNumber} marked as paid${
            fullName ? ` for ${fullName}` : ""
          }`,
          at: inv.paidAt,
        });
      } else {
        events.push({
          id: `inv-${inv.id}`,
          type: "invoice",
          text: `Invoice ${inv.invoiceNumber} created${
            fullName ? ` for ${fullName}` : ""
          }`,
          at: inv.createdAt,
        });
      }
    }

    for (const p of patientRows) {
      const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "New patient";
      events.push({
        id: `patient-${p.id}`,
        type: "patient",
        text: `New patient registration: ${fullName}`,
        at: p.createdAt,
      });
    }

    // Most recent first, clip to the limit
    const ordered = events
      .filter((e) => e.at instanceof Date || typeof e.at === "string")
      .map((e) => ({
        ...e,
        at: e.at instanceof Date ? e.at.toISOString() : new Date(e.at).toISOString(),
      }))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, limit);

    return res.status(200).json({ events: ordered });
  } catch (error) {
    next(error);
  }
});

export default router;
