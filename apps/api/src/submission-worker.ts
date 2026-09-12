import { Worker } from "bullmq";
import { prisma, type Prisma } from "@webform/db";
import { Redis } from "ioredis";
import { SUBMISSION_QUEUE_NAME, type SubmissionJobData } from "./queue.js";

/**
 * Run the BullMQ submission consumer inside the API process.
 * Needed on Render free tier (background workers are not available).
 */
export function startSubmissionWorker(redisUrl: string) {
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
    { connection },
  );

  worker.on("completed", (job) => {
    console.log(`stored submission ${job.id}`);
  });
  worker.on("failed", (job, err) => {
    console.error(`failed submission ${job?.id}:`, err.message);
  });

  console.log("submission worker listening (in-api)");

  return {
    async close() {
      await worker.close();
      await connection.quit().catch(() => undefined);
    },
  };
}
