import express from "express";
import crypto from "crypto";
import { db } from "../config/db.js";
import { patients, treatments, users } from "../db/schema.js";
import { eq, ilike, or } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { generateContent } from "../config/gemini.js";
import { prompts } from "../config/prompts.js";

const router = express.Router();

function requireDb(res) {
  if (!process.env.DATABASE_URL) {
    res
      .status(503)
      .json({ message: "Patient directory is not configured." });
    return false;
  }
  return true;
}

/* 0. GET /me — patient retrieve their own profile. Must be first to avoid /:id matching "me". */
router.get("/me", verifyToken, async (req, res) => {
  if (!requireDb(res)) return;
  try {
    const pRows = await db.select().from(patients).where(eq(patients.userId, req.user.id)).limit(1);
    if (pRows.length === 0) {
      return res.status(404).json({ message: "Patient profile not found." });
    }
    return res.status(200).json(pRows[0]);
  } catch (err) {
    next(err);
  }
});

/* 0.1 PATCH /me — patient self-update their own profile. */
router.patch("/me", verifyToken, async (req, res) => {
  if (!requireDb(res)) return;
  const { firstName, lastName, phone, address, bloodGroup, age, gender, dateOfBirth } = req.body || {};
  if (!firstName || !lastName || !phone) {
    return res.status(400).json({ message: "First name, last name and phone are required." });
  }
  try {
    const pRows = await db.select().from(patients).where(eq(patients.userId, req.user.id)).limit(1);
    if (pRows.length === 0) {
      return res.status(404).json({ message: "Patient profile not found." });
    }
    const [updated] = await db
      .update(patients)
      .set({
        firstName,
        lastName,
        phone,
        address: address || null,
        bloodGroup: bloodGroup || null,
        age: age ? Number(age) : null,
        gender: gender || null,
        dateOfBirth: dateOfBirth || null,
        updatedAt: new Date()
      })
      .where(eq(patients.userId, req.user.id))
      .returning();
    return res.status(200).json({ message: "Profile updated.", patientProfile: updated });
  } catch (err) {
    next(err);
  }
});


router.get("/", verifyToken, requireRole("admin"), async (req, res) => {
  if (!requireDb(res)) return;
  const { search } = req.query;

  try {
    if (search) {
      const term = `%${search}%`;
      const results = await db
        .select()
        .from(patients)
        .where(
          or(
            ilike(patients.firstName, term),
            ilike(patients.lastName, term),
            ilike(patients.email, term),
            ilike(patients.phone, term)
          )
        );
      return res.status(200).json(results);
    }

    const results = await db.select().from(patients);
    return res.status(200).json(results);
  } catch (error) {
    next(error);
  }
});

/* 2. GET patient detail (admin). */
router.get("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  if (!requireDb(res)) return;
  try {
    const rows = await db
      .select()
      .from(patients)
      .where(eq(patients.id, req.params.id))
      .limit(1);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Patient not found." });
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
        next(error);
  }
});

/* 3. POST create (admin). */
router.post("/", verifyToken, requireRole("admin"), async (req, res) => {
  if (!requireDb(res)) return;
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    bloodGroup,
    age,
    phone,
    email,
    address,
    emergencyContact,
    emergencyPhone,
    medicalConditions,
    medications,
    allergies,
    insuranceProvider,
    notes,
  } = req.body || {};

  if (!firstName || !lastName || !phone || !email) {
    return res.status(400).json({ message: "Missing required patient fields." });
  }

  try {
    const [inserted] = await db
      .insert(patients)
      .values({
        id: crypto.randomUUID(),
        firstName,
        lastName,
        dateOfBirth,
        gender,
        bloodGroup: bloodGroup || null,
        age: age ? Number(age) : null,
        phone,
        email,
        address,
        emergencyContact,
        emergencyPhone,
        medicalConditions,
        medications,
        allergies,
        insuranceProvider,
        notes,
        gdprConsent: true,
        consentDate: new Date(),
      })
      .returning();
    return res.status(201).json({
      message: "Patient profile created successfully.",
      patient: inserted,
    });
  } catch (error) {
        next(error);
  }
});

/* 4. PUT update (admin) — explicit allowlist prevents mass-assignment. */
router.put("/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  const {
    firstName, lastName, dateOfBirth, gender, bloodGroup, age,
    phone, email, address, emergencyContact, emergencyPhone,
    medicalConditions, medications, allergies, insuranceProvider, notes,
  } = req.body || {};
  try {
    const patch = {
      updatedAt: new Date(),
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(dateOfBirth !== undefined && { dateOfBirth }),
      ...(gender !== undefined && { gender }),
      ...(bloodGroup !== undefined && { bloodGroup: bloodGroup || null }),
      ...(age !== undefined && { age: age ? Number(age) : null }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address: address || null }),
      ...(emergencyContact !== undefined && { emergencyContact: emergencyContact || null }),
      ...(emergencyPhone !== undefined && { emergencyPhone: emergencyPhone || null }),
      ...(medicalConditions !== undefined && { medicalConditions: medicalConditions || null }),
      ...(medications !== undefined && { medications: medications || null }),
      ...(allergies !== undefined && { allergies: allergies || null }),
      ...(insuranceProvider !== undefined && { insuranceProvider: insuranceProvider || null }),
      ...(notes !== undefined && { notes: notes || null }),
    };
    const [updated] = await db
      .update(patients)
      .set(patch)
      .where(eq(patients.id, req.params.id))
      .returning();
    if (!updated) {
      return res.status(404).json({ message: "Patient not found." });
    }
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

/* 5. GET clinical summary (AI generated, admin only). */
router.get("/:id/summary", verifyToken, requireRole("admin"), async (req, res) => {
  if (!requireDb(res)) return;
  try {
    const rows = await db
      .select()
      .from(patients)
      .where(eq(patients.id, req.params.id))
      .limit(1);
    const patient = rows[0];
    if (!patient) return res.status(404).json({ message: "Patient not found." });

    const tRows = await db
      .select()
      .from(treatments)
      .where(eq(treatments.patientId, patient.id));
    const completedTreatments = tRows.length
      ? tRows.map((t) => t.description).join(", ")
      : "None";

    const birthDate = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
    const age = birthDate
      ? new Date().getFullYear() - birthDate.getFullYear()
      : null;

    const summary = await generateContent(
      prompts.patientSummary.systemInstruction(),
      prompts.patientSummary.prompt({
        name: `${patient.firstName} ${patient.lastName}`,
        age,
        lastVisit: patient.updatedAt,
        completedTreatments,
        outstanding: patient.notes || "None recorded",
        medicalNotes: patient.medicalConditions || "None",
      })
    );

    return res.status(200).json({ summary });
  } catch (error) {
        next(error);
  }
});

export default router;
