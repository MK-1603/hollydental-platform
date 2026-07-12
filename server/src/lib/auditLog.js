import { db } from "../config/db.js";
import { auditLogs } from "../db/schema.js";
import { lt } from "drizzle-orm";
import logger from "./logger.js";

/**
 * How long to retain audit entries. Configurable via AUDIT_RETENTION_DAYS;
 * defaults to 180 days, which covers most clinic record-keeping needs.
 */
const AUDIT_RETENTION_DAYS = parseInt(
  process.env.AUDIT_RETENTION_DAYS || "180",
  10
);

let lastSweepAt = 0;

/**
 * Append an entry to the audit log. Failures are logged but never throw —
 * audit logging must never break a user-facing flow.
 *
 * Lazily trims rows older than AUDIT_RETENTION_DAYS so the table doesn't
 * grow unbounded. The sweep runs at most once every 6 hours.
 */
export async function logActivity(req, action, fields = {}) {
  if (!process.env.DATABASE_URL) return;

  try {
    await db.insert(auditLogs).values({
      actorId: req?.user?.id || fields.actorId || null,
      actorRole: req?.user?.role || fields.actorRole || "system",
      action,
      targetType: fields.targetType || null,
      targetId: fields.targetId || null,
      metadata: fields.metadata || null,
      ip:
        req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req?.ip ||
        null,
      userAgent: req?.headers?.["user-agent"] || null,
    });
  } catch (err) {
    logger.error({ err, action }, "[audit] failed to log activity");
  }

  // Lazy retention sweep — runs at most every 6h.
  const now = Date.now();
  if (now - lastSweepAt > 6 * 60 * 60 * 1000) {
    lastSweepAt = now;
    const cutoff = new Date(now - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    try {
      await db.delete(auditLogs).where(lt(auditLogs.createdAt, cutoff));
    } catch (err) {
      logger.error({ err }, "[audit] retention sweep failed");
    }
  }
}

/**
 * Common action keys — kept as constants so we don't typo them across routes.
 */
export const AuditActions = {
  // Auth
  AUTH_LOGIN_SUCCESS: "auth.login.success",
  AUTH_LOGIN_FAILURE: "auth.login.failure",
  AUTH_LOGOUT: "auth.logout",
  AUTH_REGISTER: "auth.register",
  AUTH_PASSWORD_CHANGED: "auth.password.changed",
  AUTH_PASSWORD_FORCED: "auth.password.force_change_required",
  // Appointments
  APPOINTMENT_CREATED: "appointment.created",
  APPOINTMENT_STATUS_CHANGED: "appointment.status.changed",
  APPOINTMENT_RESCHEDULED: "appointment.rescheduled",
  APPOINTMENT_DELETED: "appointment.deleted",
  // Messages
  MESSAGE_SENT: "message.sent",
  MESSAGE_DELETED: "message.deleted",
  // Files
  FILE_UPLOADED: "file.uploaded",
  FILE_DELETED: "file.deleted",
  // Admin
  ADMIN_USER_DEACTIVATED: "admin.user.deactivated",
  ADMIN_USER_PASSWORD_RESET: "admin.user.password.reset",
};
