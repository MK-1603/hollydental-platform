import express from "express";
import { db } from "../config/db.js";
import { messages, patients } from "../db/schema.js";
import { and, asc, eq, gt, isNull, sql } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * Helper — resolve the calling user's patient profile id (or null if they are
 * an admin / staff user).
 */
async function getOwnPatientId(reqUser) {
  if (reqUser.role !== "patient") return null;
  const pRows = await db
    .select()
    .from(patients)
    .where(eq(patients.userId, reqUser.id))
    .limit(1);
  return pRows[0]?.id || null;
}

function requireDb(res) {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({
      message: "Messaging service is not configured (database unavailable).",
    });
    return false;
  }
  return true;
}

/**
 * Project a single message onto the wire format. Soft-deleted messages are
 * returned with a placeholder body but keep their original timestamp/id so
 * the conversation order is preserved.
 */
function projectMessage(row) {
  if (row.deletedAt) {
    return {
      id: row.id,
      patientId: row.patientId,
      senderRole: row.senderRole,
      senderId: row.senderId,
      body: "",
      isRead: row.isRead,
      readAt: row.readAt,
      deleted: true,
      createdAt: row.createdAt,
    };
  }
  return {
    id: row.id,
    patientId: row.patientId,
    senderRole: row.senderRole,
    senderId: row.senderId,
    body: row.body,
    isRead: row.isRead,
    readAt: row.readAt,
    deleted: false,
    createdAt: row.createdAt,
  };
}

/**
 * 1. GET Thread messages for patientId (Admin, or Patient own).
 *
 * Supports an optional `?since=<ISO timestamp>` query so the client can
 * lightly poll for new messages without re-downloading the whole thread.
 */
router.get("/:patientId", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  const { patientId } = req.params;
  const sinceParam = req.query.since;

  try {
    if (req.user.role === "patient") {
      const ownPatientId = await getOwnPatientId(req.user);
      if (!ownPatientId || patientId !== ownPatientId) {
        return res.status(403).json({
          message: "Forbidden. You cannot access messages for other patients.",
        });
      }
    }

    const filters = [eq(messages.patientId, patientId)];
    if (typeof sinceParam === "string" && sinceParam) {
      const sinceDate = new Date(sinceParam);
      if (!Number.isNaN(sinceDate.getTime())) {
        filters.push(gt(messages.createdAt, sinceDate));
      }
    }

    const records = await db
      .select()
      .from(messages)
      .where(and(...filters))
      .orderBy(asc(messages.createdAt));

    // Mark messages sent by the OTHER side as read whenever we're returning
    // the full thread (no `since` filter). This keeps the read receipts
    // accurate without flapping reads on every poll.
    if (!sinceParam) {
      const oppositeRole = req.user.role === "admin" ? "patient" : "admin";
      await db
        .update(messages)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(messages.patientId, patientId),
            eq(messages.senderRole, oppositeRole),
            eq(messages.isRead, false)
          )
        );
    }

    return res.status(200).json(records.map(projectMessage));
  } catch (error) {
    next(error);
  }
});

/**
 * 2. POST Send Message.
 */
router.post("/", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  const { patientId, body } = req.body || {};

  if (!patientId || !body) {
    return res
      .status(400)
      .json({ message: "Patient ID and message body are required." });
  }

  const trimmed = String(body).trim();
  if (!trimmed) {
    return res.status(400).json({ message: "Message body cannot be empty." });
  }

  try {
    if (req.user.role === "patient") {
      const ownPatientId = await getOwnPatientId(req.user);
      if (!ownPatientId || patientId !== ownPatientId) {
        return res.status(403).json({
          message: "Forbidden. You cannot send messages for another patient.",
        });
      }
    }

    const [inserted] = await db
      .insert(messages)
      .values({
        patientId,
        senderRole: req.user.role,
        senderId: req.user.id,
        body: trimmed,
        isRead: false,
      })
      .returning();

    return res.status(201).json(projectMessage(inserted));
  } catch (error) {
    next(error);
  }
});

/**
 * 3. PATCH /messages/:patientId/read — explicit "mark as read" pulse.
 * Lets the client trigger read-receipts the moment a message becomes visible
 * (e.g. window focus) without waiting for the next thread refresh.
 */
router.patch("/:patientId/read", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  const { patientId } = req.params;

  try {
    if (req.user.role === "patient") {
      const ownPatientId = await getOwnPatientId(req.user);
      if (!ownPatientId || patientId !== ownPatientId) {
        return res.status(403).json({ message: "Forbidden." });
      }
    }

    const oppositeRole = req.user.role === "admin" ? "patient" : "admin";
    await db
      .update(messages)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(messages.patientId, patientId),
          eq(messages.senderRole, oppositeRole),
          eq(messages.isRead, false)
        )
      );
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

/**
 * 4. DELETE /messages/:id — soft-delete a single message.
 * Patients can delete their own messages; admins can delete any.
 */
router.delete("/:id", verifyToken, async (req, res, next) => {
  return res.status(403).json({
    message: "Message deletion is disabled to preserve clinic audit trail.",
  });
});

/**
 * 5. GET / — list distinct patient threads with the latest message and
 * unread count. Admin-only.
 */
router.get("/", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden." });
  }

  try {
    const allMessages = await db
      .select()
      .from(messages)
      .orderBy(asc(messages.createdAt));

    const threadMap = new Map();
    for (const msg of allMessages) {
      const existing = threadMap.get(msg.patientId) || {
        patientId: msg.patientId,
        lastMessage: null,
        lastMessageAt: null,
        unreadFromPatient: 0,
      };
      const display = msg.deletedAt ? "Message deleted" : msg.body;
      existing.lastMessage = display;
      existing.lastMessageAt = msg.createdAt;
      if (
        msg.senderRole === "patient" &&
        !msg.isRead &&
        !msg.deletedAt
      ) {
        existing.unreadFromPatient += 1;
      }
      threadMap.set(msg.patientId, existing);
    }

    const threads = Array.from(threadMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessageAt || 0).getTime() -
        new Date(a.lastMessageAt || 0).getTime()
    );

    if (threads.length === 0) return res.status(200).json([]);

    const patientRows = await db.select().from(patients);
    const byId = new Map(patientRows.map((p) => [p.id, p]));

    const enriched = threads.map((t) => {
      const p = byId.get(t.patientId);
      return {
        ...t,
        patient: p
          ? {
              id: p.id,
              firstName: p.firstName,
              lastName: p.lastName,
              email: p.email,
              phone: p.phone,
            }
          : null,
      };
    });

    return res.status(200).json(enriched);
  } catch (error) {
    next(error);
  }
});

export default router;
