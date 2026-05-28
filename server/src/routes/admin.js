import express from "express";
import { db } from "../config/db.js";
import { users, patients, auditLogs, passwordResetTokens } from "../db/schema.js";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { logActivity, AuditActions } from "../lib/auditLog.js";
import { ENV } from "../config/env.js";

const router = express.Router();

function requireDb(res) {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ message: "Admin service is not configured." });
    return false;
  }
  return true;
}

/**
 * 1. Force a user to change their password on next login.
 *    Body: { reason?: string }
 */
router.post(
  "/users/:id/force-password-change",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    if (!requireDb(res)) return;
    const { reason } = req.body || {};

    try {
      const targetRows = await db
        .select()
        .from(users)
        .where(eq(users.id, req.params.id))
        .limit(1);
      const target = targetRows[0];
      if (!target) {
        return res.status(404).json({ message: "User not found." });
      }

      await db
        .update(users)
        .set({ mustChangePassword: true, updatedAt: new Date() })
        .where(eq(users.id, target.id));

      await logActivity(req, AuditActions.ADMIN_USER_PASSWORD_RESET, {
        targetType: "user",
        targetId: target.id,
        metadata: { reason: reason || null, email: target.email },
      });

      return res.status(200).json({
        message: "Password reset required for this user.",
        user: {
          id: target.id,
          email: target.email,
          role: target.role,
          mustChangePassword: true,
        },
      });
    } catch (err) {
      console.error("[admin.force_password_change] failed", err);
      return res
        .status(500)
        .json({ message: "Failed to enforce password reset." });
    }
  }
);

/**
 * 2. List recent audit log entries.
 *    Supports ?limit, ?action, ?actorId, ?targetId, ?since.
 */
router.get(
  "/audit-logs",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    if (!requireDb(res)) return;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const { action, actorId, targetId, since, search } = req.query;

    try {
      const filters = [];
      if (action) filters.push(eq(auditLogs.action, String(action)));
      if (actorId) filters.push(eq(auditLogs.actorId, String(actorId)));
      if (targetId) filters.push(eq(auditLogs.targetId, String(targetId)));
      if (since) {
        const date = new Date(String(since));
        if (!Number.isNaN(date.getTime())) {
          filters.push(sql`${auditLogs.createdAt} >= ${date}`);
        }
      }
      if (search) {
        filters.push(
          or(
            ilike(auditLogs.action, `%${search}%`),
            ilike(auditLogs.targetType, `%${search}%`)
          )
        );
      }

      const rows = await db
        .select()
        .from(auditLogs)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);

      return res.status(200).json(rows);
    } catch (err) {
      console.error("[admin.audit_logs] failed", err);
      return res.status(500).json({ message: "Failed to load audit logs." });
    }
  }
);

/**
 * 4. List pending password reset requests with the human-readable code so
 * staff can read it back to the patient (no email is sent).
 */
router.get(
  "/password-resets",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    if (!requireDb(res)) return;
    try {
      const rows = await db
        .select({
          id: passwordResetTokens.id,
          userId: passwordResetTokens.userId,
          status: passwordResetTokens.status,
          displayCode: passwordResetTokens.displayCode,
          expiresAt: passwordResetTokens.expiresAt,
          createdAt: passwordResetTokens.createdAt,
          usedAt: passwordResetTokens.usedAt,
          resolvedAt: passwordResetTokens.resolvedAt,
          email: users.email,
          role: users.role,
        })
        .from(passwordResetTokens)
        .leftJoin(users, eq(passwordResetTokens.userId, users.id))
        .orderBy(desc(passwordResetTokens.createdAt));
      return res.status(200).json(rows);
    } catch (err) {
      console.error("[admin.password_resets] failed", err);
      return res
        .status(500)
        .json({ message: "Failed to load password reset queue." });
    }
  }
);

/**
 * 5. Mark a reset request resolved (admin spoke to the patient and read out
 * the code, or determined the request was illegitimate).
 */
router.post(
  "/password-resets/:id/resolve",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    if (!requireDb(res)) return;
    try {
      const [updated] = await db
        .update(passwordResetTokens)
        .set({
          status: "resolved",
          resolvedAt: new Date(),
          resolvedBy: req.user.id,
          displayCode: null,
        })
        .where(eq(passwordResetTokens.id, req.params.id))
        .returning();
      if (!updated) {
        return res.status(404).json({ message: "Reset request not found." });
      }
      await logActivity(req, "auth.password.reset_resolved", {
        targetType: "password_reset",
        targetId: req.params.id,
      });
      return res.status(200).json({ message: "Marked as resolved." });
    } catch (err) {
      console.error("[admin.password_resets.resolve] failed", err);
      return res.status(500).json({ message: "Failed to update request." });
    }
  }
);


/**
 * 6. List clinic staff accounts (role = "admin"). Used by the Team tab in
 *    System Settings so the principal dentist can see who has access.
 */
router.get(
  "/staff",
  verifyToken,
  requireRole("admin"),
  async (_req, res) => {
    if (!requireDb(res)) return;
    try {
      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          isActive: users.isActive,
          mustChangePassword: users.mustChangePassword,
          profilePicUrl: users.profilePicUrl,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.role, "admin"))
        .orderBy(desc(users.createdAt));
      return res.status(200).json(rows);
    } catch (err) {
      console.error("[admin.staff] failed", err);
      return res.status(500).json({ message: "Failed to load staff list." });
    }
  }
);

/**
 * 7. Create a new doctor / clinical admin account.
 *
 *    Body: { email, password? }
 *
 *    If `password` is omitted we generate a 12-character temporary
 *    password and return it in the response so the issuing admin can hand
 *    it to the new doctor in person. The new account is forced to change
 *    the password on first login.
 */
router.post(
  "/staff",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    if (!requireDb(res)) return;

    const { email, password, name } = req.body || {};
    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ message: "A valid email is required." });
    }

    let temporaryPassword =
      typeof password === "string" && password.length >= 8 ? password : null;
    if (!temporaryPassword) {
      // 12 chars, mix of upper/lower/digits — crypto-random.
      temporaryPassword = crypto.randomBytes(9).toString("base64url").slice(0, 12);
    }

    try {
      const existing = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.email, cleanEmail))
        .limit(1);
      if (existing.length > 0) {
        return res
          .status(409)
          .json({ message: "An account with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(temporaryPassword, 10);
      const [inserted] = await db
        .insert(users)
        .values({
          email: cleanEmail,
          passwordHash,
          role: "admin",
          isActive: true,
          mustChangePassword: true,
        })
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          mustChangePassword: users.mustChangePassword,
          isActive: users.isActive,
          createdAt: users.createdAt,
        });

      await logActivity(req, "admin.user.created", {
        targetType: "user",
        targetId: inserted.id,
        metadata: { email: inserted.email, role: "admin", name: name || null },
      });

      const baseUrl = (ENV.CLIENT_URL || "http://localhost:3000").replace(
        /\/$/,
        ""
      );
      // Sign-in page with email pre-filled. The client falls back to the
      // generic /portal/login if /admin/login is not the desired entry.
      const loginUrl = `${baseUrl}/portal/login?email=${encodeURIComponent(
        inserted.email
      )}`;

      const inviteSubject = `Your ${
        process.env.CLINIC_NAME || "Hollyhill Dental"
      } clinical portal account`;
      const inviteBody = [
        `Hello${name ? ` ${name}` : ""},`,
        ``,
        `An admin account has been created for you on the ${
          process.env.CLINIC_NAME || "Hollyhill Dental"
        } clinical portal.`,
        ``,
        `Sign-in link: ${loginUrl}`,
        `Email:        ${inserted.email}`,
        `Temporary password: ${temporaryPassword}`,
        ``,
        `For your security, you'll be asked to choose a new password the first time you sign in. The temporary password above will stop working after that.`,
        ``,
        `If you weren't expecting this invitation, please ignore this message or contact the clinic.`,
      ].join("\n");

      return res.status(201).json({
        message: "Doctor account created.",
        user: inserted,
        temporaryPassword,
        loginUrl,
        invite: {
          subject: inviteSubject,
          body: inviteBody,
        },
      });
    } catch (err) {
      console.error("[admin.staff.create] failed", err);
      return res
        .status(500)
        .json({ message: "Failed to create doctor account." });
    }
  }
);

/**
 * 8. Activate / deactivate a staff account. We never hard-delete admin
 *    rows because audit logs reference them; flipping `isActive` blocks
 *    login while preserving history.
 */
router.patch(
  "/staff/:id/status",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    if (!requireDb(res)) return;
    const { isActive } = req.body || {};
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be a boolean." });
    }
    if (req.params.id === req.user.id && !isActive) {
      return res
        .status(400)
        .json({ message: "You can't deactivate your own account." });
    }

    try {
      const [updated] = await db
        .update(users)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(users.id, req.params.id), eq(users.role, "admin")))
        .returning({
          id: users.id,
          email: users.email,
          isActive: users.isActive,
        });
      if (!updated) {
        return res.status(404).json({ message: "Staff account not found." });
      }
      await logActivity(req, "admin.user.status_changed", {
        targetType: "user",
        targetId: updated.id,
        metadata: { isActive },
      });
      return res.status(200).json({ user: updated });
    } catch (err) {
      console.error("[admin.staff.status] failed", err);
      return res
        .status(500)
        .json({ message: "Failed to update staff status." });
    }
  }
);

export default router;
