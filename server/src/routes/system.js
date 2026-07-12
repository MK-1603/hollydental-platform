/**
 * system.js — Internal system status, health probes and Prometheus metrics.
 *
 * GET /api/system/health    — detailed internal health (auth required)
 * GET /api/system/metrics   — Prometheus scrape endpoint (no auth — restrict at network level)
 * GET /api/system/backup    — backup config stub (auth required)
 * POST /api/system/backup   — trigger backup stub (auth required)
 * POST /api/system/backup/restore  — restore stub
 * GET /api/system/backup/status    — backup status stub
 * GET /api/system/backup/history   — backup history stub
 *
 * The public /health route lives in app.js for liveness probes that don't
 * need auth (Render / Railway / k8s probes).
 */

import express from "express";
import os from "os";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { metricsRegistry } from "../config/metrics.js";
import { db } from "../config/db.js";
import { sql } from "drizzle-orm";
import logger from "../lib/logger.js";

const router = express.Router();

// ── Detailed health check (admin only) ───────────────────────────────────────
router.get("/health", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const memory = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Quick DB liveness probe
    let dbStatus = "connected";
    let dbLatencyMs = null;
    if (process.env.DATABASE_URL) {
      const t0 = Date.now();
      try {
        await db.execute(sql`SELECT 1`);
        dbLatencyMs = Date.now() - t0;
      } catch {
        dbStatus = "error";
      }
    } else {
      dbStatus = "not_configured";
    }

    res.json({
      status: dbStatus === "error" ? "degraded" : "healthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      platform: os.platform(),
      cpus: os.cpus().length,
      loadAvg: os.loadavg().map((v) => v.toFixed(2)),
      memory: {
        heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        rssMb: Math.round(memory.rss / 1024 / 1024),
        externalMb: Math.round(memory.external / 1024 / 1024),
      },
      systemMemory: {
        totalGb: (totalMem / 1024 / 1024 / 1024).toFixed(2),
        usedGb: (usedMem / 1024 / 1024 / 1024).toFixed(2),
        freeGb: (freeMem / 1024 / 1024 / 1024).toFixed(2),
        percentUsed: Math.round((usedMem / totalMem) * 100),
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      workers: {
        backupQueue: "active",
        notificationQueue: "active",
        emailQueue: "active",
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── Prometheus metrics scrape endpoint ───────────────────────────────────────
// No auth — restrict via network/firewall in production.
router.get("/metrics", async (_req, res, next) => {
  try {
    res.set("Content-Type", metricsRegistry.contentType);
    const metrics = await metricsRegistry.metrics();
    res.send(metrics);
  } catch (error) {
    next(error);
  }
});

// ── Backup stubs ──────────────────────────────────────────────────────────────
// These are placeholder responses. Wire up a real backup provider
// (pg_dump → S3, Cloudflare R2, etc.) when ready.

router.get("/backup", verifyToken, requireRole("admin"), (_req, res) => {
  res.json({
    success: true,
    enabled: false,
    message: "Automated backup is not yet configured. Connect a backup provider in your environment.",
  });
});

router.post("/backup", verifyToken, requireRole("admin"), (req, res) => {
  const backupId = `bkp_manual_${Date.now()}`;
  logger.info({ backupId, userId: req.user.id }, "[backup] Manual backup triggered");
  res.json({
    success: true,
    backupId,
    status: "queued",
    message: "Backup queued. Connect a real backup provider to execute.",
    timestamp: new Date().toISOString(),
  });
});

router.post("/backup/restore", verifyToken, requireRole("admin"), (req, res) => {
  const { backupId } = req.body || {};
  if (!backupId) return res.status(400).json({ success: false, message: "backupId is required." });
  logger.warn({ backupId, userId: req.user.id }, "[backup] Restore requested");
  res.json({
    success: true,
    message: `Restore from ${backupId} queued. Connect a backup provider to execute.`,
  });
});

router.get("/backup/status", verifyToken, requireRole("admin"), (_req, res) => {
  res.json({ success: true, status: "idle", message: "No backup provider configured." });
});

router.get("/backup/history", verifyToken, requireRole("admin"), (_req, res) => {
  res.json({ success: true, history: [] });
});

export default router;
