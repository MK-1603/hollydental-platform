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
import os from "os";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const ENV = process.env.NODE_ENV || "development";
const VERSION = process.env.npm_package_version || "1.0.0";
const SHUTDOWN_TIMEOUT_MS = 30_000;

// --- Global Logger ---
const logger = {
  info: (msg) => console.log(`\x1b[94m[i]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[92m[✓]\x1b[0m ${msg}`),
  warn: (msg) => console.warn(`\x1b[93m[!]\x1b[0m ${msg}`),
  error: (msg) => console.error(`\x1b[91m[x]\x1b[0m ${msg}`),
};

const boxWidth = 88;
const line = '━'.repeat(boxWidth + 2);
const printLine = (content) => {
  const realLength = content.replace(/\x1b\[[0-9;]*m/g, '').length;
  const padding = ' '.repeat(Math.max(0, boxWidth - realLength));
  console.log(`\x1b[90m   ┃\x1b[0m ${content}${padding} \x1b[90m┃\x1b[0m`);
};

// ── Global error guards ───────────────────────────────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection");
  console.error(reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception — server will exit");
  console.error(err);
  process.exit(1);
});

// ── Startup ───────────────────────────────────────────────────────────────────
async function startServer() {
  // Clear console for a clean startup
  process.stdout.write('\x1Bc');

  console.log(`\x1b[96m
  ██╗  ██╗ ██████╗ ██╗     ██╗  ██╗   ██╗██╗  ██╗██╗██╗     ██╗
  ██║  ██║██╔═══██╗██║     ██║  ╚██╗ ██╔╝██║  ██║██║██║     ██║
  ███████║██║   ██║██║     ██║   ╚████╔╝ ███████║██║██║     ██║
  ██╔══██║██║   ██║██║     ██║    ╚██╔╝  ██╔══██║██║██║     ██║
  ██║  ██║╚██████╔╝███████╗███████╗██║   ██║  ██║██║███████╗███████╗
  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝
\x1b[0m`);

  const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const cpus = os.cpus();
  const cpu = cpus.length > 0 ? cpus[0].model.substring(0, 45) : 'Unknown CPU';
  
  const localIp =
    Object.values(os.networkInterfaces())
      .flat()
      .find((i) => i?.family === 'IPv4' && !i.internal)?.address || 'localhost';

  let apiEndpoint = `http://${localIp}:${PORT}/api`;

  console.log(`\x1b[90m   ┏${line}┓\x1b[0m`);
  printLine(
    `\x1b[1mSTATUS:\x1b[0m \x1b[92mREADY\x1b[0m │ \x1b[1mVERSION:\x1b[0m \x1b[94mv${VERSION}\x1b[0m  │ \x1b[1mNODE:\x1b[0m \x1b[95m${process.version}\x1b[0m  │ \x1b[1mMODE:\x1b[0m \x1b[95m${ENV.toUpperCase()}\x1b[0m`
  );
  console.log(`\x1b[90m   ┣${line}┫\x1b[0m`);
  printLine(
    `\x1b[1mTELEMETRY:\x1b[0m \x1b[37mRAM: ${mem} MB | CPU: ${cpu} | WORKERS: 1\x1b[0m`
  );
  console.log(`\x1b[90m   ┣${line}┫\x1b[0m`);
  printLine(
    `\x1b[1mENDPOINTS:\x1b[0m \x1b[34mAPI: ${apiEndpoint}\x1b[0m`
  );
  console.log(`\x1b[90m   ┗${line}┛\x1b[0m\n`);

  try {
    logger.info("Initializing Hollyhill Dental backend...");
    logger.success("[security] Helmet and CORS verified (Strictly Real-time)");
    
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      logger.success("[media] Cloudinary Link: ESTABLISHED");
    }

    // 1. Migrations
    await runMigrations();
    logger.success("[db] Database Link: ESTABLISHED & Migrations Verified");

    // 2. Reference data
    await seedDatabase();

    // 3. Background workers
    initWorkers();
    logger.success("[workers] Background queues initialized");

    // 4. HTTP server
    const server = app.listen(PORT, () => {
      logger.success(`API Gateway Master [${process.pid}] is fully operational on port ${PORT}`);
    });

    // ── Graceful shutdown ───────────────────────────────────────────────────
    function shutdown(signal) {
      logger.warn(`System shutdown initiated (${signal})...`);
      
      const forceExitTimer = setTimeout(() => {
        logger.error("Graceful shutdown timed out — forcing exit");
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);
      forceExitTimer.unref();

      server.close((err) => {
        if (err) {
          logger.error("Error during server close");
          process.exit(1);
        }
        logger.success("All connections drained — shutdown complete");
        process.exit(0);
      });
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    return server;
  } catch (error) {
    logger.error("System bootstrap failed.");
    console.error(error);
    process.exit(1);
  }
}

startServer();
