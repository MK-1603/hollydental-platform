import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

const JWT_SECRET = ENV.JWT_SECRET;

/**
 * Authentication middleware.
 *
 * - Reads the JWT only from the httpOnly `token` cookie. The Authorization
 *   header path was removed because storing tokens client-side opens the door
 *   to XSS theft.
 * - Returns 401 (no token) or 401 (invalid token) so the frontend can react
 *   uniformly with the session-expired bus.
 * - Blocks anything except the password change / sign-out / who-am-I routes
 *   while the user is in the "must change password" state.
 */
export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session." });
  }

  req.user = decoded; // { id, role, mustChangePassword }

  if (decoded.mustChangePassword) {
    const allowedPaths = [
      "/api/auth/change-password",
      "/api/auth/me",
      "/api/auth/logout",
    ];
    const isAllowed = allowedPaths.some(
      (p) => req.originalUrl && req.originalUrl.startsWith(p)
    );
    if (!isAllowed) {
      return res.status(403).json({
        message:
          "Password change is required before accessing other resources.",
        code: "PASSWORD_CHANGE_REQUIRED",
      });
    }
  }

  next();
};

/**
 * Admin authorization middleware.
 * Must be used after verifyToken.
 */
export const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required." });
  }
  next();
};
