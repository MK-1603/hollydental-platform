import express from "express";
import { db } from "../config/db.js";
import { wellnessLogs, patients } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";

const router = express.Router();

function requireDb(res) {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ message: "Service not configured." });
    return false;
  }
  return true;
}

router.get("/me", verifyToken, async (req, res) => {
  if (!requireDb(res)) return;
  try {
    const rows = await db
      .select()
      .from(wellnessLogs)
      .where(eq(wellnessLogs.userId, req.user.id))
      .orderBy(desc(wellnessLogs.date))
      .limit(30);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("[wellness] me fetch failed", err);
    return res.status(500).json({ message: "Failed to load wellness data." });
  }
});

router.post("/sync", verifyToken, async (req, res) => {
  if (!requireDb(res)) return;
  const { date, morningBrush, nightBrush, floss, streak, longestStreak } = req.body || {};
  if (!date) return res.status(400).json({ message: "date is required." });

  try {
    const pRows = await db.select({ id: patients.id })
      .from(patients).where(eq(patients.userId, req.user.id)).limit(1);
    const patientId = pRows[0]?.id || null;
    const dateStr = String(date).slice(0, 10);

    await db.execute(sql`
      INSERT INTO wellness_logs (user_id, patient_id, date, morning_brush, night_brush, floss, streak, longest_streak, updated_at)
      VALUES (
        ${req.user.id}, ${patientId}, ${dateStr},
        ${!!morningBrush}, ${!!nightBrush}, ${!!floss},
        ${Number(streak) || 0}, ${Number(longestStreak) || 0}, NOW()
      )
      ON CONFLICT (user_id, date) DO UPDATE SET
        morning_brush = EXCLUDED.morning_brush,
        night_brush = EXCLUDED.night_brush,
        floss = EXCLUDED.floss,
        streak = EXCLUDED.streak,
        longest_streak = EXCLUDED.longest_streak,
        updated_at = NOW()
    `);

    return res.status(200).json({ message: "Synced." });
  } catch (err) {
    console.error("[wellness] sync failed", err);
    return res.status(500).json({ message: "Failed to sync wellness data." });
  }
});

router.get("/admin", verifyToken, requireRole("admin"), async (req, res) => {
  if (!requireDb(res)) return;
  try {
    const rows = await db
      .select({
        id: wellnessLogs.id,
        userId: wellnessLogs.userId,
        patientId: wellnessLogs.patientId,
        date: wellnessLogs.date,
        morningBrush: wellnessLogs.morningBrush,
        nightBrush: wellnessLogs.nightBrush,
        floss: wellnessLogs.floss,
        streak: wellnessLogs.streak,
        longestStreak: wellnessLogs.longestStreak,
        updatedAt: wellnessLogs.updatedAt,
        firstName: patients.firstName,
        lastName: patients.lastName,
        email: patients.email,
      })
      .from(wellnessLogs)
      .leftJoin(patients, eq(wellnessLogs.patientId, patients.id))
      .orderBy(desc(wellnessLogs.updatedAt));

    const seen = new Set();
    const latest = rows.filter((r) => {
      if (seen.has(r.userId)) return false;
      seen.add(r.userId);
      return true;
    });

    return res.status(200).json(latest);
  } catch (err) {
    console.error("[wellness] admin fetch failed", err);
    return res.status(500).json({ message: "Failed to load wellness data." });
  }
});

router.get("/admin/:userId/history", verifyToken, requireRole("admin"), async (req, res) => {
  if (!requireDb(res)) return;
  try {
    const rows = await db
      .select()
      .from(wellnessLogs)
      .where(eq(wellnessLogs.userId, req.params.userId))
      .orderBy(desc(wellnessLogs.date))
      .limit(30);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("[wellness] history fetch failed", err);
    return res.status(500).json({ message: "Failed to load history." });
  }
});

export default router;
