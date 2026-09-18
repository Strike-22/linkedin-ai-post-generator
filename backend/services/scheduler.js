import { Queue, Worker } from 'bullmq';
import { connection } from '../config/redis.js';
import { publishToLinkedIn } from './linkedin.js';
import { generatePost } from './postGenerator.js';
import { appendPublishLog } from './publishLog.js';

export const postQueue = new Queue('linkedin-posts', { connection });

const scheduledJobs = new Map();

function validatePublishTime(publishTime) {
  if (!/^\d{2}:\d{2}$/.test(publishTime)) {
    throw new Error('publishTime must use HH:MM format');
  }

  const [hours, minutes] = publishTime.split(':').map(Number);
  if (hours > 23 || minutes > 59) {
    throw new Error('publishTime must be a valid 24-hour time');
  }

  return { hours, minutes };
}

export async function schedulePost({ topic, tone, audience, length, scheduledTime }) {
  const runAt = new Date(scheduledTime);
  const delay = runAt.getTime() - Date.now();

  if (Number.isNaN(runAt.getTime())) throw new Error('scheduledTime must be a valid ISO date');
  if (delay <= 0) throw new Error('scheduledTime must be in the future');

  const jobId = `post-${Date.now()}`;

  await postQueue.add(
    'publish-post',
    { topic, tone, audience, length },
    {
      jobId,
      delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 50,
      removeOnFail: 100,
    }
  );

  const record = {
    jobId,
    topic,
    tone,
    audience,
    length,
    scheduledTime: runAt.toISOString(),
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };

  scheduledJobs.set(jobId, record);
  return record;
}

export async function scheduleDailyPost({ topic, tone, audience, length, publishTime, timezone = 'UTC' }) {
  const { hours, minutes } = validatePublishTime(publishTime);
  const pattern = `${minutes} ${hours} * * *`;
  const jobId = `daily-post-${Date.now()}`;

  const job = await postQueue.add(
    'publish-post',
    { topic, tone, audience, length, scheduleId: jobId },
    {
      jobId,
      repeat: { pattern, tz: timezone },
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 50,
      removeOnFail: 100,
    }
  );

  const record = {
    jobId,
    repeatKey: job.repeatJobKey || null,
    topic,
    tone,
    audience,
    length,
    publishTime,
    timezone,
    pattern,
    status: 'recurring',
    createdAt: new Date().toISOString(),
  };

  scheduledJobs.set(jobId, record);
  return record;
}

export async function cancelJob(jobId) {
  const record = scheduledJobs.get(jobId);

  if (record?.repeatKey) {
    await postQueue.removeRepeatableByKey(record.repeatKey);
  } else {
    const repeatableJobs = await postQueue.getRepeatableJobs();
    const repeatable = repeatableJobs.find((job) => job.id === jobId || job.key === record?.repeatKey);
    if (repeatable) await postQueue.removeRepeatableByKey(repeatable.key);
  }

  const job = await postQueue.getJob(jobId);
  if (job) await job.remove();

  if (record) {
    record.status = 'cancelled';
    record.cancelledAt = new Date().toISOString();
  }

  return true;
}

export async function getAllJobs() {
  return Array.from(scheduledJobs.values());
}

const worker = new Worker(
  'linkedin-posts',
  async (job) => {
    const { topic, tone, audience, length, scheduleId } = job.data;
    const trackedJobId = scheduleId || job.id;
    const record = scheduledJobs.get(trackedJobId);

    if (record?.status === 'cancelled') {
      return { skipped: true, reason: 'Schedule was cancelled before publish' };
    }

    console.log(`Processing job ${job.id}: ${topic.title}`);

    const postText = await generatePost({ topic, tone, audience, length });
    const result = await publishToLinkedIn(postText);

    await appendPublishLog({ type: 'scheduled', status: 'success', result }).catch(() => {});

    if (record && record.status !== 'recurring') {
      record.status = 'published';
    }

    if (record) {
      record.lastPublishedAt = new Date().toISOString();
      record.linkedinPostId = result.id;
    }

    return { postText, linkedinPostId: result.id };
  },
  { connection, concurrency: 1 }
);

worker.on('failed', async (job, err) => {
  const trackedJobId = job?.data?.scheduleId || job?.id;
  const record = trackedJobId ? scheduledJobs.get(trackedJobId) : null;

  console.error(`Job ${job?.id || 'unknown'} failed:`, err.message);

  await appendPublishLog({
    type: 'scheduled',
    status: 'failed',
    error: err.message,
    topic: job?.data?.topic?.title,
  }).catch(() => {});

  if (record) {
    record.status = record.status === 'recurring' ? 'recurring' : 'failed';
    record.lastError = err.message;
    record.lastFailedAt = new Date().toISOString();
  }
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});
