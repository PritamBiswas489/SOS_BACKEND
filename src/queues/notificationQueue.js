import redisClient from "../config/redis.config.js";
import "../config/environment.js";
import db from "../databases/models/index.js"; 
const { JobQueues } = db;
 
import { Queue, QueueEvents } from 'bullmq';
const QUEUE_NAME =  'fcm_notifications';

const queueConnection = redisClient.duplicate();
const eventsConnection = redisClient.duplicate();

export const notificationQueue = new Queue(QUEUE_NAME, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: parseInt(process.env.QUEUE_MAX_RETRIES || '3', 10),
    backoff: {
      type: 'exponential',
      delay: parseInt(process.env.QUEUE_BACKOFF_DELAY || '5000', 10),
    },
    removeOnComplete: { count: 500 },   // Keep last 500 completed jobs
    removeOnFail:     { count: 1000 },  // Keep last 1000 failed for inspection
  },
});

// Queue-level event listener (for logging / metrics)
export const queueEvents = new QueueEvents(QUEUE_NAME, {
  connection: eventsConnection,
});
// Listen for completed jobs to log and store in JobQueues table
queueEvents.on('completed', async ({ jobId }) => {
  const job = await notificationQueue.getJob(jobId);
  console.log(`✅ Job ${jobId} completed`, {
    payload: job?.data?.payload,
    tokenCount: job?.data?.tokens?.length || 0,
    name: job?.name,
  });
  JobQueues.update(
    {status: 'completed', status_description: `✅ Job completed successfully at ${new Date().toISOString()}`},
    { where: { job_id: jobId } }
  );
    
});
// Listen for failed jobs to log and store in JobQueues table
queueEvents.on('failed', async ({ jobId, failedReason }) => {
  const job = await notificationQueue.getJob(jobId);
  console.log(`❌ Job ${jobId} failed`, {
    reason: failedReason,
    payload: job?.data?.payload,
    tokenCount: job?.data?.tokens?.length || 0,
    name: job?.name,
  });
    JobQueues.update(
    {status: 'failed', status_description: `❌ Job failed at ${new Date().toISOString()} with reason: ${failedReason}`},
    { where: { job_id: jobId } }
  );
});
// Listen for stalled jobs to log (these will be retried automatically by BullMQ)
queueEvents.on('stalled', async ({ jobId }) => {
  const job = await notificationQueue.getJob(jobId);
  console.log(`⚠️ Job ${jobId} stalled`, {
    payload: job?.data?.payload,
    tokenCount: job?.data?.tokens?.length || 0,
    name: job?.name,
  });
     JobQueues.update(
            {status: 'stalled', status_description: `⚠️ Job stalled at ${new Date().toISOString()}`},
            { where: { job_id: jobId } }
  );

});

/**
 * Enqueue a single batch job.
 * @param {string[]} tokens  - FCM device tokens (max 500)
 * @param {object}   payload - { title, body, data, imageUrl, ... }
 * @param {object}   opts    - BullMQ job options override
 */
export const enqueueBatch = async (tokens, payload, opts = {}) => {
  const job = await notificationQueue.add(
    'send_batch',
    { tokens, payload },
    opts
  );
  console.log(`Enqueued batch job`, { jobId: job.id, tokenCount: tokens.length });
    JobQueues.create({
        job_id: job.id,
        job_name: 'send_batch',
        payloads: {tokenLength: tokens.length, ...payload   },
        status: 'pending',
        status_description: `📨 Job enqueued at ${new Date().toISOString()}`,
  });
  return job.id;
};

/**
 * Split a large token list into BATCH_SIZE chunks and enqueue all.
 * Returns array of job IDs.
 */
export const enqueueBulk = async (allTokens, payload) => {
  const batchSize = parseInt(process.env.BATCH_SIZE || '500', 10);
  const jobIds = [];

  for (let i = 0; i < allTokens.length; i += batchSize) {
    const chunk = allTokens.slice(i, i + batchSize);
    const jobId = await enqueueBatch(chunk, payload, {
      // Priority based on position (first batch = higher priority)
      priority: Math.ceil(i / batchSize) + 1,
    });
    jobIds.push(jobId);
  }

  console.log(`Bulk enqueue complete`, {
    totalTokens: allTokens.length,
    totalBatches: jobIds.length,
  });

  return jobIds;
};

export { QUEUE_NAME };
