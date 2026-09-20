import { Worker } from "bullmq";
import { persistSubmission, prisma, type Prisma } from "@webform/db";
import { Redis } from "ioredis";
import { SUBMISSION_QUEUE_NAME, type SubmissionJobData } from "./queue.js";
import { emitSubmissionEvent } from "./submission-events.js";

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
      const persisted = await persistSubmission(prisma, {
        formId,
        formVersionId,
        payload: payload as Prisma.InputJsonValue,
        idempotencyKey,
      });
      if (!persisted.stored) {
        console.log(`duplicate submission ignored ${idempotencyKey}`);
      }
      // Always emit: a retry after a failed XADD must not drop the event.
      // Flink dedups by submissionId. Persist skipDuplicates prevents a second row.
      await emitSubmissionEvent(connection, {
        submissionId: persisted.submissionId,
        formId: persisted.formId,
        submittedAt: persisted.submittedAt,
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
