import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import multer from "multer";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { db } from "../config/db.js";
import {
  users,
  patients,
  passwordResetTokens,
  appointments,
  files,
  prescriptions,
  messages,
  treatments,
  dentalCharts,
} from "../db/schema.js";
import { and, eq, gt, isNull } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { logActivity, AuditActions } from "../lib/auditLog.js";
import { sendPush } from "../lib/push.js";
import { ENV, cookieOptions } from "../config/env.js";

const router = express.Router();
const JWT_SECRET = ENV.JWT_SECRET;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;

function hashToken(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

/**
 * Generate a short human-readable reset code (8 chars, no ambiguous
 * characters). Returned to the admin queue so staff can read it to the
 * patient over the phone or in person.
 */
function generateResetCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const buf = crypto.randomBytes(8);
  for (let i = 0; i < 8; i += 1) {
    out += alphabet[buf[i] % alphabet.length];
  }
  return out;
}

// 1. Patient Register
router.post("/register", async (req, res) => {
  const { email, password, firstName, lastName, phone, dateOfBirth, gender, address, bloodGroup, age } = req.body;

  if (!email || !password || !firstName || !lastName || !phone) {
    return res.status(400).json({ message: "Missing required registration fields." });
  }

  try {
    // Check if user email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 10 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const patientId = crypto.randomUUID();

    // Transaction insert
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      role: "patient",
    });

    await db.insert(patients).values({
      id: patientId,
      userId,
      firstName,
      lastName,
      phone,
      email,
      dateOfBirth,
      gender,
      address,
      bloodGroup: bloodGroup || null,
      age: age ? Number(age) : null,
      gdprConsent: true,
      consentDate: new Date(),
    });

    // Sign Token — 30 day session
    const token = jwt.sign({ id: userId, role: "patient" }, JWT_SECRET, { expiresIn: "30d" });

    res.cookie("token", token, cookieOptions);
    await logActivity({ ...req, user: { id: userId, role: "patient" } }, AuditActions.AUTH_REGISTER, {
      targetType: "user",
      targetId: userId,
      metadata: { email },
    });
    return res.status(201).json({
      message: "Patient registered successfully.",
      user: {
        id: userId,
        email,
        role: "patient",
        patientProfile: {
          id: patientId,
          userId,
          firstName,
          lastName,
          phone,
          email,
          dateOfBirth,
          gender,
          bloodGroup,
          age,
        }
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Registration failed." });
  }
});

// 2. All Roles Login
router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];

    if (!user || !user.isActive) {
      await logActivity(req, AuditActions.AUTH_LOGIN_FAILURE, {
        metadata: { email, reason: "no_user" },
      });
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await logActivity(req, AuditActions.AUTH_LOGIN_FAILURE, {
        metadata: { email, reason: "wrong_password" },
        targetType: "user",
        targetId: user.id,
      });
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Sign Token — if mustChangePassword is true, token has restricted permissions
    const token = jwt.sign(
      { id: user.id, role: user.role, mustChangePassword: !!user.mustChangePassword },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.cookie("token", token, cookieOptions);

    let patientProfile = null;
    if (user.role === "patient") {
      const pRows = await db.select().from(patients).where(eq(patients.userId, user.id)).limit(1);
      patientProfile = pRows[0];
    }

    await logActivity({ ...req, user: { id: user.id, role: user.role } }, AuditActions.AUTH_LOGIN_SUCCESS, {
      targetType: "user",
      targetId: user.id,
      metadata: { mustChangePassword: !!user.mustChangePassword },
    });

    return res.status(200).json({
      message: user.mustChangePassword ? "Password change required." : "Logged in successfully.",
      mustChangePassword: !!user.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        mustChangePassword: !!user.mustChangePassword,
        patientProfile,
        profilePicUrl: user.profilePicUrl,
        displayName: user.displayName || null,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Login failed." });
  }
});

// 3. Clear Cookie
router.post("/logout", verifyToken, async (req, res) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
  await logActivity(req, AuditActions.AUTH_LOGOUT, {
    targetType: "user",
    targetId: req.user.id,
  });
  return res.status(200).json({ message: "Logged out successfully." });
});

// 4. Me checking auth
router.get("/me", verifyToken, async (req, res) => {
  try {
    const rows = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let patientProfile = null;
    if (user && user.role === "patient") {
      const pRows = await db.select().from(patients).where(eq(patients.userId, user.id)).limit(1);
      patientProfile = pRows[0];
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        mustChangePassword: !!user.mustChangePassword,
        patientProfile,
        profilePicUrl: user.profilePicUrl,
        displayName: user.displayName || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to retrieve user status." });
  }
});

// 5. Change Password (Forced/Regular)
router.post("/change-password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current password and new password are required." });
  }

  // Validate password complexity
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message: "New password must be at least 10 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    });
  }

  try {
    const rows = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db.update(users)
      .set({
        passwordHash: newPasswordHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Sign new full-access token (without mustChangePassword flag restriction)
    const token = jwt.sign(
      { id: user.id, role: user.role, mustChangePassword: false },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.cookie("token", token, cookieOptions);

    await logActivity(req, AuditActions.AUTH_PASSWORD_CHANGED, {
      targetType: "user",
      targetId: user.id,
    });

    return res.status(200).json({
      message: "Password changed successfully.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        mustChangePassword: false,
      },
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ message: "Failed to change password." });
  }
});

/**
 * 6. POST /forgot-password — patient submits a reset request.
 * No email is sent. Clinic staff verify the patient's identity, read the
 * generated code back to them, then the patient enters it on the reset page.
 * We always return 200 to avoid leaking which emails exist.
 */
router.post("/forgot-password", authLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ message: "Service is not configured." });
  }

  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, String(email).trim().toLowerCase()))
      .limit(1);
    const user = rows[0];

    if (user && user.isActive) {
      const code = generateResetCode();
      const tokenHash = hashToken(code);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        displayCode: code,
        status: "pending",
        expiresAt,
      });

      // Try to deliver the code via Web Push. If the browser isn't subscribed
      // it's a graceful no-op — the admin queue still sees the code.
      try {
        const delivered = await sendPush(user.id, {
          title: "Hollyhill Dental — Password reset",
          body: `Your reset code is ${code}. It expires in 24 hours.`,
          url: "/?reset=1",
          tag: "password-reset",
        });
        if (delivered > 0) {
          await logActivity(
            { ...req, user: { id: user.id, role: user.role } },
            "auth.password.reset_code_pushed",
            { targetType: "user", targetId: user.id, metadata: { delivered } }
          );
        }
      } catch (pushErr) {
        console.error("[forgot-password] push delivery failed", pushErr?.message);
      }

      await logActivity(
        { ...req, user: { id: user.id, role: user.role } },
        "auth.password.reset_requested",
        {
          targetType: "user",
          targetId: user.id,
          metadata: { email: user.email },
        }
      );
    } else {
      await logActivity(req, "auth.password.reset_requested_unknown", {
        metadata: { email },
      });
    }

    return res.status(200).json({
      message:
        "Your reset request has been sent to the clinic. Please call the clinic on +353 21 430 3072 to receive your reset code.",
    });
  } catch (err) {
    console.error("[forgot-password] failed", err);
    return res.status(200).json({
      message:
        "Your reset request has been sent to the clinic. Please call the clinic on +353 21 430 3072 to receive your reset code.",
    });
  }
});

/**
 * 7. POST /reset-password — finalise the reset using the code provided by
 * clinic staff.
 * Body: { email, code, newPassword }
 */
router.post("/reset-password", authLimiter, async (req, res) => {
  const { email, code, newPassword } = req.body || {};
  if (!email || !code || !newPassword) {
    return res.status(400).json({
      message: "Email, reset code and new password are required.",
    });
  }
  if (!PASSWORD_REGEX.test(newPassword)) {
    return res.status(400).json({
      message:
        "Password must be at least 10 characters and contain upper, lower, digit and special characters.",
    });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ message: "Service is not configured." });
  }

  try {
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, String(email).trim().toLowerCase()))
      .limit(1);
    const user = userRows[0];
    if (!user || !user.isActive) {
      return res.status(400).json({ message: "Invalid email or reset code." });
    }

    const tokenHash = hashToken(String(code).trim().toUpperCase());
    const tokens = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);
    const tokenRow = tokens[0];
    if (!tokenRow) {
      return res
        .status(400)
        .json({ message: "Reset code is invalid or has expired." });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({
        passwordHash: newHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await db
      .update(passwordResetTokens)
      .set({
        usedAt: new Date(),
        status: "used",
        displayCode: null,
      })
      .where(eq(passwordResetTokens.id, tokenRow.id));

    await logActivity(
      { ...req, user: { id: user.id, role: user.role } },
      AuditActions.AUTH_PASSWORD_CHANGED,
      {
        targetType: "user",
        targetId: user.id,
        metadata: { via: "admin_reset_code" },
      }
    );

    return res.status(200).json({
      message: "Your password has been updated. You can now sign in.",
    });
  } catch (err) {
    console.error("[reset-password] failed", err);
    return res.status(500).json({ message: "Failed to reset password." });
  }
});

/**
 * 8. DELETE /me — patient self-service account closure.
 * Requires the current password. We *anonymise* the patient record so the
 * clinic's medical/legal retention obligations remain satisfied; the auth
 * user row is deleted, which cascades to login access only.
 */
router.delete("/me", verifyToken, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ message: "Service is not configured." });
  }
  const { password, reason } = req.body || {};
  if (!password) {
    return res
      .status(400)
      .json({ message: "Please confirm your password to delete the account." });
  }

  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: "User not found." });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: "Password is incorrect." });
    }

    // Anonymise the patient profile but keep clinical records intact.
    const pRows = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, user.id))
      .limit(1);
    const profile = pRows[0];
    if (profile) {
      await db
        .update(patients)
        .set({
          firstName: "Removed",
          lastName: "Patient",
          phone: "",
          email: `deleted+${profile.id.substring(0, 8)}@hollyhilldental.invalid`,
          address: null,
          emergencyContact: null,
          emergencyPhone: null,
          medicalConditions: null,
          medications: null,
          allergies: null,
          notes: null,
          gdprConsent: false,
          consentDate: null,
          updatedAt: new Date(),
          // We deliberately keep userId set to null below so the clinical
          // history stays linked to a depersonalised profile.
          userId: null,
        })
        .where(eq(patients.id, profile.id));
    }

    // Soft-delete inbound messages so threads collapse to "Message removed".
    // Disassociate senderId and deletedBy from the user row to prevent foreign key errors on user deletion.
    await db
      .update(messages)
      .set({ deletedAt: new Date(), deletedBy: null, senderId: null })
      .where(eq(messages.senderId, user.id));

    // Also nullify any other references where this user is the deleter (just in case)
    await db
      .update(messages)
      .set({ deletedBy: null })
      .where(eq(messages.deletedBy, user.id));

    // Finally, remove the auth user. Foreign keys with `on delete cascade`
    // (push subscriptions, audit log actorId becomes null) handle the rest.
    await db.delete(users).where(eq(users.id, user.id));

    await logActivity(
      { ...req, user: { id: user.id, role: user.role } },
      "auth.account.deleted",
      {
        targetType: "user",
        targetId: user.id,
        metadata: { reason: reason || null },
      }
    );

    res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
    return res.status(200).json({ message: "Your account has been removed." });
  } catch (err) {
    console.error("[delete-self] failed", err);
    return res.status(500).json({ message: "Failed to delete account." });
  }
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * 9. PATCH /profile — update display name for any authenticated user.
 */
router.patch("/profile", verifyToken, async (req, res) => {
  const { displayName } = req.body || {};
  if (!displayName || !String(displayName).trim()) {
    return res.status(400).json({ message: "Display name is required." });
  }
  try {
    const [updated] = await db
      .update(users)
      .set({ displayName: String(displayName).trim(), updatedAt: new Date() })
      .where(eq(users.id, req.user.id))
      .returning();
    return res.status(200).json({
      message: "Profile updated.",
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        displayName: updated.displayName,
        profilePicUrl: updated.profilePicUrl,
        mustChangePassword: !!updated.mustChangePassword,
      },
    });
  } catch (err) {
    console.error("[profile] patch failed", err);
    return res.status(500).json({ message: "Failed to update profile." });
  }
});

router.patch("/profile-pic", verifyToken, upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "No file provided." });
  }

  try {
    const uploadResult = await uploadToCloudinary(file.buffer, file.originalname);
    const profilePicUrl = uploadResult.secure_url;

    await db
      .update(users)
      .set({ profilePicUrl, updatedAt: new Date() })
      .where(eq(users.id, req.user.id));

    return res.status(200).json({
      message: "Profile picture updated successfully.",
      profilePicUrl,
    });
  } catch (error) {
    console.error("[profile-pic-upload] failed", error);
    return res.status(500).json({ message: "Failed to upload profile picture." });
  }
});

export default router;
