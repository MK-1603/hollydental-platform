import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "../config/db.js";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationsFolder = resolve(__dirname, "migrations");

/**
 * Safety patch — runs raw ALTER TABLE … ADD COLUMN IF NOT EXISTS statements
 * before the Drizzle migrator so columns added outside the original migration
 * sequence are always present, even if the journal was applied out of order.
 */
async function applyColumnPatches() {
  const patches = [
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_pic_url" text`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "display_name" varchar(150)`,
    `ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "blood_group" varchar(20)`,
    `ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "age" integer`,
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
  ];
  for (const patch of patches) {
    try {
      await db.execute(sql.raw(patch));
    } catch (err) {
      console.error("[migrate] column patch failed:", patch, err?.message);
    }
  }
}

export const runMigrations = async () => {
  if (process.env.DATABASE_URL) {
    try {
      console.log("Running migrations...");
      await applyColumnPatches();
      await migrate(db, { migrationsFolder });
      console.log("Migrations ran successfully.");
    } catch (error) {
      console.error("Migration failed:", error);
    }
  } else {
    console.log("[MOCK MIGRATION] Skipped migrations (mock mode).");
  }
};
