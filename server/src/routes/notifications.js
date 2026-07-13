import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { db } from "../config/db.js";
import { notifications, notificationTokens } from "../db/schema.js";
import { eq, and, desc, or, ilike } from "drizzle-orm";
import { admin } from "../config/firebaseAdmin.js";

const router = express.Router();

// --- SSE Connection Management ---
const activeClients = new Map();

const addClient = (userId, res) => {
  if (!activeClients.has(userId)) {
    activeClients.set(userId, []);
  }
  activeClients.get(userId).push(res);
};

const removeClient = (userId, res) => {
  if (activeClients.has(userId)) {
    const clients = activeClients.get(userId);
    const newClients = clients.filter(c => c !== res);
    if (newClients.length === 0) {
      activeClients.delete(userId);
    } else {
      activeClients.set(userId, newClients);
    }
  }
};

const broadcastToUser = (userId, eventType, data) => {
  if (activeClients.has(userId)) {
    const clients = activeClients.get(userId);
    clients.forEach(res => {
      res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
    });
  }
};

// GET /api/notifications/stream (SSE Endpoint)
router.get("/stream", verifyToken, (req, res) => {
  const userId = req.user.id;
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  addClient(userId, res);

  res.write(`event: connected\ndata: ${JSON.stringify({ message: "SSE connected" })}\n\n`);

  req.on("close", () => {
    removeClient(userId, res);
  });
});
// ---------------------------------

// GET /api/notifications
router.get(["/", "/me"], verifyToken, async (req, res, next) => {
  try {
    const { filter = "all", search = "" } = req.query;
    const userId = req.user.id;

    const conditions = [eq(notifications.userId, userId)];

    if (filter === "unread") conditions.push(eq(notifications.isRead, false));
    else if (filter === "read") conditions.push(eq(notifications.isRead, true));
    else if (filter === "archived") conditions.push(eq(notifications.isArchived, true));
    else if (filter !== "all") conditions.push(eq(notifications.type, filter));

    if (filter !== "archived") conditions.push(eq(notifications.isArchived, false));

    if (search) {
      conditions.push(
        or(
          ilike(notifications.title, `%${search}%`),
          ilike(notifications.message, `%${search}%`)
        )
      );
    }

    const results = await db.select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));

    res.json(results);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    broadcastToUser(userId, "update", { type: "read", id });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/archive
router.patch("/:id/archive", verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.update(notifications)
      .set({ isArchived: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    broadcastToUser(userId, "update", { type: "archive", id });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    broadcastToUser(userId, "update", { type: "delete", id });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/mark-all-read
router.post("/mark-all-read", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    broadcastToUser(userId, "update", { type: "mark-all-read" });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/register (Save FCM Token)
router.post("/register", verifyToken, async (req, res, next) => {
  try {
    const { token, device = "Unknown", browser = "Unknown" } = req.body;
    const userId = req.user.id;

    if (!token) return res.status(400).json({ error: "Token is required" });

    // Check if token exists
    const existing = await db.select().from(notificationTokens).where(eq(notificationTokens.token, token));
    
    if (existing.length === 0) {
      await db.insert(notificationTokens).values({
        userId,
        token,
        device,
        browser,
      });
    } else if (existing[0].userId !== userId) {
      // Reassign to new user if token changed owners (e.g. logout/login)
      await db.update(notificationTokens)
        .set({ userId, updatedAt: new Date() })
        .where(eq(notificationTokens.token, token));
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Helper function to create a persistent notification AND push it via FCM
export const createNotification = async ({ userId, title, message, type = "info", metadata = {} }) => {
  try {
    // 1. Save to PostgreSQL
    const [savedNotification] = await db.insert(notifications).values({
      userId,
      title,
      message,
      type,
      metadata
    }).returning();

    // 2. Push via SSE (Socket.IO equivalent for open tabs)
    broadcastToUser(userId, "update", { type: "new", notification: savedNotification });

    // 3. Push via Firebase FCM (For background/native push)
    if (admin) {
      const tokens = await db.select().from(notificationTokens).where(eq(notificationTokens.userId, userId));
      
      if (tokens.length > 0) {
        const fcmTokens = tokens.map(t => t.token);
        const payload = {
          notification: {
            title,
            body: message,
          },
          data: {
            url: metadata.actionUrl || "/",
            type
          },
          tokens: fcmTokens
        };

        const response = await admin.messaging().sendMulticast(payload);
        
        // Step 20 - Expired Token Cleanup
        if (response.failureCount > 0) {
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success && (resp.error.code === 'messaging/invalid-registration-token' || resp.error.code === 'messaging/registration-token-not-registered')) {
              failedTokens.push(fcmTokens[idx]);
            }
          });
          
          if (failedTokens.length > 0) {
            // Delete expired tokens
            for (const t of failedTokens) {
              await db.delete(notificationTokens).where(eq(notificationTokens.token, t));
            }
          }
        }
      }
    }

    return savedNotification;
  } catch (error) {
    console.error("Failed to create/send notification:", error);
    return null;
  }
};

export default router;
