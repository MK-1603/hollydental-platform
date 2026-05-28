import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";

import { ENV } from "./config/env.js";

// Polyfill global crypto for older Node.js versions
if (!globalThis.crypto) {
  globalThis.crypto = crypto;
}

import { globalLimiter, authLimiter, aiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Routes imports
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

const app = express();

// We sit behind a load balancer / Vercel / Render in production. Trust the
// X-Forwarded-* headers so req.ip and `secure` cookies behave correctly.
if (ENV.IS_PROD) {
  app.set("trust proxy", 1);
}

/* -------------------- Security headers -------------------- */
// helmet defaults are good; we explicitly opt-in to a Content Security Policy
// that allows our own assets and the third-party services we actually use.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
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
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

/* -------------------- CORS allow-list -------------------- */
/**
 * The client URL and any extra origins are configured via env. We support:
 *   - CLIENT_URL          (single primary origin, also used elsewhere)
 *   - CORS_ORIGINS        (comma-separated list, exact origins)
 *   - CORS_ORIGIN_PATTERNS (comma-separated list of regex patterns)
 *
 * Vercel preview deployments live on `*.vercel.app`, so we ship a default
 * pattern that allows them automatically. The match is performed with the
 * trailing slash stripped so the request `Origin` header matches whatever
 * the operator typed in the dashboard.
 */
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
      console.warn("[cors] ignoring invalid pattern:", pattern);
      return null;
    }
  })
  .filter(Boolean);
const patternMatchers = [...defaultPatterns, ...allowPatterns];

function isOriginAllowed(origin) {
  if (!origin) return true; // server-to-server / curl / health checks
  const norm = normaliseOrigin(origin);
  if (allowExact.has(norm)) return true;
  return patternMatchers.some((re) => re.test(norm));
}

console.log(
  "[cors] allow-list:",
  Array.from(allowExact).join(", ") || "(none)",
  "+ patterns:",
  patternMatchers.length
);

app.use(
  cors({
    origin: (origin, cb) => {
      if (isOriginAllowed(origin)) {
        return cb(null, true);
      }
      // Important: do NOT throw — the cors middleware would suppress all
      // headers and the browser would see a generic "no Allow-Origin"
      // failure. Instead we explicitly disable CORS for this request,
      // which still lets the response complete with a clear status.
      console.warn(`[cors] blocked origin: ${origin}`);
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

// Make sure preflights are always served — some load balancers strip the
// implicit OPTIONS handler that `cors()` registers.
app.options("*", cors());

/* -------------------- Body parsing & cookies -------------------- */
// Tighter limits for plain JSON; binary uploads have their own multer cap.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

/* -------------------- Rate limiting -------------------- */
app.use("/api/", globalLimiter);
app.use("/api/auth/", authLimiter);

/* -------------------- Routes -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/dental-charts", dentalChartRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wellness", wellnessRoutes);

// SEO routes are mounted at the root so crawlers can find them at the
// canonical /sitemap.xml and /robots.txt paths without an /api prefix.
app.use("/", seoRoutes);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

/* -------------------- Error handler -------------------- */
app.use(errorHandler);

export default app;
