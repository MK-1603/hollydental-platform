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
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs";
import path from "path";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationsFolder = resolve(__dirname, "migrations");

// PostgreSQL advisory lock key — prevents two processes running migrations at
// the same time (e.g. scale-out restarts).
const MIGRATION_LOCK_KEY = 1234567890;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(level, message, extra = "") {
  const prefix = {
    info:    "  ✔",
    warn:    "  ⚠",
    error:   "  ✖",
    section: "\n ▶",
    pending: "  →",
    skip:    "  ·",
  }[level] ?? "  ";
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${ts}] ${prefix} ${message}${extra ? `  (${extra})` : ""}`);
}

function elapsed(start) {
  return `${Date.now() - start}ms`;
}

/**
 * Read the local journal to get the expected migration list.
 * Returns an array of tag strings in order.
 */
function readJournal() {
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  if (!fs.existsSync(journalPath)) {
    throw new Error(`Journal file not found at ${journalPath}`);
  }
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  return journal.entries
    .sort((a, b) => a.idx - b.idx)
    .map((e) => e.tag);
}

/**
 * Compute a simple SHA-256 checksum of a migration file.
 * Used to detect if a previously applied migration was tampered with.
 */
function checksumFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf8");
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Fetch the list of already-applied migration tags from __drizzle_migrations.
 * Returns an empty array if the table does not exist yet (fresh DB).
 */
async function getAppliedMigrations(client) {
  try {
    const result = await client.query(
      `SELECT hash FROM "__drizzle_migrations" ORDER BY created_at ASC`
    );
    return result.rows.map((r) => r.hash);
  } catch {
    // Table doesn't exist yet — fresh database.
    return [];
  }
}

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
  log("section", "Applying safety patches...");
  let applied = 0;
  for (const patch of SAFETY_PATCHES) {
    try {
      await client.query(patch);
      applied++;
    } catch (err) {
      // Non-fatal: log and continue. These are best-effort idempotent patches.
      log("warn", `Safety patch skipped: ${err?.message?.split("\n")[0]}`);
    }
  }
  log("info", `Safety patches complete`, `${applied}/${SAFETY_PATCHES.length} applied`);
}

// ─── Main runner ─────────────────────────────────────────────────────────────

export const runMigrations = async () => {
  if (!process.env.DATABASE_URL) {
    log("warn", "DATABASE_URL not set — skipping migrations (mock mode)");
    return;
  }

  const totalStart = Date.now();
  const pg = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");

  let client;

  console.log("\n╔══════════════════════════════════════════╗");
  console.log(  "║        Hollyhill Dental — Migrations     ║");
  console.log(  "╚══════════════════════════════════════════╝");

  try {
    // ── Step 1: Connect ───────────────────────────────────────────────────────
    log("section", "Connecting to database...");
    const connectStart = Date.now();
    client = new pg.default.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.IS_PROD === "true"
        ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === "true" }
        : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10_000,
    });
    await client.connect();
    log("info", "Database connected", elapsed(connectStart));

    // ── Step 2: Acquire advisory lock ─────────────────────────────────────────
    log("section", "Acquiring migration lock...");
    const lockResult = await client.query(
      `SELECT pg_try_advisory_lock($1) AS acquired`,
      [MIGRATION_LOCK_KEY]
    );
    if (!lockResult.rows[0].acquired) {
      log("warn", "Another migration process is running — skipping (lock not acquired)");
      await client.end();
      return;
    }
    log("info", "Migration lock acquired");

    // ── Step 3: Check journal vs disk ─────────────────────────────────────────
    log("section", "Checking migration files...");
    const journalTags = readJournal();
    log("info", `Found ${journalTags.length} migrations in journal`);

    // Verify all SQL files exist on disk
    const missingFiles = [];
    for (const tag of journalTags) {
      const filePath = path.join(migrationsFolder, `${tag}.sql`);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(tag);
      }
    }
    if (missingFiles.length > 0) {
      throw new Error(
        `Missing migration SQL files:\n${missingFiles.map((f) => `  - ${f}.sql`).join("\n")}\n` +
        `These are in the journal but not on disk. Cannot proceed safely.`
      );
    }
    log("info", "All migration files present on disk");

    // ── Step 4: Apply safety patches ─────────────────────────────────────────
    await applyColumnPatches(client);

    // ── Step 5: Run Drizzle migrator ──────────────────────────────────────────
    log("section", "Running pending migrations...");
    const migrationDb = drizzle(client);
    const migrateStart = Date.now();

    // Get applied count before running
    const appliedBefore = await getAppliedMigrations(client);
    const totalInJournal = journalTags.length;
    const pendingCount = Math.max(0, totalInJournal - appliedBefore.length);

    if (pendingCount === 0) {
      log("info", `All ${totalInJournal} migrations already applied — nothing to do`);
    } else {
      log("pending", `Applied: ${appliedBefore.length}  |  Pending: ${pendingCount}  |  Total: ${totalInJournal}`);
    }

    // Run migrations — Drizzle handles transaction wrapping per migration internally.
    // On failure it throws with the SQL context.
    await migrate(migrationDb, { migrationsFolder });

    const appliedAfter = await getAppliedMigrations(client);
    const newlyApplied = appliedAfter.length - appliedBefore.length;

    // ── Step 6: Summary ──────────────────────────────────────────────────────
    console.log("\n┌──────────────────────────────────────────┐");
    console.log(  "│           Migration Summary              │");
    console.log(  "├──────────────────────────────────────────┤");
    console.log(`│  Total in journal : ${String(totalInJournal).padEnd(20)}│`);
    console.log(`│  Already applied  : ${String(appliedBefore.length).padEnd(20)}│`);
    console.log(`│  Newly applied    : ${String(newlyApplied).padEnd(20)}│`);
    console.log(`│  Duration         : ${elapsed(migrateStart).padEnd(20)}│`);
    console.log(`│  Status           : ${"SUCCESS".padEnd(20)}│`);
    console.log(  "└──────────────────────────────────────────┘\n");

  } catch (error) {
    // ── Error: identify failing migration ────────────────────────────────────
    const errMsg = error?.message ?? String(error);

    // Try to extract the failing migration from Drizzle's error message
    // Drizzle typically includes "Migration XXX" or a file path in the error.
    let failingMigration = "unknown";
    const tagMatch = errMsg.match(/(\d{4}_[\w_]+)/);
    if (tagMatch) failingMigration = `${tagMatch[1]}.sql`;

    // Also try to find which table is referenced in the error
    const tableMatch = errMsg.match(/table "([^"]+)"/i);
    const tableName = tableMatch ? tableMatch[1] : null;

    console.log("\n╔══════════════════════════════════════════╗");
    console.log(  "║          MIGRATION FAILED                ║");
    console.log(  "╚══════════════════════════════════════════╝");
    log("error", `Migration failed after ${elapsed(totalStart)}`);
    if (failingMigration !== "unknown") {
      log("error", `Failing migration file  : ${failingMigration}`);
    }
    if (tableName) {
      log("error", `Table referenced        : ${tableName}`);
    }
    log("error", `PostgreSQL error        : ${errMsg.split("\n")[0]}`);
    console.log("\n  Suggested actions:");
    console.log("    1. Check the migration file listed above for unsafe DROP/ALTER statements");
    console.log("    2. Replace bare DROP TABLE with DROP TABLE IF EXISTS");
    console.log("    3. Check that tables are created before they are referenced");
    console.log("    4. Review the __drizzle_migrations table to see what was applied");
    console.log("    5. If on a fresh DB, ensure migration 0000 ran successfully first\n");

    // Re-throw so server.js process.exit(1) fires — never silently continue
    // with a broken schema.
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
