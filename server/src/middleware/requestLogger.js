/**
 * HTTP request/response logger middleware using Pino.
 *
 * Logs:
 *  - Incoming request (method, url, ip, user-agent)
 *  - Outgoing response (status, duration)
 *
 * Skips logging for health-check endpoints to avoid log pollution.
 */
import logger from "../lib/logger.js";

const SKIP_PATHS = new Set(["/health", "/api/system/health", "/favicon.ico"]);

export function requestLogger(req, res, next) {
  if (SKIP_PATHS.has(req.path)) return next();

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level](
      {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip:
          req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip,
        userAgent: req.headers["user-agent"],
        userId: req.user?.id || null,
      },
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}
