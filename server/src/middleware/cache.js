/**
 * In-process response cache middleware.
 *
 * Caches GET response bodies in a Map with TTL-based expiry.
 * Increments Prometheus cache hit/miss counters for observability.
 *
 * Limitations / upgrade path:
 *  - Memory-only: cache is per-process, not shared across instances.
 *  - For multi-instance deployments, swap the Map for an ioredis client
 *    without changing the public API (the middleware signature is the same).
 *
 * Usage:
 *   app.use("/api/products", cacheResponse(300, "products"), productRoutes);
 */

import { cacheHits, cacheMisses } from "../config/metrics.js";
import logger from "../lib/logger.js";

const cacheStore = new Map();

// Evict expired entries every 60 s — prevents unbounded memory growth
setInterval(() => {
  const now = Date.now();
  let evicted = 0;
  for (const [key, item] of cacheStore.entries()) {
    if (now > item.expiresAt) {
      cacheStore.delete(key);
      evicted++;
    }
  }
  if (evicted > 0) {
    logger.debug({ evicted }, "[cache] eviction run complete");
  }
}, 60_000).unref();

/**
 * @param {number} ttlSeconds  How long to cache a response
 * @param {string} namespace   Key prefix, also used as Prometheus label
 */
export function cacheResponse(ttlSeconds, namespace = "cache") {
  return (req, res, next) => {
    // Only cache safe, idempotent GET requests
    if (req.method !== "GET") return next();

    const key = `${namespace}:${req.originalUrl || req.url}`;

    try {
      const cached = cacheStore.get(key);
      if (cached) {
        if (Date.now() > cached.expiresAt) {
          cacheStore.delete(key);
        } else {
          cacheHits.labels(namespace).inc();
          res.setHeader("X-Cache", "HIT");
          return res.json(JSON.parse(cached.data));
        }
      }
    } catch (err) {
      logger.warn({ err, key }, "[cache] read error — bypassing cache");
    }

    cacheMisses.labels(namespace).inc();
    res.setHeader("X-Cache", "MISS");

    // Wrap res.json to capture the response and cache it
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      originalJson(body);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          cacheStore.set(key, {
            data: JSON.stringify(body),
            expiresAt: Date.now() + ttlSeconds * 1000,
          });
        } catch (err) {
          logger.warn({ err, key }, "[cache] write error");
        }
      }
    };

    next();
  };
}

/**
 * Invalidate all cache entries under a given namespace.
 * Call this after any mutation on the corresponding resource.
 *
 * Example: invalidateCache("products") clears all /api/products/* entries.
 */
export function invalidateCache(namespace) {
  let count = 0;
  for (const key of cacheStore.keys()) {
    if (key.startsWith(`${namespace}:`)) {
      cacheStore.delete(key);
      count++;
    }
  }
  if (count > 0) {
    logger.debug({ namespace, count }, "[cache] namespace invalidated");
  }
  return count;
}
