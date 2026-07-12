import express from "express";
import { db } from "../config/db.js";
import { dentalCharts, patients } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { logActivity } from "../lib/auditLog.js";

const router = express.Router();

function requireDb(res) {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ message: "Dental charts service is not configured." });
    return false;
  }
  return true;
}

/* 1. GET patient's chart (admin or own patient). */
router.get("/:patientId", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  const { patientId } = req.params;

  try {
    if (req.user.role === "patient") {
      const pRows = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, req.user.id))
        .limit(1);
      const ownPatientId = pRows[0]?.id;
      if (!ownPatientId || patientId !== ownPatientId) {
        return res
          .status(403)
          .json({ message: "Forbidden. You cannot view another patient's chart." });
      }
    }

    const chart = await db
      .select()
      .from(dentalCharts)
      .where(eq(dentalCharts.patientId, patientId));

    // Return a defaulted set so the UI always has 32 teeth to render even
    // when the chart hasn't been customised yet.
    if (chart.length === 0) {
      const defaultChart = Array.from({ length: 32 }, (_, i) => ({
        patientId,
        toothNumber: i + 1,
        status: "healthy",
        notes: "",
      }));
      return res.status(200).json(defaultChart);
    }
    return res.status(200).json(chart);
  } catch (error) {
    next(error);
  }
});

/* 2. PUT upsert tooth status (admin only). */
router.put(
  "/:patientId/tooth/:number",
  verifyToken,
  requireRole("admin"),
  async (req, res, next) => {
    if (!requireDb(res)) return;
    const { patientId, number } = req.params;
    const { status, notes } = req.body || {};
    const toothNum = parseInt(number, 10);

    if (Number.isNaN(toothNum) || toothNum < 1 || toothNum > 32) {
      return res
        .status(400)
        .json({ message: "Invalid tooth number. Must be between 1 and 32." });
    }

    try {
      const existing = await db
        .select()
        .from(dentalCharts)
        .where(
          and(
            eq(dentalCharts.patientId, patientId),
            eq(dentalCharts.toothNumber, toothNum)
          )
        )
        .limit(1);

      let row;
      if (existing.length > 0) {
        const [updated] = await db
          .update(dentalCharts)
          .set({
            status,
            notes,
            updatedBy: req.user.id,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(dentalCharts.patientId, patientId),
              eq(dentalCharts.toothNumber, toothNum)
            )
          )
          .returning();
        row = updated;
      } else {
        const [inserted] = await db
          .insert(dentalCharts)
          .values({
            patientId,
            toothNumber: toothNum,
            status,
            notes,
            updatedBy: req.user.id,
          })
          .returning();
        row = inserted;
      }

      await logActivity(req, "dental_chart.updated", {
        targetType: "patient",
        targetId: patientId,
        metadata: { toothNumber: toothNum, status },
      });

      return res.status(200).json(row);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
