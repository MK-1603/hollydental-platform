/**
 * app.js — Express application factory
 *
 * Middleware order (intentional):
 *  1. Request ID         — must be first so every log line has an ID
 *  2. Trust proxy        — before any IP-based middleware
 *  3. Security headers   — helmet before any response can be sent
 *  4. CORS               — before body parsing
 *  5. Compression        — before body parsing so compressed bodies work
 *  6. Body / cookie parsers
 *  7. Request logger     — after parsers so we can log body size
 *  8. Rate limiters
 *  9. Routes
 * 10. 404 handler
 * 11. Error handler      — must be last
 */

import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import crypto from "crypto";

import { ENV } from "./config/env.js";
import logger from "./lib/logger.js";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { globalLimiter, authLimiter, aiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Route imports
import authRoutes from "./routes/auth.js";
import appointmentRoutes from "./routes/appointments.js";
import patientRoutes from "./routes/patients.js";
import dentalChartRoutes from "./routes/dental-charts.js";
import billingRoutes from "./routes/billing.js";
import paymentRoutes from "./routes/payments.js";
import fileRoutes from "./routes/files.js";
import prescriptionRoutes from "./routes/prescriptions.js";
import messageRoutes from "./routes/messages.js";
import blogRoutes from "./routes/blog.js";
import aiRoutes from "./routes/ai.js";
import analyticsRoutes from "./routes/analytics.js";
import adminRoutes from "./routes/admin.js";
import seoRoutes from "./routes/seo.js";
import newsletterRoutes from "./routes/newsletter.js";
import contactRoutes from "./routes/contact.js";
import pushRoutes from "./routes/push.js";
import notificationRoutes from "./routes/notifications.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import wellnessRoutes from "./routes/wellness.js";
import recordRoutes from "./routes/records.js";
import supplierRoutes from "./routes/suppliers.js";
import searchRoutes from "./routes/search.js";
import settingsRoutes from "./routes/settings.js";
import clinicalRoutes from "./routes/clinical.js";
import staffRoutes from "./routes/staff.js";
import auditRoutes from "./routes/audit.js";
import systemRoutes from "./routes/system.js";
import { cacheResponse } from "./middleware/cache.js";

// Polyfill global crypto for older Node.js versions
if (!globalThis.crypto) {
  globalThis.crypto = crypto;
}

const app = express();

// ── 1. Reverse-proxy trust ────────────────────────────────────────────────────
// Must be set before any IP-based middleware so req.ip reflects the real
// client IP from X-Forwarded-For (Render, Vercel, Nginx, Cloudflare etc.).
if (ENV.IS_PROD) {
  app.set("trust proxy", 1);
}

// ── 2. Request ID ─────────────────────────────────────────────────────────────
// Assigned before everything else so every log line can reference it.
app.use(requestId);

// ── 3. Security headers (Helmet) ──────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Hide X-Powered-By (helmet does this by default, but explicit is better)
    hidePoweredBy: true,
    // HSTS — 1 year, include subdomains in production
    hsts: ENV.IS_PROD
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
    // Content Security Policy
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com",
          "https://images.unsplash.com",
        ],
        "media-src": ["'self'", "https://res.cloudinary.com"],
        "script-src": ["'self'"],
        "connect-src": ["'self'", ENV.CLIENT_URL].filter(Boolean),
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    // Prevent MIME-type sniffing
    noSniff: true,
    // X-Frame-Options
    frameguard: { action: "deny" },
    // XSS filter for older browsers
    xssFilter: true,
  })
);

// ── 4. CORS ───────────────────────────────────────────────────────────────────
function normaliseOrigin(value) {
  return String(value || "")
    .trim()
    .replace(/\/$/, "")
    .toLowerCase();
}

const allowExact = new Set(
  (process.env.CORS_ORIGINS || ENV.CLIENT_URL || "")
    .split(",")
    .map(normaliseOrigin)
    .filter(Boolean)
);

const defaultPatterns = [
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
  /^http:\/\/localhost(:\d+)?$/i,
];
const allowPatterns = (process.env.CORS_ORIGIN_PATTERNS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((pattern) => {
    try {
      return new RegExp(pattern, "i");
    } catch {
      logger.warn(`[cors] ignoring invalid pattern: ${pattern}`);
      return null;
    }
  })
  .filter(Boolean);
const patternMatchers = [...defaultPatterns, ...allowPatterns];

function isOriginAllowed(origin) {
  if (!origin) return true; // server-to-server / curl / health probes
  const norm = normaliseOrigin(origin);
  if (allowExact.has(norm)) return true;
  return patternMatchers.some((re) => re.test(norm));
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (isOriginAllowed(origin)) return cb(null, true);
      logger.warn({ origin }, "[cors] blocked origin");
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: ["X-Request-ID"],
    optionsSuccessStatus: 204,
    maxAge: 86_400, // 24h preflight cache
  })
);
// Ensure preflight is always served even if a load balancer strips OPTIONS
app.options("*", cors());

// ── 5. Compression ────────────────────────────────────────────────────────────
// Compress all text responses > 1 KB. Skip SSE streams (they must stay live).
app.use(
  compression({
    filter: (req, res) => {
      // Never compress SSE responses — they're streaming
      if (res.getHeader("Content-Type")?.includes("text/event-stream")) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, // bytes
  })
);

// ── 6. Body parsing & cookies ─────────────────────────────────────────────────
// Tighter limits for JSON; binary uploads are handled per-route by multer.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// ── 7. Request logger ─────────────────────────────────────────────────────────
app.use(requestLogger);

// ── 8. Rate limiting ──────────────────────────────────────────────────────────
app.use("/api/", globalLimiter);
app.use("/api/auth/", authLimiter);

// ── 9a. Public health check (no auth required) ───────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// ── 9b. Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/appointments", cacheResponse(15, "appointments"), appointmentRoutes);
app.use("/api/patients", cacheResponse(30, "patients"), patientRoutes);
app.use("/api/dental-charts", dentalChartRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", cacheResponse(30, "dashboard"), adminRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/notifications", cacheResponse(15, "notifications"), notificationRoutes);
app.use("/api/products", cacheResponse(300, "products"), productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wellness", wellnessRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/settings", cacheResponse(600, "settings"), settingsRoutes);
app.use("/api/clinical", clinicalRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/system", systemRoutes);

// SEO routes at root — crawlers expect /sitemap.xml and /robots.txt without prefix
app.use("/", seoRoutes);

// ── 10. 404 ───────────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── 11. Error handler ─────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
