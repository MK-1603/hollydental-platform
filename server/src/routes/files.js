import express from "express";
import multer from "multer";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { db } from "../config/db.js";
import { files, folders, patients } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { logActivity, AuditActions } from "../lib/auditLog.js";
import { ENV } from "../config/env.js";

const router = express.Router();

const ALLOWED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "image/gif",
  "image/tiff",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/dicom",
]);
const ALLOWED_EXTS = /\.(png|jpe?g|webp|pdf|gif|tiff?|docx?|txt|dcm)$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: ENV.MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error("Unsupported file type."));
    }
    if (!ALLOWED_EXTS.test(file.originalname || "")) {
      return cb(new Error("Unsupported file extension."));
    }
    cb(null, true);
  },
});

function requireDb(res) {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ message: "Files service is not configured." });
    return false;
  }
  return true;
}

async function getOwnPatientId(reqUser) {
  if (reqUser.role !== "patient") return null;
  const rows = await db
    .select()
    .from(patients)
    .where(eq(patients.userId, reqUser.id))
    .limit(1);
  return rows[0]?.id || null;
}

/**
 * 1. POST Upload File (Admin only).
 */
router.post(
  "/upload",
  verifyToken,
  requireRole("admin"),
  upload.single("file"),
  async (req, res, next) => {
    if (!requireDb(res)) return;
      const { patientId, category = "other", folderId = null, metadata = "{}" } = req.body || {};
      const file = req.file;

      if (!patientId || !file) {
        return res
          .status(400)
          .json({ message: "Patient ID and file are required." });
      }
      if (!UUID_RE.test(String(patientId))) {
        return res.status(400).json({ message: "Invalid patient identifier." });
      }

      try {
        const exists = await db
          .select()
          .from(patients)
          .where(eq(patients.id, patientId))
          .limit(1);
        if (exists.length === 0) {
          return res.status(404).json({ message: "Patient not found." });
        }

        const uploadResult = await uploadToCloudinary(
          file.buffer,
          file.originalname
        );

        let parsedMetadata = {};
        try { parsedMetadata = JSON.parse(metadata); } catch(e){}

        const [inserted] = await db
          .insert(files)
          .values({
            patientId,
            uploadedBy: req.user.id,
            fileName: parsedMetadata.customName || file.originalname,
            originalName: file.originalname,
            fileType: file.mimetype,
            size: file.size,
            cloudinaryPublicId: uploadResult.public_id,
            cloudinaryUrl: uploadResult.secure_url,
            category: parsedMetadata.category || category,
            folderId: folderId || null,
            metadata: parsedMetadata,
          })
          .returning();

      await logActivity(req, AuditActions.FILE_UPLOADED, {
        targetType: "file",
        targetId: inserted.id,
        metadata: {
          patientId,
          fileName: file.originalname,
          fileType: file.mimetype,
          category,
        },
      });

      return res.status(201).json({
        message: "File uploaded successfully.",
        file: inserted,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 2. GET Files by Patient ID (Admin, or own Patient).
 */
router.get("/patient/:id", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  const patientId = req.params.id;
  if (!UUID_RE.test(patientId)) {
    return res.status(400).json({ message: "Invalid patient identifier." });
  }

  try {
    if (req.user.role === "patient") {
      const ownId = await getOwnPatientId(req.user);
      if (!ownId || ownId !== patientId) {
        return res
          .status(403)
          .json({ message: "Forbidden. You cannot access these files." });
      }
    }

    const records = await db
      .select()
      .from(files)
      .where(eq(files.patientId, patientId));
    return res.status(200).json(records);
  } catch (error) {
        next(error);
  }
});

/**
 * 3a. PATCH /:id — rename file or change category (Admin only).
 */
router.patch("/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  if (!UUID_RE.test(req.params.id)) {
    return res.status(400).json({ message: "Invalid file identifier." });
  }
  const { fileName, category, folderId, metadata } = req.body || {};
  if (!fileName && !category && folderId === undefined && !metadata) {
    return res.status(400).json({ message: "Provide fields to update." });
  }
  try {
    const target = await db.select().from(files).where(eq(files.id, req.params.id)).limit(1);
    if (target.length === 0) return res.status(404).json({ message: "File not found." });
    const updates = {};
    if (fileName) updates.fileName = String(fileName).trim();
    if (category) updates.category = String(category).trim();
    if (folderId !== undefined) updates.folderId = folderId;
    if (metadata) {
      try { updates.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata; } catch(e){}
    }
    const [updated] = await db.update(files).set(updates).where(eq(files.id, req.params.id)).returning();
    return res.status(200).json({ message: "File updated.", file: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. DELETE File (Admin only).
 */
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  if (!UUID_RE.test(req.params.id)) {
    return res.status(400).json({ message: "Invalid file identifier." });
  }

  try {
    const target = await db
      .select()
      .from(files)
      .where(eq(files.id, req.params.id))
      .limit(1);
    if (target.length === 0) {
      return res.status(404).json({ message: "File not found." });
    }
    await db.delete(files).where(eq(files.id, req.params.id));

    await logActivity(req, AuditActions.FILE_DELETED, {
      targetType: "file",
      targetId: req.params.id,
      metadata: {
        patientId: target[0].patientId,
        fileName: target[0].fileName,
      },
    });

    return res.status(200).json({ message: "File deleted successfully." });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// FOLDERS API
// ==========================================

router.get("/folders/patient/:id", verifyToken, async (req, res, next) => {
  if (!requireDb(res)) return;
  const patientId = req.params.id;
  if (!UUID_RE.test(patientId)) return res.status(400).json({ message: "Invalid patient identifier." });
  try {
    const records = await db.select().from(folders).where(eq(folders.patientId, patientId));
    return res.status(200).json(records);
  } catch (err) {
    next(err);
  }
});

router.post("/folders", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  const { patientId, parentId, name, description, color, icon, visibility, folderType, tags } = req.body || {};
  if (!patientId || !name) return res.status(400).json({ message: "Patient ID and Name are required." });
  
  try {
    const [inserted] = await db.insert(folders).values({
      patientId,
      parentId: parentId || null,
      name,
      description,
      color,
      icon,
      visibility: visibility || "private",
      folderType: folderType || "other",
      tags: tags || [],
      createdBy: req.user.id
    }).returning();
    return res.status(201).json(inserted);
  } catch (err) {
    next(err);
  }
});

router.patch("/folders/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  const updates = req.body || {};
  try {
    const [updated] = await db.update(folders).set({ ...updates, updatedAt: new Date() }).where(eq(folders.id, req.params.id)).returning();
    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/folders/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    await db.delete(folders).where(eq(folders.id, req.params.id));
    return res.status(200).json({ message: "Folder deleted." });
  } catch (err) {
    next(err);
  }
});

export default router;
