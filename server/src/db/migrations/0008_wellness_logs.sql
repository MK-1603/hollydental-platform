CREATE TABLE IF NOT EXISTS "wellness_logs" (
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
);
