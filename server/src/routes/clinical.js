import express from "express";
import { db } from "../config/db.js";
import { clinicalNotes } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";

const router = express.Router();

// GET /api/clinical/patient/:patientId — admin only
router.get("/patient/:patientId", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const notes = await db
      .select()
      .from(clinicalNotes)
      .where(eq(clinicalNotes.patientId, patientId))
      .orderBy(desc(clinicalNotes.updatedAt));

    res.json(notes);
  } catch (error) {
    next(error);
  }
});

// POST /api/clinical — admin only
router.post("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { patientId, recordType, content } = req.body;

    if (!patientId || !recordType || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const VALID_TYPES = new Set(["general", "soap", "treatment", "followup"]);
    if (!VALID_TYPES.has(recordType)) {
      return res.status(400).json({
        error: `Invalid recordType. Must be one of: ${[...VALID_TYPES].join(", ")}`,
      });
    }

    const [note] = await db
      .insert(clinicalNotes)
      .values({
        patientId,
        doctorId: req.user.id,
        recordType,
        content: String(content),
      })
      .returning();

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

// PUT /api/clinical/:id — admin only
router.put("/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const [note] = await db
      .update(clinicalNotes)
      .set({ content: String(content), updatedAt: new Date() })
      .where(eq(clinicalNotes.id, id))
      .returning();

    if (!note) return res.status(404).json({ error: "Note not found" });

    res.json(note);
  } catch (error) {
    next(error);
  }
});

export default router;
