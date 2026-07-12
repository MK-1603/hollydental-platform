/**
 * db.js — PostgreSQL connection pool via pg + Drizzle ORM.
 *
 * Pool tuning notes:
 *  - max: 10 connections handles ~100 concurrent requests at 100ms avg query time.
 *    Increase if you see "too many clients" errors under load.
 *  - idleTimeoutMillis: 30s — close idle connections so serverless runtimes
 *    (Neon, Supabase) don't charge for idle connections.
 *  - connectionTimeoutMillis: 5s — fail fast if the DB is unreachable;
 *    prevents requests from hanging indefinitely.
 *  - allowExitOnIdle: false — keep pool alive on Render/Railway free tier.
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema.js";
import { ENV } from "./env.js";
import logger from "../lib/logger.js";

let db;
let pool;

if (ENV.DATABASE_URL) {
  const ssl = ENV.IS_PROD
    ? {
        rejectUnauthorized:
          process.env.PGSSL_REJECT_UNAUTHORIZED === "true",
      }
    : { rejectUnauthorized: false };

  pool = new pg.Pool({
    connectionString: ENV.DATABASE_URL,
    ssl,
    max: parseInt(process.env.DB_POOL_MAX || "10", 10),
    min: parseInt(process.env.DB_POOL_MIN || "2", 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: false,
  });

  // Log pool errors — prevents unhandled 'error' events from crashing the process
  pool.on("error", (err) => {
    logger.error({ err }, "[db] Postgres pool error");
  });

  pool.on("connect", () => {
    logger.debug("[db] New client connected to pool");
  });

  db = drizzle(pool, { schema, logger: false });
  logger.info({ pool: { max: pool.options?.max ?? 10 } }, "[db] Postgres pool initialised");
} else {
  logger.warn("[db] DATABASE_URL is missing — routes that need persistence will return 503");

  // Proxy throws on any access so bugs surface immediately instead of
  // returning undefined silently.
  const requireDb = () => {
    throw new Error("DATABASE_URL is not configured.");
  };
  db = new Proxy({}, { get() { return requireDb; } });
  pool = null;
}

export { db, pool };
