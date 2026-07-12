/**
 * Prometheus metrics — prom-client registry.
 *
 * Exposes:
 *  - Default Node.js process metrics (CPU, memory, GC, event loop lag)
 *  - HTTP request duration histogram
 *  - HTTP request counter by route/method/status
 *  - In-memory cache hit/miss counters
 *
 * The /api/system/metrics endpoint serves these for scraping by Prometheus /
 * Grafana. The endpoint is public (no auth) so Prometheus can scrape without
 * credentials — restrict network access at the infra level if needed.
 */

import client from "prom-client";

const register = new client.Registry();

register.setDefaultLabels({ app: "hollyhill-dental-server" });

// Collect default Node.js metrics (CPU, memory, GC, etc.)
client.collectDefaultMetrics({ register });

// ── HTTP metrics ──────────────────────────────────────────────────────────────

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in milliseconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// ── Cache metrics ─────────────────────────────────────────────────────────────

export const cacheHits = new client.Counter({
  name: "cache_hits_total",
  help: "Total in-memory cache hits",
  labelNames: ["namespace"],
  registers: [register],
});

export const cacheMisses = new client.Counter({
  name: "cache_misses_total",
  help: "Total in-memory cache misses",
  labelNames: ["namespace"],
  registers: [register],
});

// ── DB pool metrics ───────────────────────────────────────────────────────────

export const dbQueryDuration = new client.Histogram({
  name: "db_query_duration_ms",
  help: "Duration of database queries in milliseconds",
  labelNames: ["operation"],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: [register],
});

export const metricsRegistry = register;
