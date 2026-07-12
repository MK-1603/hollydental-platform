import express from "express";
import { db } from "../config/db.js";
import { appointments, patients, dentalCharts, treatments, prescriptions } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/records
 * Returns a list of all patients with their basic info for the left sidebar
 */
router.get("/", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const allPatients = await db
      .select()
      .from(patients)
      .orderBy(desc(patients.updatedAt))
      .limit(50);
      
    // Ideally we would join with appointments to get lastVisit, but for now we map basic data
    const records = allPatients.map(p => ({
      id: p.id,
      displayId: `P-${p.id.split("-")[0].toUpperCase()}`,
      name: `${p.firstName} ${p.lastName}`,
      dob: p.dateOfBirth || "Unknown",
      lastVisit: p.updatedAt.toISOString().split("T")[0] // Rough estimate
    }));
    
    res.json(records);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/records/:patientId/timeline
 * Synthesizes a unified timeline of appointments, treatments, and prescriptions
 */
router.get("/:patientId/timeline", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { patientId } = req.params;
    
    const [appts, trts, rxs] = await Promise.all([
      db.select().from(appointments).where(eq(appointments.patientId, patientId)),
      db.select().from(treatments).where(eq(treatments.patientId, patientId)),
      db.select().from(prescriptions).where(eq(prescriptions.patientId, patientId))
    ]);

    const timeline = [
      ...appts.map(a => ({
        id: `appt-${a.id}`,
        type: "visit",
        date: a.appointmentDate,
        title: `Appointment - ${a.status}`,
        doctor: "Clinic Staff",
        desc: a.notes || "No notes provided",
        timestamp: new Date(a.appointmentDate).getTime()
      })),
      ...trts.map(t => ({
        id: `trt-${t.id}`,
        type: "note",
        date: t.date.toISOString().split("T")[0],
        title: "Clinical Treatment",
        doctor: "Attending Doctor",
        desc: t.description || t.clinicalNotes,
        timestamp: t.date.getTime()
      })),
      ...rxs.map(r => ({
        id: `rx-${r.id}`,
        type: "rx",
        date: r.createdAt.toISOString().split("T")[0],
        title: `Prescription: ${r.drugName}`,
        doctor: "Prescribing Doctor",
        desc: `${r.dosage} - ${r.instructions}`,
        timestamp: r.createdAt.getTime()
      }))
    ].sort((a, b) => b.timestamp - a.timestamp); // descending

    res.json(timeline);
  } catch (error) {
    next(error);
  }
});

export default router;
