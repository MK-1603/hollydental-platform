-- 0021: Catch-up migration — creates tables that were added to schema.js
-- but never had a corresponding migration file. All statements are guarded
-- with IF NOT EXISTS / IF NOT EXISTS so this is safe to run against both
-- fresh databases and existing ones that already have some of these tables
-- from a manual CREATE or a previous partial run.

-- ── clinical_notes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "clinical_notes" (
  "id"          uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id"  uuid        REFERENCES "public"."patients"("id") ON DELETE cascade,
  "doctor_id"   uuid        REFERENCES "public"."users"("id")    ON DELETE set null,
  "record_type" varchar(100) NOT NULL DEFAULT 'general',
  "content"     text        NOT NULL,
  "created_at"  timestamp   NOT NULL DEFAULT now(),
  "updated_at"  timestamp   NOT NULL DEFAULT now()
);
--> statement-breakpoint

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "notifications" (
  "id"          uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"     uuid        REFERENCES "public"."users"("id") ON DELETE cascade,
  "type"        varchar(100) NOT NULL DEFAULT 'info',
  "title"       varchar(255) NOT NULL,
  "message"     text         NOT NULL,
  "is_read"     boolean      NOT NULL DEFAULT false,
  "is_archived" boolean      NOT NULL DEFAULT false,
  "metadata"    jsonb,
  "created_at"  timestamp    NOT NULL DEFAULT now()
);
--> statement-breakpoint

-- ── app_settings ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "app_settings" (
  "id"         uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key"        varchar(100) NOT NULL,
  "value"      jsonb        NOT NULL DEFAULT '{}'::jsonb,
  "updated_at" timestamp    NOT NULL DEFAULT now(),
  CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint

-- ── staff ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "staff" (
  "id"         uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"    uuid        REFERENCES "public"."users"("id") ON DELETE cascade,
  "first_name" varchar(100) NOT NULL,
  "last_name"  varchar(100) NOT NULL,
  "email"      varchar(255),
  "phone"      varchar(50),
  "role"       varchar(50)  NOT NULL DEFAULT 'staff',
  "department" varchar(100),
  "bio"        text,
  "schedule"   jsonb,
  "created_at" timestamp    NOT NULL DEFAULT now(),
  "updated_at" timestamp    NOT NULL DEFAULT now()
);
--> statement-breakpoint

-- ── suppliers ────────────────────────────────────────────────────────────────
-- 0015 created suppliers with a `website` column; 0020 dropped it.
-- Re-create defensively so fresh DBs get the final schema without the column.
CREATE TABLE IF NOT EXISTS "suppliers" (
  "id"           uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name"         varchar(255) NOT NULL,
  "contact_name" varchar(100),
  "phone"        varchar(50),
  "email"        varchar(255),
  "address"      text,
  "status"       varchar(50)  NOT NULL DEFAULT 'active',
  "notes"        text,
  "created_at"   timestamp    NOT NULL DEFAULT now(),
  "updated_at"   timestamp    NOT NULL DEFAULT now()
);
--> statement-breakpoint

-- ── indexes for new tables ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "clinical_notes_patient_id_idx"  ON "clinical_notes"  ("patient_id");
CREATE INDEX IF NOT EXISTS "clinical_notes_doctor_id_idx"   ON "clinical_notes"  ("doctor_id");
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx"      ON "notifications"   ("user_id");
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx"      ON "notifications"   ("is_read");
CREATE INDEX IF NOT EXISTS "staff_user_id_idx"              ON "staff"           ("user_id");
CREATE INDEX IF NOT EXISTS "suppliers_status_idx"           ON "suppliers"       ("status");
--> statement-breakpoint

-- ── defensive column additions for tables that existed before this migration ──
-- Ensures any DB that already has these tables gets the columns that were
-- added incrementally via earlier safety-patch migrations.

DO $$ BEGIN
  ALTER TABLE "notifications" ADD COLUMN "metadata" jsonb;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE varchar(100);
EXCEPTION WHEN others THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "website";
EXCEPTION WHEN others THEN null;
END $$;
