import dotenv from "dotenv";
dotenv.config();

/**
 * Centralised environment validation.
 *
 * Required secrets MUST be provided via the environment in production. We
 * fail fast at boot rather than silently using insecure defaults.
 */
const isProd = process.env.NODE_ENV === "production";

function required(key, { allowDevDefault } = {}) {
  const value = process.env[key];
  if (value && value.trim().length > 0) return value;

  if (isProd) {
    // Hard fail in production — never run with a missing secret.
    // eslint-disable-next-line no-console
    console.error(
      `[env] FATAL: required environment variable ${key} is not set.`
    );
    process.exit(1);
  }

  if (allowDevDefault) return allowDevDefault;
  return undefined;
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PROD: isProd,
  JWT_SECRET: required("JWT_SECRET", {
    allowDevDefault: "dev-only-jwt-secret-please-change-me-please",
  }),
  CLIENT_URL: required("CLIENT_URL", {
    allowDevDefault: "http://localhost:3000",
  }),
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  DATABASE_URL: process.env.DATABASE_URL || "",
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
};

/** Cookie options shared by every auth-issuing endpoint. */
export const cookieOptions = {
  httpOnly: true,
  secure: ENV.IS_PROD, // HTTPS-only in production
  sameSite: ENV.IS_PROD ? "none" : "lax", // cross-site safe in prod for SPA + API
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
  ...(ENV.COOKIE_DOMAIN ? { domain: ENV.COOKIE_DOMAIN } : {}),
};
