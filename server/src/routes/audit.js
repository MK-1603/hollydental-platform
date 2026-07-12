import express from "express";
import { db } from "../config/db.js";
import { auditLogs, users } from "../db/schema.js";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";

const router = express.Router();

// GET /api/audit — admin only, server-side filtering
router.get("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { search, action, actorId, limit: limitParam, since } = req.query;
    const limit = Math.min(500, Math.max(1, parseInt(limitParam, 10) || 100));

    const conditions = [];

    if (action) conditions.push(eq(auditLogs.action, String(action)));
    if (actorId) conditions.push(eq(auditLogs.actorId, String(actorId)));
    if (since) {
      const d = new Date(String(since));
      if (!Number.isNaN(d.getTime())) {
        conditions.push(sql`${auditLogs.createdAt} >= ${d}`);
      }
    }
    if (search) {
      const term = `%${String(search).trim()}%`;
      conditions.push(
        or(
          ilike(auditLogs.action, term),
          ilike(auditLogs.targetType, term),
          ilike(users.email, term),
          ilike(users.displayName, term)
        )
      );
    }

    const records = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        metadata: auditLogs.metadata,
        ip: auditLogs.ip,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
        actorId: auditLogs.actorId,
        actorRole: auditLogs.actorRole,
        actorEmail: users.email,
        actorName: users.displayName,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    res.json(records);
  } catch (error) {
    next(error);
  }
});

// POST /api/audit — admin only, manual log entry
router.post("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { action, targetType, targetId, metadata } = req.body;

    if (!action) {
      return res.status(400).json({ error: "Action is required" });
    }

    const [newLog] = await db
      .insert(auditLogs)
      .values({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: String(action).slice(0, 100),
        targetType: targetType ? String(targetType).slice(0, 50) : null,
        targetId: targetId || null,
        metadata: metadata || null,
        ip: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip,
        userAgent: req.headers["user-agent"] || null,
      })
      .returning();

    res.status(201).json(newLog);
  } catch (error) {
    next(error);
  }
});

export default router;
