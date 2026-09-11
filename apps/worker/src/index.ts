import { Worker } from "bullmq";
import { prisma, type Prisma } from "@webform/db";
import { Redis } from "ioredis";

const SUBMISSION_QUEUE_NAME = "form-submissions";

type SubmissionJobData = {
  formId: string;
  formVersionId: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
};

async function main() {
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

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

  console.log("submission worker listening");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
