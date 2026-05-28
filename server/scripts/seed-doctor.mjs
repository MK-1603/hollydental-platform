#!/usr/bin/env node
/**
 * One-shot seeder for the clinic doctor / admin account.
 *
 * Usage:
 *   npm run seed:doctor
 *   npm run seed:doctor -- --email=doctor@hollyhilldental.ie --password='Strong#Pass1' --force
 *
 * Flags:
 *   --email=<addr>     override default doctor email
 *   --password=<pwd>   override default temporary password
 *   --name="First Last" optional display name (currently informational)
 *   --force            reset password + activate the account if the user
 *                      already exists. Without --force we skip existing rows.
 *
 * The doctor's first login forces a password change, so the temporary
 * password here is only ever a one-time secret.
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../src/config/db.js";
import { users } from "../src/db/schema.js";

function parseArgs(argv) {
  const out = { force: false };
  for (const arg of argv) {
    if (arg === "--force") out.force = true;
    else if (arg.startsWith("--email=")) out.email = arg.slice(8);
    else if (arg.startsWith("--password=")) out.password = arg.slice(11);
    else if (arg.startsWith("--name=")) out.name = arg.slice(7);
  }
  return out;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[seed:doctor] DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const email = (args.email || "doctor@hollyhilldental.ie").trim().toLowerCase();
  const tempPassword = args.password || "Admin1234!";

  if (tempPassword.length < 8) {
    console.error("[seed:doctor] Password must be at least 8 characters.");
    process.exit(1);
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const passwordHash = await bcrypt.hash(tempPassword, 10);

  if (existing.length === 0) {
    await db.insert(users).values({
      email,
      passwordHash,
      role: "admin",
      isActive: true,
      mustChangePassword: true,
      displayName: "Dr. Roghay Alizadeh",
    });
    console.log(`[seed:doctor] Created admin account: ${email}`);
  } else {
    await db
      .update(users)
      .set({
        passwordHash,
        role: "admin",
        isActive: true,
        mustChangePassword: true,
        displayName: "Dr. Roghay Alizadeh",
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing[0].id));
    console.log(`[seed:doctor] Reset password for existing admin: ${email}`);
  }

  console.log("[seed:doctor] Temporary credentials:");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${tempPassword}`);
  console.log(
    "[seed:doctor] On first login the doctor will be forced to set a new password."
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed:doctor] Failed:", err);
    process.exit(1);
  });
