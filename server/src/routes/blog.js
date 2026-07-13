import express from "express";
import crypto from "crypto";
import { db } from "../config/db.js";
import { blogPosts, blogCategories, blogTags } from "../db/schema.js";
import { desc, eq, inArray } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { logActivity } from "../lib/auditLog.js";

const router = express.Router();

function requireDb(res) {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ message: "Blog service is not configured." });
    return false;
  }
  return true;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

/* 1. GET all posts. Public sees published only; admin can pass ?status= */
router.get("/", async (req, res, next) => {
  if (!requireDb(res)) return;
  const { status } = req.query;

  try {
    let filter;
    if (status && status !== "all") {
      filter = eq(blogPosts.status, String(status));
    } else if (!status) {
      filter = eq(blogPosts.status, "published");
    }

    const records = await db
      .select()
      .from(blogPosts)
      .where(filter)
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt));
    return res.status(200).json(records);
  } catch (error) {
    next(error);
  }
});

/* 2. Categories CRUD */
router.get("/categories", async (req, res, next) => {
  try {
    const list = await db.select().from(blogCategories).orderBy(desc(blogCategories.displayOrder));
    res.json(list);
  } catch (err) { res.status(500).json({ message: "Failed" }); }
});

router.post("/categories", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { name, slug, color, icon, displayOrder } = req.body;
    const finalSlug = slug || slugify(name);
    const [inserted] = await db.insert(blogCategories).values({ name, slug: finalSlug, color, icon, displayOrder }).returning();
    res.json(inserted);
  } catch (err) { res.status(500).json({ message: "Failed" }); }
});

router.put("/categories/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { name, slug, color, icon, displayOrder } = req.body;
    const [updated] = await db.update(blogCategories).set({ name, slug, color, icon, displayOrder, updatedAt: new Date() }).where(eq(blogCategories.id, req.params.id)).returning();
    res.json(updated);
  } catch (err) { res.status(500).json({ message: "Failed" }); }
});

router.delete("/categories/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    await db.delete(blogCategories).where(eq(blogCategories.id, req.params.id));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: "Failed" }); }
});

/* 3. Tags CRUD */
router.get("/tags", async (req, res, next) => {
  try {
    const list = await db.select().from(blogTags).orderBy(desc(blogTags.createdAt));
    res.json(list);
  } catch (err) { res.status(500).json({ message: "Failed" }); }
});

router.post("/tags", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    const [inserted] = await db.insert(blogTags).values({ name, slug: slug || slugify(name) }).returning();
    res.json(inserted);
  } catch (err) { res.status(500).json({ message: "Failed" }); }
});

router.delete("/tags/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    await db.delete(blogTags).where(eq(blogTags.id, req.params.id));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: "Failed" }); }
});

/* 4. GET post by slug (public). */
router.get("/:slug", async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const rows = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, req.params.slug))
      .limit(1);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Blog post not found." });
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

/* 3. POST create (admin). */
router.post("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  const {
    title,
    slug,
    body,
    excerpt,
    featuredImageUrl,
    category,
    tags,
    seoTitle,
    seoDescription,
    status,
  } = req.body || {};

  if (!title || !body) {
    return res.status(400).json({ message: "Title and body are required." });
  }

  const finalSlug = slug ? slugify(slug) : slugify(title);
  if (!finalSlug) {
    return res.status(400).json({ message: "Slug is invalid." });
  }

  try {
    const [inserted] = await db
      .insert(blogPosts)
      .values({
        id: crypto.randomUUID(),
        title,
        slug: finalSlug,
        body,
        excerpt: excerpt || null,
        authorId: req.user.id,
        featuredImageUrl: featuredImageUrl || null,
        categoryId: req.body.categoryId || null,
        tags: tags || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        canonicalUrl: req.body.canonicalUrl || null,
        readingTime: req.body.readingTime || null,
        status: status || "draft",
        publishedAt: status === "published" ? new Date() : null,
      })
      .returning();

    await logActivity(req, "blog.created", {
      targetType: "blog_post",
      targetId: inserted.id,
      metadata: { slug: inserted.slug, status: inserted.status },
    });

    return res.status(201).json({
      message: "Blog post created successfully.",
      post: inserted,
    });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ message: "A post with that slug already exists." });
    }
    return next(error);
  }
});

/* 4. PUT update (admin). */
router.put("/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  const data = { ...(req.body || {}) };
  delete data.category; // Removed from schema
  if (data.slug) data.slug = slugify(data.slug);

  try {
    const updated = await db
      .update(blogPosts)
      .set({
        ...data,
        updatedAt: new Date(),
        publishedAt:
          data.status === "published" ? data.publishedAt || new Date() : data.publishedAt,
      })
      .where(eq(blogPosts.id, req.params.id))
      .returning();
    if (updated.length === 0) {
      return res.status(404).json({ message: "Blog post not found." });
    }
    await logActivity(req, "blog.updated", {
      targetType: "blog_post",
      targetId: req.params.id,
      metadata: { status: updated[0].status },
    });
    return res.status(200).json(updated[0]);
  } catch (error) {
    next(error);
  }
});

/* 5. DELETE (admin). */
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    await db.delete(blogPosts).where(eq(blogPosts.id, req.params.id));
    await logActivity(req, "blog.deleted", {
      targetType: "blog_post",
      targetId: req.params.id,
    });
    return res.status(200).json({ message: "Blog post deleted successfully." });
  } catch (error) {
    next(error);
  }
});

/* 6. Bulk Actions (admin). */
router.post("/bulk", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  const { action, ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ message: "No IDs provided." });

  try {
    if (action === "delete") {
      await db.delete(blogPosts).where(inArray(blogPosts.id, ids));
    } else if (action === "publish") {
      await db.update(blogPosts).set({ status: "published", publishedAt: new Date() }).where(inArray(blogPosts.id, ids));
    } else if (action === "archive") {
      await db.update(blogPosts).set({ status: "archived" }).where(inArray(blogPosts.id, ids));
    } else {
      return res.status(400).json({ message: "Invalid action." });
    }
    return res.status(200).json({ message: `Bulk ${action} successful.` });
  } catch (error) {
    next(error);
  }
});



export default router;
