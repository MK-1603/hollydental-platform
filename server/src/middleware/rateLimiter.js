/**
 * Rate limiters — express-rate-limit with structured JSON error responses.
 *
 * All limiters use the in-process MemoryStore (default). For multi-instance
 * deployments swap in a Redis store (e.g. rate-limit-redis) without changing
 * any other code — just replace the `store` option below.
 */
import rateLimit from "express-rate-limit";

/** Consistent JSON handler so every 429 has the same shape. */
function rateLimitHandler(req, res) {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please slow down and try again later.",
    retryAfter: res.getHeader("Retry-After"),
    requestId: req.id,
  });
}

function createLimiter(options) {
  return rateLimit({
    standardHeaders: true,   // Return RateLimit-* headers (RFC 6585)
    legacyHeaders: false,    // Don't return X-RateLimit-* headers
    handler: rateLimitHandler,
    skipSuccessfulRequests: false,
    ...options,
  });
}

/**
 * Global API limiter — wide net to stop abusive bots.
 * 500 requests per 15 minutes per IP (reasonable for a clinic portal).
 */
export const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
});

/**
 * Auth limiter — protects login, register, forgot-password, reset-password.
 * 20 attempts per 15 minutes per IP is generous for legitimate users but
 * kills credential-stuffing attacks.
 */
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true, // Successful logins don't count toward the limit
});

/**
 * AI limiter — Gemini calls are expensive; 30/day per IP is ample for real use.
 */
export const aiLimiter = createLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 30,
});

/**
 * Upload limiter — file uploads are resource-intensive.
 * 50 uploads per hour per IP.
 */
export const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 50,
});
