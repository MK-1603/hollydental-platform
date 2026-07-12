import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { generateContent, isGeminiLive } from "../config/gemini.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { prompts, PROMPT_KEYS } from "../config/prompts.js";

const router = express.Router();

// All AI endpoints share the per-IP limiter so a chatbot can't drain Gemini.
router.use(aiLimiter);

/**
 * GET /api/ai/health — surfaces whether Gemini is configured. Used by the
 * admin AI panel to show a real "live"/"offline" status instead of guessing.
 */
router.get("/health", (_req, res) => {
  res.json({ live: isGeminiLive(), prompts: PROMPT_KEYS });
});

/* 1. Public chatbot — used by the floating widget on every public page. */
router.post("/chatbot", async (req, res, next) => {
  const { message, history = [] } = req.body || {};
  if (!message) return res.status(400).json({ message: "Message is required." });

  try {
    const reply = await generateContent(
      prompts.chatbot.systemInstruction(),
      prompts.chatbot.prompt({ message, history })
    );
    return res.status(200).json({ reply });
  } catch (error) {
    next(error);
  }
});

/* 2. Portal assistant — same persona, patient-aware context. */
router.post("/portal-assistant", verifyToken, async (req, res, next) => {
  const { message, history = [], patientName } = req.body || {};
  if (!message) return res.status(400).json({ message: "Message is required." });

  try {
    const reply = await generateContent(
      prompts.portalAssistant.systemInstruction({ patientName }),
      prompts.portalAssistant.prompt({ message, history, patientName })
    );
    return res.status(200).json({ reply });
  } catch (error) {
    next(error);
  }
});

/* 3. Patient clinical summary (admin only). */
router.post(
  "/patient-summary",
  verifyToken,
  requireRole("admin"),
  async (req, res, next) => {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ message: "Patient name is required." });

    try {
      const summary = await generateContent(
        prompts.patientSummary.systemInstruction(),
        prompts.patientSummary.prompt(req.body)
      );
      return res.status(200).json({ summary });
    } catch (error) {
      next(error);
    }
  }
);

/* 4. Review reply (admin only). */
router.post(
  "/review-reply",
  verifyToken,
  requireRole("admin"),
  async (req, res, next) => {
    const { reviewText } = req.body || {};
    if (!reviewText) {
      return res.status(400).json({ message: "reviewText is required." });
    }

    try {
      const reply = await generateContent(
        prompts.reviewReply.systemInstruction(),
        prompts.reviewReply.prompt(req.body)
      );
      return res.status(200).json({ reply });
    } catch (error) {
      next(error);
    }
  }
);

/* 5. Blog generator (admin only). */
router.post(
  "/blog-generate",
  verifyToken,
  requireRole("admin"),
  async (req, res, next) => {
    const { topic, wordCount } = req.body || {};
    if (!topic) return res.status(400).json({ message: "Topic is required." });

    try {
      const article = await generateContent(
        prompts.blogArticle.systemInstruction({ wordCount }),
        prompts.blogArticle.prompt(req.body)
      );
      return res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  }
);

/* 6. Symptom checker (public). */
router.post("/symptom-check", async (req, res, next) => {
  const { symptom } = req.body || {};
  if (!symptom) return res.status(400).json({ message: "Symptom is required." });

  try {
    const advice = await generateContent(
      prompts.symptomCheck.systemInstruction(),
      prompts.symptomCheck.prompt(req.body)
    );
    return res.status(200).json({ advice });
  } catch (error) {
    next(error);
  }
});

/* 7. Follow-up reminder (admin only). */
router.post(
  "/followup-reminder",
  verifyToken,
  requireRole("admin"),
  async (req, res, next) => {
    const { name, treatment } = req.body || {};
    if (!name || !treatment) {
      return res
        .status(400)
        .json({ message: "Patient name and treatment are required." });
    }

    try {
      const smsText = await generateContent(
        prompts.followUpReminder.systemInstruction(),
        prompts.followUpReminder.prompt(req.body)
      );
      return res.status(200).json({ smsText });
    } catch (error) {
      next(error);
    }
  }
);

/* 8. Prescription note (admin only). */
router.post(
  "/prescription-note",
  verifyToken,
  requireRole("admin"),
  async (req, res, next) => {
    const { drugName } = req.body || {};
    if (!drugName) {
      return res.status(400).json({ message: "Drug name is required." });
    }

    try {
      const note = await generateContent(
        prompts.prescriptionNote.systemInstruction(),
        prompts.prescriptionNote.prompt(req.body)
      );
      return res.status(200).json({ note });
    } catch (error) {
            next(error);
    }
  }
);

export default router;
