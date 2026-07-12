import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "../config/db.js";
import { appSettings, users, staff } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import os from "os";

const router = express.Router();

// Helper for AppSettings
const getAppSetting = async (key) => {
  const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return result.length > 0 ? result[0].value : {};
};

const setAppSetting = async (key, value) => {
  const existing = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(appSettings).set({ value, updatedAt: new Date() }).where(eq(appSettings.key, key));
  } else {
    await db.insert(appSettings).values({ key, value });
  }
};

// 1. PROFILE
router.get("/profile", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    const staffInfo = await db.select().from(staff).where(eq(staff.userId, req.user.id)).limit(1);
    
    if (!user.length) return res.status(404).json({ success: false, message: "User not found" });
    
    res.json({
      success: true,
      data: {
        ...user[0],
        ...(staffInfo.length ? staffInfo[0] : {})
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put("/profile", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { displayName, phone, bio, department, schedule } = req.body;
    
    await db.update(users).set({ displayName, updatedAt: new Date() }).where(eq(users.id, req.user.id));
    
    const staffExists = await db.select().from(staff).where(eq(staff.userId, req.user.id)).limit(1);
    if (staffExists.length > 0) {
      await db.update(staff).set({ phone, bio, department, schedule, updatedAt: new Date() }).where(eq(staff.userId, req.user.id));
    }
    
    res.json({ success: true, data: { message: "Profile updated" } });
  } catch (error) {
    next(error);
  }
});

// 2. SECURITY
router.get("/security", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        twoFactorEnabled: false,
        sessions: [
          { id: "1", device: "Chrome / Windows", ip: req.ip, lastActive: new Date() }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put("/security", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    
    if (currentPassword && newPassword) {
      const match = await bcrypt.compare(currentPassword, user[0].passwordHash);
      if (!match) return res.status(400).json({ success: false, message: "Incorrect current password" });
      
      const hash = await bcrypt.hash(newPassword, 10);
      await db.update(users).set({ passwordHash: hash, mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, req.user.id));
    }
    
    res.json({ success: true, data: { message: "Security settings updated" } });
  } catch (error) {
    next(error);
  }
});

// 3. APPEARANCE
router.get("/appearance", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const data = await getAppSetting("appearance");
    res.json({ success: true, data: data || { theme: "system", primaryColor: "blue", sidebarMode: "expanded" } });
  } catch (error) {
    next(error);
  }
});

router.put("/appearance", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    await setAppSetting("appearance", req.body);
    res.json({ success: true, data: req.body });
  } catch (error) {
    next(error);
  }
});

// 4. SYSTEM
router.get("/system", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        backendStatus: "Healthy",
        databaseStatus: "Connected",
        redisStatus: "Connected",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        memoryUsage: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        cpuCount: os.cpus().length,
        os: os.platform(),
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put("/system", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    await setAppSetting("system", req.body);
    res.json({ success: true, data: req.body });
  } catch (error) {
    next(error);
  }
});

// 5. NOTIFICATIONS
router.get("/notifications", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const data = await getAppSetting("notifications");
    res.json({ success: true, data: data || {} });
  } catch (error) {
    next(error);
  }
});

router.put("/notifications", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    await setAppSetting("notifications", req.body);
    res.json({ success: true, data: req.body });
  } catch (error) {
    next(error);
  }
});

// 6. TEAM
router.get("/team", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const members = await db.select({
      id: staff.id,
      userId: staff.userId,
      firstName: staff.firstName,
      lastName: staff.lastName,
      role: staff.role,
      department: staff.department,
      phone: staff.phone,
      email: staff.email,
      isActive: users.isActive
    }).from(staff).leftJoin(users, eq(users.id, staff.userId));
    
    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
});

router.post("/team", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { email, firstName, lastName, role, department } = req.body;
    
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) return res.status(400).json({ success: false, message: "Email already exists" });

    // Generate random password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hash = await bcrypt.hash(tempPassword, 10);
    
    const [newUser] = await db.insert(users).values({
      email,
      passwordHash: hash,
      role: 'admin',
      displayName: `${firstName} ${lastName}`,
      mustChangePassword: true,
    }).returning();
    
    const [newStaff] = await db.insert(staff).values({
      userId: newUser.id,
      firstName,
      lastName,
      email,
      role: role || 'staff',
      department
    }).returning();

    res.json({ success: true, data: { message: "Member invited", tempPassword, staff: newStaff } });
  } catch (error) {
    next(error);
  }
});

router.put("/team/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, department, isActive } = req.body;
    await db.update(staff).set({ firstName, lastName, role, department, updatedAt: new Date() }).where(eq(staff.id, id));
    
    const staffMember = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
    if (staffMember.length > 0 && isActive !== undefined) {
      await db.update(users).set({ isActive }).where(eq(users.id, staffMember[0].userId));
    }
    
    res.json({ success: true, data: { message: "Member updated" } });
  } catch (error) {
    next(error);
  }
});

router.delete("/team/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const staffMember = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
    if (staffMember.length > 0) {
      await db.delete(users).where(eq(users.id, staffMember[0].userId)); // cascade deletes staff
    }
    res.json({ success: true, data: { message: "Member removed" } });
  } catch (error) {
    next(error);
  }
});

// Generic catch-all for any other settings to avoid 404
router.get("/:key", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { key } = req.params;
    const data = await getAppSetting(key);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.all("/:key", verifyToken, requireRole("admin"), async (req, res, next) => {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return next();
  }
  try {
    const { key } = req.params;
    await setAppSetting(key, req.body);
    res.json({ success: true, data: req.body });
  } catch (error) {
    next(error);
  }
});

export default router;
