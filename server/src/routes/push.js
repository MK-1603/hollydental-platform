import express from "express";
import { db } from "../config/db.js";
import { pushSubscriptions } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { getVapidPublicKey } from "../lib/push.js";
import { logActivity } from "../lib/auditLog.js";

const router = express.Router();

/**
 * GET /api/push/public-key — expose the VAPID public key so the browser can
 * register a PushManager subscription.
 */
router.get("/public-key", (_req, res) => {
  const key = getVapidPublicKey();
  if (!key) {
    return res
      .status(503)
      .json({ message: "Push notifications are not configured." });
  }
  return res.status(200).json({ key });
});

/** POST /api/push/subscribe — store the browser's PushSubscription. */
router.post("/subscribe", verifyToken, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ message: "Service is not configured." });
  }
  const { endpoint, keys, userAgent } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res
      .status(400)
      .json({ message: "Subscription endpoint and keys are required." });
  }

  try {
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .limit(1);
    if (existing[0]) {
      // Re-attach to current user in case they're on a shared device.
      await db
        .update(pushSubscriptions)
        .set({
          userId: req.user.id,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: userAgent || req.headers["user-agent"] || null,
        })
        .where(eq(pushSubscriptions.id, existing[0].id));
    } else {
      await db.insert(pushSubscriptions).values({
        userId: req.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || req.headers["user-agent"] || null,
      });
    }

    await logActivity(req, "push.subscribed", {
      targetType: "user",
      targetId: req.user.id,
      metadata: { endpoint },
    });

    return res.status(201).json({ message: "Subscribed to push notifications." });
  } catch (err) {
    next(err);
  }
});

/** POST /api/push/unsubscribe — remove a subscription by endpoint. */
router.post("/unsubscribe", verifyToken, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ message: "Service is not configured." });
  }
  const { endpoint } = req.body || {};
  if (!endpoint) {
    return res.status(400).json({ message: "Endpoint is required." });
  }
  try {
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userId, req.user.id)
        )
      );

    await logActivity(req, "push.unsubscribed", {
      targetType: "user",
      targetId: req.user.id,
      metadata: { endpoint },
    });

    return res.status(200).json({ message: "Unsubscribed." });
  } catch (err) {
    next(err);
  }
});

export default router;
