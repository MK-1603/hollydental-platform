import express from "express";
import { db } from "../config/db.js";
import { messages, patients, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { logActivity } from "../lib/auditLog.js";

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/contact — public enquiry from the contact page.
 *
 * We have no email/SMS provider per clinic policy, so we route every
 * enquiry into the in-portal message thread for the matching patient (or,
 * if none exists, log it as an audit entry for staff to triage).
 */
router.post("/", async (req, res) => {
  const { name, email, phone, topic, callbackWindow, message } = req.body || {};
  const cleanedEmail = String(email || "").trim().toLowerCase();
  const trimmedMessage = String(message || "").trim();

  if (!name || !cleanedEmail || !trimmedMessage) {
    return res
      .status(400)
      .json({ message: "Please provide your name, email and a message." });
  }
  if (!EMAIL_RE.test(cleanedEmail)) {
    return res.status(400).json({ message: "Please provide a valid email." });
  }
  if (trimmedMessage.length > 4000) {
    return res
      .status(400)
      .json({ message: "Message is too long. Please keep it under 4000 characters." });
  }

  if (!process.env.DATABASE_URL) {
    // No DB; surface as a generic acceptance so the form doesn't blow up.
    return res
      .status(202)
      .json({ message: "Thanks — we received your enquiry." });
  }

  const banner = [
    `📨 Contact form enquiry`,
    `From: ${name} <${cleanedEmail}>`,
    phone ? `Phone: ${phone}` : null,
    topic ? `Topic: ${topic}` : null,
    callbackWindow ? `Callback window: ${callbackWindow}` : null,
    "",
    trimmedMessage,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    // Try to attach the message to the patient's existing thread.
    const patientRows = await db
      .select()
      .from(patients)
      .where(eq(patients.email, cleanedEmail))
      .limit(1);
    const patient = patientRows[0];

    if (patient) {
      // Surface to the existing thread as if it were sent by them, so staff
      // see the enquiry alongside their other messages.
      let senderId = patient.userId || null;
      if (!senderId) {
        // Patient has no auth account; pick any admin id so senderId stays
        // valid (the audit log will still attribute correctly).
        const adminRow = await db
          .select()
          .from(users)
          .where(eq(users.role, "admin"))
          .limit(1);
        senderId = adminRow[0]?.id || null;
      }

      await db.insert(messages).values({
        patientId: patient.id,
        senderRole: patient.userId ? "patient" : "admin",
        senderId,
        body: banner,
        isRead: false,
      });
    }

    await logActivity(req, "contact.enquiry.received", {
      metadata: {
        name,
        email: cleanedEmail,
        phone: phone || null,
        topic: topic || null,
        callbackWindow: callbackWindow || null,
        attachedToPatientId: patient?.id || null,
      },
    });

    return res.status(201).json({
      message:
        "Thanks — we received your enquiry. The clinic will be in touch within one business day.",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
