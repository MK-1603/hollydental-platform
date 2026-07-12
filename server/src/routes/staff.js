import express from "express";
import { db } from "../config/db.js";
import { staff, users } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

const router = express.Router();

// GET /api/staff — admin only
router.get("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const allStaff = await db
      .select({
        id: staff.id,
        userId: staff.userId,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
        department: staff.department,
        phone: staff.phone,
        email: staff.email,
        bio: staff.bio,
        isActive: users.isActive,
      })
      .from(staff)
      .leftJoin(users, eq(staff.userId, users.id))
      .orderBy(desc(staff.createdAt));

    res.json(allStaff);
  } catch (error) {
    next(error);
  }
});

// POST /api/staff — admin only
router.post("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { firstName, lastName, role, department, phone, email, bio, password } = req.body;

    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Use provided password or generate a secure random one — never use a
    // hardcoded default.
    const rawPassword = password || crypto.randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role: role === "doctor" || role === "admin" ? "admin" : "patient",
        displayName: `${firstName} ${lastName}`,
        mustChangePassword: !password, // Force change if auto-generated
      })
      .returning();

    const [newStaff] = await db
      .insert(staff)
      .values({
        userId: newUser.id,
        firstName,
        lastName,
        role,
        department,
        phone,
        email,
        bio,
      })
      .returning();

    const response = { ...newStaff };
    if (!password) {
      // Return generated password once so admin can hand it to the staff member
      response.temporaryPassword = rawPassword;
    }

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/staff/:id — admin only
router.put("/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, department, phone, email, bio, isActive } = req.body;

    const [updatedStaff] = await db
      .update(staff)
      .set({ firstName, lastName, role, department, phone, email, bio, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();

    if (!updatedStaff) return res.status(404).json({ error: "Staff not found" });

    if (isActive !== undefined && updatedStaff.userId) {
      await db.update(users).set({ isActive }).where(eq(users.id, updatedStaff.userId));
    }

    res.json(updatedStaff);
  } catch (error) {
    next(error);
  }
});

export default router;
