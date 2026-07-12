/**
 * server.js — Entry point for the Hollyhill Dental backend.
 *
 * Startup sequence:
 *  1. Validate environment / config
 *  2. Run database migrations (blocking — fails fast on schema errors)
 *  3. Seed reference data (idempotent)
 *  4. Initialise background workers
 *  5. Start HTTP server
 *
 * Shutdown sequence (SIGTERM / SIGINT):
 *  1. Stop accepting new connections
 *  2. Drain in-flight requests (30 s timeout)
 *  3. Log "shutdown complete"
 *  4. Exit with code 0
 */

import app from "./app.js";
import { runMigrations } from "./db/migrate.js";
import { seedDatabase } from "./db/seed.js";
import { initWorkers } from "./workers/index.js";
import logger from "./lib/logger.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const SHUTDOWN_TIMEOUT_MS = 30_000;

// ── Global error guards ───────────────────────────────────────────────────────
// Log and continue in development; in production an orchestrator will restart.
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Promise Rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught Exception — server will exit");
  process.exit(1);
});

// ── Startup ───────────────────────────────────────────────────────────────────
async function startServer() {
  const startTime = Date.now();

  logger.info("╔══════════════════════════════════════════╗");
  logger.info("║     Hollyhill Dental — Starting up       ║");
  logger.info("╚══════════════════════════════════════════╝");
  logger.info({
    nodeVersion: process.version,
    env: process.env.NODE_ENV || "development",
    port: PORT,
  }, "Boot diagnostics");

  try {
    // 1. Migrations — exits with code 1 on failure via re-throw in migrate.js
    await runMigrations();

    // 2. Reference data seed (idempotent — safe to run every boot)
    await seedDatabase();

    // 3. Background workers
    initWorkers();

    // 4. HTTP server
    const server = app.listen(PORT, () => {
      const elapsed = Date.now() - startTime;
      logger.info(
        { port: PORT, env: process.env.NODE_ENV || "development", elapsed: `${elapsed}ms` },
        `Hollyhill Dental backend ready in ${elapsed}ms`
      );
    });

    // ── Graceful shutdown ───────────────────────────────────────────────────
    function shutdown(signal) {
      logger.info({ signal }, "Shutdown signal received — draining connections");

      const forceExitTimer = setTimeout(() => {
        logger.warn("Graceful shutdown timed out — forcing exit");
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);
      // Don't keep the process alive just for this timer
      forceExitTimer.unref();

      server.close((err) => {
        if (err) {
          logger.error({ err }, "Error during server close");
          process.exit(1);
        }
        logger.info("All connections drained — shutdown complete");
        process.exit(0);
      });
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    return server;
  } catch (error) {
    logger.fatal({ err: error }, "Failed to start Hollyhill Dental backend");
    process.exit(1);
  }
}

startServer();
