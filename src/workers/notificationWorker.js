import "../config/environment.js";
import redisClient from "../config/redis.config.js";
import PushNotificationService from "../services/pushNotification.service.js";
 import { QUEUE_NAME } from "../queues/notificationQueue.js";
 import { Worker } from 'bullmq';


 const CONCURRENCY = parseInt(process.env.QUEUE_CONCURRENCY || '50', 10);

// Worker uses its own dedicated Redis connection (BullMQ requirement)
const workerConnection = redisClient.duplicate();
const processJob = async (job) => {
    console.log(`Processing job ${job.id} with payload:`, job.data);
    const { tokens, payload } = job.data;
    const start = Date.now();

    console.log(`Processing job`, {
      jobId: job.id,
      tokenCount: tokens.length,
      title: payload.title,
    });

    // Update progress to 10% — job started
    await job.updateProgress(10);

    const result = await PushNotificationService.sendBatch(tokens, payload);

    await job.updateProgress(100);

    const elapsed = Date.now() - start;
    console.log(`Job done`, {
      jobId: job.id,
      successCount: result.successCount,
      failureCount: result.failureCount,
      invalidCount: result.invalidTokens.length,
      elapsedMs: elapsed,
    });

    // Return value is stored in BullMQ job for inspection
    return result;

}

 const worker = new Worker(QUEUE_NAME, processJob, {
  connection: workerConnection,
  concurrency: CONCURRENCY,

  // Stall detection — mark job as stalled after 30s of silence
  stalledInterval: 30_000,
  maxStalledCount: 2,

  // Limiter — max 200 jobs/second to avoid hammering FCM
  limiter: {
    max:      200,
    duration: 1000,
  },
});

// ── Worker events ──────────────────────────────────────────────────────────
worker.on('ready',     ()       => console.log(`🤖 Worker ready [concurrency=${CONCURRENCY}]`));
worker.on('active',    (job)    => console.log(`🤖 Worker: job ${job.id} started`));
worker.on('completed', (job, r) => console.log(`🤖 Worker: job ${job.id} completed`, r));
worker.on('failed',    (job, err) =>
  console.error(`🤖 Worker: job ${job?.id} failed`, { reason: err.message, attempts: job?.attemptsMade })
);
worker.on('error',     (err)    => console.error('🤖 Worker error', { message: err.message }));
worker.on('stalled',   (jobId)  => console.warn(`🤖 Worker: job ${jobId} stalled`));

// ── Graceful shutdown ──────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`${signal} received — draining worker...`);
  await worker.close();
  console.log('Worker shut down cleanly');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

console.log(`🚀 Notification worker started [queue=${QUEUE_NAME}]`);

export default worker;