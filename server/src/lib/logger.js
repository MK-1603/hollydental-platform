/**
 * Structured logger — Pino with environment-aware configuration.
 *
 * Development: human-readable pretty-print via pino-pretty
 * Production:  JSON NDJSON, machine-parseable by log aggregators
 *
 * Usage:
 *   import logger from './lib/logger.js';
 *   logger.info({ userId: 'abc' }, 'User logged in');
 *   logger.error({ err }, 'DB query failed');
 */

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  // Redact fields that must never appear in logs
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.secret",
      "*.apiKey",
      "*.p256dh",
      "*.auth",
    ],
    censor: "[REDACTED]",
  },
  // Serialisers normalise the most common objects
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});

export default logger;
