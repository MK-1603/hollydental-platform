import express from "express";
import { db } from "../config/db.js";
import { newsletterSubscribers } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { logActivity } from "../lib/auditLog.js";

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/subscribe", async (req, res) => {
  const { email, source } = req.body || {};
  const cleaned = String(email || "").trim().toLowerCase();
  if (!cleaned || !EMAIL_RE.test(cleaned)) {
    return res.status(400).json({ message: "Please provide a valid email." });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ message: "Service is not configured." });
  }

  try {
    const existing = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, cleaned))
      .limit(1);
    if (existing[0]) {
      // Re-activate if previously unsubscribed, otherwise no-op.
      if (existing[0].unsubscribedAt) {
        await db
          .update(newsletterSubscribers)
          .set({ unsubscribedAt: null })
          .where(eq(newsletterSubscribers.id, existing[0].id));
      }
      return res
        .status(200)
        .json({ message: "You're already subscribed — thanks!" });
    }

    await db.insert(newsletterSubscribers).values({
      email: cleaned,
      source: source ? String(source).slice(0, 80) : "public",
      confirmedAt: new Date(),
    });

    await logActivity(req, "newsletter.subscribed", {
      metadata: { email: cleaned, source: source || "public" },
    });

    return res.status(201).json({ message: "Subscribed successfully." });
  } catch (err) {
    next(err);
  }
});

router.post("/unsubscribe", async (req, res) => {
  const { email } = req.body || {};
  const cleaned = String(email || "").trim().toLowerCase();
  if (!cleaned || !EMAIL_RE.test(cleaned)) {
    return res.status(400).json({ message: "Please provide a valid email." });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ message: "Service is not configured." });
  }

  try {
    await db
      .update(newsletterSubscribers)
      .set({ unsubscribedAt: new Date() })
      .where(eq(newsletterSubscribers.email, cleaned));
    return res.status(200).json({ message: "You've been unsubscribed." });
  } catch (err) {
    next(err);
  }
});

export default router;
