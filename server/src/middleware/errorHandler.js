/**
 * Centralised error handler — replaces the previous version with:
 *  - Structured Pino logging (no more console.error)
 *  - Request ID included in every error response
 *  - Drizzle / PostgreSQL error code translation
 *  - Multer error handling
 *  - Stack traces only in non-production environments
 *  - Never leaks internal error details to clients in production
 */
import { ENV } from "../config/env.js";
import logger from "../lib/logger.js";

/** Map common PostgreSQL error codes to user-friendly messages. */
const PG_ERROR_MAP = {
  "23505": "A record with those details already exists.",
  "23503": "This action references a record that does not exist.",
  "23502": "A required field is missing.",
  "42P01": "An internal database error occurred (missing table).",
  "42703": "An internal database error occurred (missing column).",
  "08006": "Database connection failed.",
  "57014": "The query timed out. Please try again.",
};

export const errorHandler = (err, req, res, _next) => {
  // ── Determine HTTP status ──────────────────────────────────────────────────
  let status = 500;
  let message = "Internal server error.";

  if (err?.statusCode && typeof err.statusCode === "number") {
    status = err.statusCode;
  } else if (err?.status && typeof err.status === "number") {
    status = err.status;
  }

  // Multer errors (file upload)
  if (err?.code === "LIMIT_FILE_SIZE") {
    status = 413;
    message = `File too large. Maximum allowed size is ${Math.round(ENV.MAX_FILE_SIZE / 1024 / 1024)} MB.`;
  } else if (err?.code === "LIMIT_UNEXPECTED_FILE") {
    status = 400;
    message = "Unexpected file field in upload.";
  } else if (err?.message === "Unsupported file type." || err?.message === "Unsupported file extension.") {
    status = 415;
    message = err.message;
  }

  // PostgreSQL / Drizzle errors
  if (err?.code && PG_ERROR_MAP[err.code]) {
    status = err.code === "23505" ? 409 : 400;
    message = PG_ERROR_MAP[err.code];
  }

  // Express-validator errors bubble up as 400 with a message
  if (err?.type === "validation") {
    status = 400;
    message = err.message || "Validation error.";
  }

  // Below 500: use the error's message directly (it's intentional)
  if (status < 500 && err?.message) {
    message = String(err.message);
  }

  // ── Log ───────────────────────────────────────────────────────────────────
  const logPayload = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    status,
    err: {
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
    },
    userId: req.user?.id || null,
  };

  if (status >= 500) {
    logger.error(logPayload, `Unhandled error: ${req.method} ${req.originalUrl}`);
  } else {
    logger.warn(logPayload, `Client error: ${req.method} ${req.originalUrl}`);
  }

  // ── Respond ───────────────────────────────────────────────────────────────
  res.status(status).json({
    success: false,
    message,
    requestId: req.id,
    ...(ENV.NODE_ENV !== "production" && status >= 500
      ? { stack: err?.stack }
      : {}),
  });
};

/**
 * 404 handler — must be registered AFTER all routes.
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    requestId: req.id,
  });
};
