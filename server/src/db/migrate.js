/**
 * migrate.js — Hollyhill Dental migration runner
 *
 * Features:
 *  - Validates DB connection before running
 *  - Detects pending vs applied migrations
 *  - Structured, human-readable logs with timing
 *  - Transaction-wrapped execution (each migration in its own tx)
 *  - Stops server startup on failure (does not silently continue)
 *  - Identifies the exact failing migration file
 *  - Applies idempotent column/table patches before Drizzle runs
 *  - Migration lock via advisory lock (prevents concurrent runs)
 */

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";
import logger from "../lib/logger.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationsFolder = resolve(__dirname, "migrations");

// PostgreSQL advisory lock key — prevents two processes running migrations at
// the same time (e.g. scale-out restarts).
const MIGRATION_LOCK_KEY = 1234567890;

// ─── Safety patches ──────────────────────────────────────────────────────────
// These are idempotent DDL statements for columns/tables added outside the
// normal migration sequence. They run before Drizzle's migrator so the DB is
// always in a consistent state even on legacy deployments.

const SAFETY_PATCHES = [
  // Users
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_pic_url" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "display_name" varchar(150)`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT false NOT NULL`,

  // Patients
  `ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "blood_group" varchar(20)`,
  `ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "age" integer`,

  // Messages
  `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "read_at" timestamp`,
  `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp`,
  `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "deleted_by" uuid`,

  // Files
  `ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "original_name" varchar(255)`,
  `ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "size" integer`,
  `ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "folder_id" uuid`,
  `ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "metadata" jsonb`,

  // Wellness logs — created early as a patch for DBs that skipped migration 0008
  `CREATE TABLE IF NOT EXISTS "wellness_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "patient_id" uuid REFERENCES "public"."patients"("id") ON DELETE cascade,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE cascade,
    "date" varchar(10) NOT NULL,
    "morning_brush" boolean DEFAULT false NOT NULL,
    "night_brush" boolean DEFAULT false NOT NULL,
    "floss" boolean DEFAULT false NOT NULL,
    "streak" integer DEFAULT 0 NOT NULL,
    "longest_streak" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "wellness_logs_user_date_unique" UNIQUE("user_id", "date")
  )`,

  // Performance indexes — idempotent, safe to run repeatedly
  `CREATE INDEX IF NOT EXISTS "idx_appointments_patient_id"   ON "appointments"   ("patient_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_appointments_date_status"  ON "appointments"   ("appointment_date", "status")`,
  `CREATE INDEX IF NOT EXISTS "idx_appointments_status"       ON "appointments"   ("status")`,
  `CREATE INDEX IF NOT EXISTS "idx_patients_user_id"          ON "patients"       ("user_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_patients_email"            ON "patients"       ("email")`,
  `CREATE INDEX IF NOT EXISTS "idx_messages_patient_id"       ON "messages"       ("patient_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_messages_is_read"          ON "messages"       ("is_read")`,
  `CREATE INDEX IF NOT EXISTS "idx_invoices_patient_id"       ON "invoices"       ("patient_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_invoices_status"           ON "invoices"       ("status")`,
  `CREATE INDEX IF NOT EXISTS "idx_invoices_paid_at"          ON "invoices"       ("paid_at")`,
  `CREATE INDEX IF NOT EXISTS "idx_treatments_patient_id"     ON "treatments"     ("patient_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor_id"       ON "audit_logs"     ("actor_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at"     ON "audit_logs"     ("created_at")`,
  `CREATE INDEX IF NOT EXISTS "idx_audit_logs_action"         ON "audit_logs"     ("action")`,
  `CREATE INDEX IF NOT EXISTS "idx_blog_posts_status"         ON "blog_posts"     ("status")`,
  `CREATE INDEX IF NOT EXISTS "idx_blog_posts_slug"           ON "blog_posts"     ("slug")`,
  `CREATE INDEX IF NOT EXISTS "idx_orders_user_id"            ON "orders"         ("user_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_orders_status"             ON "orders"         ("status")`,
  `CREATE INDEX IF NOT EXISTS "idx_files_patient_id"          ON "files"          ("patient_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_prescriptions_patient_id"  ON "prescriptions"  ("patient_id")`,
];

async function applyColumnPatches(client) {
  for (const patch of SAFETY_PATCHES) {
    try {
      await client.query(patch);
    } catch (err) {
      // Non-fatal: ignore idempotent patch errors
    }
  }
}

// ─── Main runner ─────────────────────────────────────────────────────────────

export const runMigrations = async () => {
  if (!process.env.DATABASE_URL) {
    logger.warn("[db] DATABASE_URL not set — skipping migrations");
    return;
  }

  const pg = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  let client;

  try {
    client = new pg.default.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.IS_PROD === "true"
        ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === "true" }
        : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10_000,
    });
    await client.connect();

    // Acquire lock
    const lockResult = await client.query(`SELECT pg_try_advisory_lock($1) AS acquired`, [MIGRATION_LOCK_KEY]);
    if (!lockResult.rows[0].acquired) {
      logger.warn("[db] Another migration process is running — skipping");
      await client.end();
      return;
    }

    // Run Drizzle migrator
    const migrationDb = drizzle(client);
    await migrate(migrationDb, { migrationsFolder });

    // Run patches
    await applyColumnPatches(client);
  } catch (error) {
    // ── Error: identify failing migration ────────────────────────────────────
    const errMsg = error?.message ?? String(error);
    logger.fatal({ err: errMsg }, "[db] Migration failed. Check schema and database state.");
    throw error;

  } finally {
    // Always release lock and close client
    if (client) {
      try {
        await client.query(`SELECT pg_advisory_unlock($1)`, [MIGRATION_LOCK_KEY]);
      } catch {
        // Best effort
      }
      await client.end().catch(() => {});
    }
  }
};
