/**
 * workers/index.js — In-process background job queues.
 *
 * Uses a simple EventEmitter-based queue. For production workloads that need
 * persistence, retries or distributed workers, swap this out for BullMQ +
 * Redis without changing the public API (add(), initWorkers()).
 */
import { EventEmitter } from "events";
import logger from "../lib/logger.js";

class MemoryQueue extends EventEmitter {
  constructor(name, processor) {
    super();
    this.name = name;
    this.processor = processor;

    this.on("job", async (job) => {
      const start = Date.now();
      try {
        await this.processor(job);
        logger.debug(
          { queue: this.name, jobId: job.id, jobName: job.name, duration: `${Date.now() - start}ms` },
          `[worker] Job completed`
        );
      } catch (err) {
        logger.error(
          { queue: this.name, jobId: job.id, err },
          `[worker] Job failed`
        );
      }
    });
  }

  add(jobName, data, opts = {}) {
    const job = {
      id: Math.random().toString(36).slice(2, 9),
      name: jobName,
      data,
      opts,
      timestamp: Date.now(),
    };
    // Process asynchronously — don't block the caller
    setImmediate(() => this.emit("job", job));
    return Promise.resolve(job);
  }
}

// ── Processors ────────────────────────────────────────────────────────────────

const processBackup = async (job) => {
  logger.info({ jobId: job.id }, "[worker] Backup job running (stub)");
  // TODO: replace with real pg_dump → S3 implementation
  await new Promise((res) => setTimeout(res, 100));
};

const processNotification = async (job) => {
  logger.debug({ jobId: job.id, data: job.data }, "[worker] Notification delivery");
  // TODO: hook into SSE broadcast or Web Push
};

const processEmail = async (job) => {
  logger.info({ jobId: job.id, to: job.data?.to }, "[worker] Email delivery (stub)");
  // TODO: wire up an SMTP provider (Postmark, Resend, SES)
};

// ── Exported queues ───────────────────────────────────────────────────────────

export const backupQueue = new MemoryQueue("SystemBackup", processBackup);
export const notificationQueue = new MemoryQueue("Notifications", processNotification);
export const emailQueue = new MemoryQueue("Emails", processEmail);

export function initWorkers() {
  logger.info("[workers] Background queues initialised (in-process MemoryQueue)");
}
