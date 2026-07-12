CREATE TABLE IF NOT EXISTS "folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid,
	"parent_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(50),
	"icon" varchar(50),
	"visibility" varchar(50) DEFAULT 'private' NOT NULL,
	"folder_type" varchar(50) DEFAULT 'other' NOT NULL,
	"tags" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE IF EXISTS "app_settings";--> statement-breakpoint
DROP TABLE IF EXISTS "clinical_notes";--> statement-breakpoint
DROP TABLE IF EXISTS "notifications";--> statement-breakpoint
DROP TABLE IF EXISTS "staff";--> statement-breakpoint
DROP TABLE IF EXISTS "suppliers";--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "original_name" varchar(255);--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "size" integer;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "metadata" jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "folders" ADD CONSTRAINT "folders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "folders" ADD CONSTRAINT "folders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
