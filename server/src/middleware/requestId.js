/**
 * Request ID middleware.
 *
 * Attaches a unique request ID to every incoming request so log lines from
 * the same request can be correlated across services/log aggregators.
 *
 * Honour an upstream X-Request-ID if present (from load balancers / API
 * gateways) — this lets the full distributed trace be reconstructed from
 * a single ID.
 */
import { v4 as uuidv4 } from "uuid";

export function requestId(req, res, next) {
  const id =
    (typeof req.headers["x-request-id"] === "string" &&
      req.headers["x-request-id"].slice(0, 64)) ||
    uuidv4();
  req.id = id;
  res.setHeader("X-Request-ID", id);
  next();
}
