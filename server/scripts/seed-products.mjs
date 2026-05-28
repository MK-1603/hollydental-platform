#!/usr/bin/env node
/**
 * Seeds the Hollyhill Dental retail catalogue with the three items featured
 * on the existing storefront:
 *
 *  1. Dental Bonding (procedure, €120 – €180)
 *  2. Black Is White Teeth Whitening Toothpaste (extra, €30)
 *  3. Pola Light Teeth Whitening Kits (extra, €250)
 *
 * Idempotent: re-running the script updates any existing rows that match
 * by name. Use `--force` to overwrite descriptions/prices for rows that
 * already exist (otherwise we only fill in missing fields).
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/config/db.js";
import { products } from "../src/db/schema.js";

const PRODUCTS = [
  {
    name: "Dental Bonding",
    category: "procedure",
    price: "120.00",
    priceTo: "180.00",
    description:
      "With dental bonding we can repair chips, stains and fluorosis as well as change the shape and size of the tooth to improve your smile. We do this by adding composite (white tooth filling) carefully to the teeth. Book an appointment with us and our amazing dental team who will walk you through the process and put your mind at ease!! Contact 0214303072 for bookings",
    imageUrl: "/products/image.png",
    stockCount: 0,
    displayOrder: 1,
  },
  {
    name: "Black Is White Teeth Whitening Toothpaste",
    category: "extra",
    price: "30.00",
    priceTo: null,
    description:
      "Fresh lime mint toothpaste from Curaprox with activated carbon to gently lift surface stains and brighten the natural whiteness of teeth. Daily use, fluoride formula, suitable for sensitive teeth.",
    imageUrl: "/products/image copy.png",
    stockCount: 12,
    displayOrder: 1,
  },
  {
    name: "Pola Light Teeth Whitening Kits",
    category: "extra",
    price: "250.00",
    priceTo: null,
    description:
      "Advanced teeth whitening system. Enjoy a brighter more confident smile in 5 days. Pola Light is an advanced tooth whitening system that combines Pola's award winning whitening formula, with an LED mouthpiece, for a faster whitening treatment. Buy Now",
    imageUrl: "/products/image copy 2.png",
    stockCount: 8,
    displayOrder: 2,
  },
];

function parseArgs(argv) {
  return { force: argv.includes("--force") };
}

async function upsertProduct(p, { force }) {
  const existing = await db
    .select()
    .from(products)
    .where(eq(products.name, p.name))
    .limit(1);

  if (existing.length === 0) {
    const [inserted] = await db.insert(products).values(p).returning();
    console.log(`[seed:products] Created: ${inserted.name}`);
    return;
  }

  if (!force) {
    // Only fill in missing fields without overwriting admin edits.
    const current = existing[0];
    const updates = {};
    if (!current.description) updates.description = p.description;
    if (!current.imageUrl) updates.imageUrl = p.imageUrl;
    if (!current.priceTo && p.priceTo) updates.priceTo = p.priceTo;
    if (!current.category || current.category === "extra") {
      // Only override category if it's still on the legacy default.
      if (current.category === "extra" && p.category !== "extra") {
        updates.category = p.category;
      }
    }
    if (Object.keys(updates).length === 0) {
      console.log(
        `[seed:products] Skipped (already populated): ${current.name}`
      );
      return;
    }
    await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, current.id));
    console.log(
      `[seed:products] Filled missing fields for ${current.name}: ${Object.keys(updates).join(", ")}`
    );
    return;
  }

  await db
    .update(products)
    .set({
      description: p.description,
      price: p.price,
      priceTo: p.priceTo,
      imageUrl: p.imageUrl,
      stockCount: p.stockCount,
      category: p.category,
      displayOrder: p.displayOrder,
      updatedAt: new Date(),
    })
    .where(eq(products.id, existing[0].id));
  console.log(`[seed:products] Force-updated: ${p.name}`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[seed:products] DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }
  const args = parseArgs(process.argv.slice(2));
  for (const p of PRODUCTS) {
    await upsertProduct(p, args);
  }
  console.log("[seed:products] Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed:products] Failed:", err);
    process.exit(1);
  });
