import express from "express";
import { db } from "../config/db.js";
import { blogPosts } from "../db/schema.js";
import { desc, eq } from "drizzle-orm";
import { ENV } from "../config/env.js";

const router = express.Router();

const STATIC_PATHS = [
  "/",
  "/about",
  "/services",
  "/pricing",
  "/blog",
  "/contact",
  "/dental-anxiety",
  "/childrens-dentistry",
  "/emergency",
  "/gallery",
  "/testimonials",
  "/insurance-payment",
  "/referral",
  "/careers",
  "/privacy",
  "/complaints",
  "/sitemap",
  "/new-patient",
  "/aftercare/tooth-extraction",
  "/aftercare/root-canal",
  "/aftercare/teeth-whitening",
  "/aftercare/composite-bonding",
  "/aftercare/veneers",
  "/aftercare/invisalign",
];

const SERVICE_SLUGS = [
  "general-dentistry",
  "dental-checkups",
  "teeth-cleaning",
  "teeth-whitening",
  "invisalign",
  "composite-bonding",
  "veneers",
  "smile-design",
  "root-canal",
  "dental-crowns",
  "tooth-extractions",
  "emergency-dentistry",
  "dental-bridges",
  "gum-treatment",
  "composite-fillings",
  "dentures",
  "full-smile-makeovers",
  "digital-smile-consultation",
];

function escape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

router.get("/sitemap.xml", async (req, res) => {
  const base = ENV.CLIENT_URL.replace(/\/$/, "");

  let posts = [];
  if (process.env.DATABASE_URL) {
    try {
      posts = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.status, "published"))
        .orderBy(desc(blogPosts.publishedAt));
    } catch (err) {
      // Non-fatal — sitemap still works without blog posts
      import("../lib/logger.js").then(({ default: logger }) =>
        logger.error({ err }, "[sitemap] failed to load posts")
      );
    }
  }

  const today = new Date().toISOString();

  const urls = [
    ...STATIC_PATHS.map((p) => ({ path: p, lastmod: today })),
    ...SERVICE_SLUGS.map((s) => ({ path: `/services/${s}`, lastmod: today })),
    ...posts.map((p) => ({
      path: `/blog/${p.slug}`,
      lastmod: (p.publishedAt || p.updatedAt || new Date()).toISOString
        ? (p.publishedAt || p.updatedAt || new Date()).toISOString()
        : new Date(p.publishedAt || p.updatedAt || Date.now()).toISOString(),
    })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${escape(base + u.path)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  res.set("Content-Type", "application/xml");
  res.set("Cache-Control", "public, max-age=3600");
  return res.status(200).send(xml);
});

router.get("/robots.txt", (req, res) => {
  const base = ENV.CLIENT_URL.replace(/\/$/, "");
  res.set("Content-Type", "text/plain");
  res.set("Cache-Control", "public, max-age=3600");
  return res.status(200).send(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /portal",
      "Disallow: /admin",
      "Disallow: /api",
      `Sitemap: ${base}/sitemap.xml`,
      "",
    ].join("\n")
  );
});

router.get("/rss.xml", async (req, res) => {
  const base = ENV.CLIENT_URL.replace(/\/$/, "");

  let posts = [];
  if (process.env.DATABASE_URL) {
    try {
      posts = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.status, "published"))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(20);
    } catch (err) {
      import("../lib/logger.js").then(({ default: logger }) =>
        logger.error({ err }, "[rss] failed to load posts")
      );
    }
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0">\n` +
    `  <channel>\n` +
    `    <title>Hollyhill Dental Blog</title>\n` +
    `    <link>${escape(base + "/blog")}</link>\n` +
    `    <description>Dental health insights and clinic updates from Hollyhill Dental, Cork.</description>\n` +
    `    <language>en-IE</language>\n` +
    posts
      .map((p) => {
        const url = `${base}/blog/${p.slug}`;
        const pubDate = new Date(p.publishedAt || p.createdAt).toUTCString();
        return `    <item>\n      <title>${escape(p.title)}</title>\n      <link>${escape(url)}</link>\n      <guid isPermaLink="true">${escape(url)}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description><![CDATA[${p.excerpt || ""}]]></description>\n    </item>`;
      })
      .join("\n") +
    `\n  </channel>\n</rss>\n`;

  res.set("Content-Type", "application/rss+xml");
  res.set("Cache-Control", "public, max-age=3600");
  return res.status(200).send(xml);
});

export default router;
