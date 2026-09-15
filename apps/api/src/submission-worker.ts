import { Worker } from "bullmq";
import { prisma, type Prisma } from "@webform/db";
import { Redis } from "ioredis";
import { SUBMISSION_QUEUE_NAME, type SubmissionJobData } from "./queue.js";

/**
 * Run the BullMQ submission consumer inside the API process.
 * Needed on Render free tier (background workers are not available).
 */
export function startSubmissionWorker(redisUrl: string, concurrency = 4) {
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    connectTimeout: 3000,
    enableOfflineQueue: false,
  });
  connection.on("error", () => {
    /* fail-soft; Worker will surface job failures */
  });

  const worker = new Worker<SubmissionJobData>(
    SUBMISSION_QUEUE_NAME,
    async (job) => {
      const { formId, formVersionId, payload, idempotencyKey } = job.data;
      await prisma.formSubmission.upsert({
        where: { idempotencyKey },
        create: {
          formId,
          formVersionId,
          payload: payload as Prisma.InputJsonValue,
          idempotencyKey,
        },
        update: {},
      });
    },
    { connection, concurrency },
  );

  let completed = 0;
  worker.on("completed", () => {
    completed += 1;
    if (completed === 1 || completed % 50 === 0) {
      console.log(`stored submissions: ${completed}`);
    }
  });
  worker.on("failed", (job, err) => {
    console.error(`failed submission ${job?.id}:`, err.message);
  });

  console.log(`submission worker listening (in-api) concurrency=${concurrency}`);

  return {
    async close() {
      await worker.close();
      await connection.quit().catch(() => undefined);
    },
  };
}
