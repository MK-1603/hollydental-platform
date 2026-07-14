import express from "express";
import { db } from "../config/db.js";
import { appointments, patients, services, users, messages } from "../db/schema.js";
import { eq, and, or, lt } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { sendPush } from "../lib/push.js";
import logger from "../lib/logger.js";
import { logActivity, AuditActions } from "../lib/auditLog.js";

const router = express.Router();

function requireDb(res) {
  if (!process.env.DATABASE_URL) {
    res
      .status(503)
      .json({ message: "Appointments service is not configured." });
    return false;
  }
  return true;
}

/**
 * Automatically cancel past appointments that were never updated by the doctor.
 * Ensures the system history cleans itself up.
 */
async function autoCancelPastAppointments() {
  if (!process.env.DATABASE_URL) return;
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    await db
      .update(appointments)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(appointments.status, "pending"),
          lt(appointments.appointmentDate, todayStr)
        )
      );
  } catch (err) {
    logger.error("Failed to auto-cancel past appointments: ", err);
  }
}

/**
 * Resolve (or create) the patient profile that belongs to the calling user.
 * Patient profiles are created lazily on first appointment so brand-new
 * registrations don't 400 because there's no row yet.
 */
async function resolveOrCreatePatient(reqUser, patientPayload = {}) {
  const existing = await db
    .select()
    .from(patients)
    .where(eq(patients.userId, reqUser.id))
    .limit(1);
  if (existing.length > 0) return existing[0];

  const firstName = (patientPayload.firstName || "").trim();
  const lastName = (patientPayload.lastName || "").trim();
  const phone = (patientPayload.phone || "").trim();
  const email = (patientPayload.email || reqUser.email || "").trim();

  if (!firstName || !lastName || !phone || !email) {
    const err = new Error(
      "Patient profile is incomplete. Please provide first name, last name, phone, and email."
    );
    err.status = 400;
    throw err;
  }

  const [created] = await db
    .insert(patients)
    .values({
      userId: reqUser.id,
      firstName,
      lastName,
      phone,
      email,
      gdprConsent: true,
      consentDate: new Date(),
    })
    .returning();
  return created;
}

/* -------------------- ROUTES -------------------- */

// 1. GET ALL (Admin only)
router.get("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    await autoCancelPastAppointments();
    const { status } = req.query;
    let baseQuery = db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        serviceId: services.slug,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        durationMinutes: appointments.durationMinutes,
        status: appointments.status,
        type: appointments.type,
        notes: appointments.notes,
        depositPaid: appointments.depositPaid,
        stripePaymentId: appointments.stripePaymentId,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
      })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id));

    if (status) {
      baseQuery = baseQuery.where(eq(appointments.status, status));
    }

    const allAppts = await baseQuery;

    // Hydrate basic patient info so the admin queue can show names & contacts.
    if (allAppts.length === 0) return res.status(200).json([]);
    const patientIds = Array.from(
      new Set(allAppts.map((a) => a.patientId).filter(Boolean))
    );
    const patientRows = patientIds.length
      ? await db.select().from(patients)
      : [];
    const byId = new Map(patientRows.map((p) => [p.id, p]));

    return res.status(200).json(
      allAppts.map((a) => ({
        ...a,
        patient: byId.get(a.patientId) || null,
      }))
    );
  } catch (error) {
        next(error);
  }
});

// 2. GET MY (Patient only)
router.get("/my", verifyToken, requireRole("patient"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    await autoCancelPastAppointments();
    const pRows = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, req.user.id))
      .limit(1);
    if (pRows.length === 0) return res.status(200).json([]);

    const myAppts = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        serviceId: services.slug,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        durationMinutes: appointments.durationMinutes,
        status: appointments.status,
        type: appointments.type,
        notes: appointments.notes,
        depositPaid: appointments.depositPaid,
        stripePaymentId: appointments.stripePaymentId,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
      })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.patientId, pRows[0].id));

    return res.status(200).json(myAppts);
  } catch (error) {
        next(error);
  }
});

// 3. GET Slots (Public)
router.get("/slots", async (req, res, next) => {
  if (!requireDb(res)) return;
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: "Date parameter is required." });

// 2b. GET single appointment (Admin or own Patient)
router.get("/:id", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const rows = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        serviceId: services.slug,
        serviceName: services.name,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        durationMinutes: appointments.durationMinutes,
        status: appointments.status,
        type: appointments.type,
        notes: appointments.notes,
        depositPaid: appointments.depositPaid,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
      })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.id, req.params.id))
      .limit(1);
    const appt = rows[0];
    if (!appt) return res.status(404).json({ message: "Appointment not found." });

    if (req.user.role === "patient") {
      const pRows = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, req.user.id))
        .limit(1);
      if (!pRows[0] || appt.patientId !== pRows[0].id) {
        return res.status(403).json({ message: "Forbidden." });
      }
    }

    return res.status(200).json(appt);
  } catch (error) {
        next(error);
  }
});


  }

  // Mon–Fri 09:00–17:00, Sat 09:00–13:30, Sun closed.
  const day = new Date(`${date}T00:00:00`).getDay();
  const weekend = day === 0;
  const saturday = day === 6;
  if (weekend) return res.status(200).json([]);

  const standardSlots = saturday
    ? ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30"]
    : [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
      ];

  try {
    const booked = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.appointmentDate, date),
          or(
            eq(appointments.status, "confirmed"),
            eq(appointments.status, "pending")
          )
        )
      );
    const bookedTimes = new Set(booked.map((b) => b.appointmentTime));
    const availableSlots = standardSlots.filter((slot) => !bookedTimes.has(slot));
    return res.status(200).json(availableSlots);
  } catch (error) {
    next(error);
  }
});

// 4. POST Create Booking — authenticated patients only.
router.post("/", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  if (req.user.role !== "patient" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden." });
  }

  const {
    serviceId,
    appointmentDate,
    appointmentTime,
    notes,
    patient: patientPayload,
    stripePaymentId,
  } = req.body || {};

  if (!serviceId || !appointmentDate || !appointmentTime) {
    return res.status(400).json({
      message:
        "Missing required booking details (serviceId, appointmentDate, appointmentTime).",
    });
  }

  // Basic guard: never accept past dates / times
  const slot = new Date(`${appointmentDate}T${appointmentTime}:00`);
  if (Number.isNaN(slot.getTime()) || slot.getTime() < Date.now() - 60_000) {
    return res
      .status(400)
      .json({ message: "Please pick a future date and time." });
  }

  try {
    // 1) Resolve service from slug or UUID.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serviceId);
    const sRows = await db
      .select()
      .from(services)
      .where(
        isUuid
          ? or(eq(services.slug, serviceId), eq(services.id, serviceId))
          : eq(services.slug, serviceId)
      )
      .limit(1);
    if (sRows.length === 0) {
      return res
        .status(400)
        .json({ message: `Service not found: ${serviceId}` });
    }
    const resolvedServiceId = sRows[0].id;
    const durationMinutes = sRows[0].durationMinutes || 30;

    // 2) Resolve clinician (any admin user).
    const dRows = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);
    const resolvedDoctorId = dRows[0]?.id || null;

    // 3) Resolve / create the patient profile attached to the JWT user.
    let resolvedPatientId;
    if (req.user.role === "admin") {
      // Admin booking on behalf of someone — require an explicit patientId.
      const adminPatientId = req.body?.patientId;
      if (!adminPatientId) {
        return res
          .status(400)
          .json({ message: "Admin bookings must include a patientId." });
      }
      resolvedPatientId = adminPatientId;
    } else {
      const profile = await resolveOrCreatePatient(req.user, patientPayload);
      resolvedPatientId = profile.id;
    }

    // 4) Execute booking inside a transaction to prevent concurrent double-bookings
    const inserted = await db.transaction(async (tx) => {
      // 4a) Serialize concurrent bookings for the same service using row-level locking
      await tx
        .select()
        .from(services)
        .where(eq(services.id, resolvedServiceId))
        .limit(1)
        .for("update");

      // 4b) Slot collision check (same date+time, not cancelled).
      const collisions = await tx
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.appointmentDate, appointmentDate),
            eq(appointments.appointmentTime, appointmentTime),
            or(
              eq(appointments.status, "pending"),
              eq(appointments.status, "confirmed"),
              eq(appointments.status, "arrived"),
              eq(appointments.status, "in_progress")
            )
          )
        );

      if (collisions.length > 0) {
        const conflictError = new Error("This appointment slot has just been reserved by another patient. Please select another available time.");
        conflictError.status = 409;
        throw conflictError;
      }

      // 4c) Insert appointment as pending
      const [newAppt] = await tx
        .insert(appointments)
        .values({
          patientId: resolvedPatientId,
          serviceId: resolvedServiceId,
          doctorId: resolvedDoctorId,
          appointmentDate,
          appointmentTime,
          durationMinutes,
          status: "pending",
          type: "online",
          notes: notes || null,
          depositPaid: false,
          stripePaymentId: null,
        })
        .returning();
        
      return newAppt;
    });

    // 6) Send a message notification to the admin/doctor
    try {
      await db.insert(messages).values({
        patientId: resolvedPatientId,
        senderRole: req.user.role,
        senderId: req.user.id,
        body: `📅 New appointment booked: ${sRows[0].name} on ${appointmentDate} at ${appointmentTime}.`,
        isRead: false,
      });
    } catch (msgErr) {
      logger.warn({ err: msgErr }, "[appointments] booking notification message failed (non-fatal)");
    }

    // 7) Push-notify all admins and the patient
    try {
      const admins = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"));
      await Promise.all(
        admins.map((admin) =>
          sendPush(admin.id, {
            title: "New booking request",
            body: `${sRows[0].name} on ${appointmentDate} at ${appointmentTime}`,
            url: "/admin/approvals",
            tag: `appointment-${inserted.id}`,
          })
        )
      );

      // Notify the patient if they are not an admin booking for someone else
      if (req.user.role !== "admin") {
        await sendPush(req.user.id, {
          title: "Appointment Request Received",
          body: "Your appointment request has been received and is awaiting clinic approval.",
          url: `/portal/appointments/${inserted.id}`,
          tag: `appointment-${inserted.id}`,
        });
      }
    } catch (_pushErr) {
      // non-fatal; logged inside sendPush
    }

    await logActivity(req, AuditActions.APPOINTMENT_CREATED, {
      targetType: "appointment",
      targetId: inserted.id,
      metadata: {
        serviceSlug: sRows[0].slug,
        appointmentDate,
        appointmentTime,
      },
    });

    return res.status(201).json({
      message: "Appointment booked successfully.",
      appointment: {
        ...inserted,
        // Echo the slug so the client doesn't have to re-resolve.
        serviceId: sRows[0].slug,
      },
    });
  } catch (error) {
    console.error("[appointments] POST failed", error);
    if (error?.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

// 5. PUT Update details (Admin only)
router.put("/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  const { appointmentDate, appointmentTime, notes, status } = req.body;

  try {
    const updatePayload = {
      updatedAt: new Date(),
    };
    if (appointmentDate !== undefined) updatePayload.appointmentDate = appointmentDate;
    if (appointmentTime !== undefined) updatePayload.appointmentTime = appointmentTime;
    if (notes !== undefined) updatePayload.notes = notes;
    if (status !== undefined) updatePayload.status = status;

    const updated = await db
      .update(appointments)
      .set(updatePayload)
      .where(eq(appointments.id, req.params.id))
      .returning();
    if (updated.length === 0) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    const fullAppt = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        serviceId: services.slug,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        durationMinutes: appointments.durationMinutes,
        status: appointments.status,
        type: appointments.type,
        notes: appointments.notes,
        depositPaid: appointments.depositPaid,
        stripePaymentId: appointments.stripePaymentId,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
      })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.id, req.params.id))
      .limit(1);

    return res.status(200).json(fullAppt[0]);
  } catch (error) {
    next(error);
  }
});

// 6. PUT Update Status (Admin only)
router.put(
  "/:id/status",
  verifyToken,
  requireRole("admin"),
  async (req, res, next) => {
    if (!requireDb(res)) return;
    const { status, note } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required." });
    }
    try {
      const updatePayload = { status, updatedAt: new Date() };
      if (note !== undefined) {
        updatePayload.notes = note;
      }

      const updated = await db
        .update(appointments)
        .set(updatePayload)
        .where(eq(appointments.id, req.params.id))
        .returning();
      if (updated.length === 0) {
        return res.status(404).json({ message: "Appointment not found." });
      }

      const fullAppt = await db
        .select({
          id: appointments.id,
          patientId: appointments.patientId,
          serviceId: services.slug,
          doctorId: appointments.doctorId,
          appointmentDate: appointments.appointmentDate,
          appointmentTime: appointments.appointmentTime,
          durationMinutes: appointments.durationMinutes,
          status: appointments.status,
          type: appointments.type,
          notes: appointments.notes,
          depositPaid: appointments.depositPaid,
          stripePaymentId: appointments.stripePaymentId,
          createdAt: appointments.createdAt,
          updatedAt: appointments.updatedAt,
        })
        .from(appointments)
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .where(eq(appointments.id, req.params.id))
        .limit(1);

      // Notify the patient about the new status if we can resolve their user.
      try {
        const target = updated[0];
        if (target?.patientId) {
          const pRows = await db
            .select()
            .from(patients)
            .where(eq(patients.id, target.patientId))
            .limit(1);
          const userId = pRows[0]?.userId;
          if (userId) {
            let bodyText = `Your appointment is now ${STATUS_FRIENDLY[status] || status}.`;
            if (status === "pending") bodyText = "Your appointment request has been received and is awaiting clinic approval.";
            if (status === "confirmed") bodyText = "Your appointment has been confirmed.";
            if (status === "cancelled") bodyText = "This appointment has been cancelled. Please choose another available slot if you wish to reschedule.";
            if (status === "rejected") bodyText = "Your appointment request could not be approved. Please choose another available slot.";
            
            await sendPush(userId, {
              title: "Appointment update",
              body: bodyText,
              url: `/portal/appointments/${target.id}`,
              tag: `appointment-${target.id}`,
            });
          }
        }
      } catch (_pushErr) {
        // non-fatal
      }

      await logActivity(req, AuditActions.APPOINTMENT_STATUS_CHANGED, {
        targetType: "appointment",
        targetId: req.params.id,
        metadata: { status, note: note || null },
      });

      return res.status(200).json(fullAppt[0]);
    } catch (error) {
      next(error);
    }
  }
);

const STATUS_FRIENDLY = {
  pending: "pending review",
  confirmed: "confirmed",
  arrived: "marked as arrived",
  in_progress: "in progress",
  completed: "completed",
  cancelled: "cancelled",
  no_show: "marked as no-show",
};

// 7. PATCH Reschedule (Admin or own Patient).
router.patch("/:id/reschedule", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  const { appointmentDate, appointmentTime, notes } = req.body || {};
  if (!appointmentDate || !appointmentTime) {
    return res
      .status(400)
      .json({ message: "appointmentDate and appointmentTime are required." });
  }

  const slot = new Date(`${appointmentDate}T${appointmentTime}:00`);
  if (Number.isNaN(slot.getTime()) || slot.getTime() < Date.now() - 60_000) {
    return res
      .status(400)
      .json({ message: "Please pick a future date and time." });
  }

  try {
    const rows = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, req.params.id))
      .limit(1);
    const target = rows[0];
    if (!target) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (req.user.role === "patient") {
      const pRows = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, req.user.id))
        .limit(1);
      const ownPatientId = pRows[0]?.id;
      if (!ownPatientId || target.patientId !== ownPatientId) {
        return res
          .status(403)
          .json({ message: "Forbidden. You cannot reschedule that appointment." });
      }
      // Patients cannot reschedule a completed/cancelled visit.
      if (
        ["completed", "cancelled", "no_show"].includes(target.status)
      ) {
        return res
          .status(400)
          .json({ message: "This appointment can no longer be rescheduled." });
      }
    }

    const updated = await db.transaction(async (tx) => {
      // Serialize concurrent bookings and reschedules for the same service using row-level locking
      await tx
        .select()
        .from(services)
        .where(eq(services.id, target.serviceId))
        .limit(1)
        .for("update");

      const collisions = await tx
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.appointmentDate, appointmentDate),
            eq(appointments.appointmentTime, appointmentTime),
            or(
              eq(appointments.status, "pending"),
              eq(appointments.status, "confirmed"),
              eq(appointments.status, "arrived"),
              eq(appointments.status, "in_progress")
            )
          )
        );
      
      const otherCollisions = collisions.filter((c) => c.id !== target.id);
      if (otherCollisions.length > 0) {
        const conflictError = new Error("This appointment slot has just been reserved by another patient. Please select another available time.");
        conflictError.status = 409;
        throw conflictError;
      }

      const [updatedAppt] = await tx
        .update(appointments)
        .set({
          appointmentDate,
          appointmentTime,
          // When a patient reschedules an already-confirmed visit, drop it back
          // to pending so the clinic can reapprove the new time.
          status:
            req.user.role === "patient" && target.status === "confirmed"
              ? "pending"
              : target.status,
          notes: notes !== undefined ? notes : target.notes,
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, target.id))
        .returning();

      return updatedAppt;
    });

    return res.status(200).json([updated]);
  } catch (error) {
    next(error);
  }
});

// 8. DELETE Cancel (Admin or own Patient)
router.delete("/:id", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const rows = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, req.params.id))
      .limit(1);
    const appt = rows[0];
    if (!appt) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (req.user.role === "patient") {
      const pRows = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, req.user.id))
        .limit(1);
      const ownPatientId = pRows[0]?.id;
      if (!ownPatientId || appt.patientId !== ownPatientId) {
        return res
          .status(403)
          .json({ message: "Forbidden. You cannot cancel that appointment." });
      }
    }

    await db
      .update(appointments)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(appointments.id, req.params.id));
      
    return res.status(200).json({ message: "Appointment cancelled successfully." });
  } catch (error) {
    next(error);
  }
});

export default router;
