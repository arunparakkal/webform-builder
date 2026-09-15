import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

function loadRootEnvFile() {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [resolve(here, "../../../.env"), resolve(process.cwd(), ".env")];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
    break;
  }
}

function concurrencyFromEnv() {
  const n = Number(process.env.SUBMIT_WORKER_CONCURRENCY ?? "4");
  if (!Number.isFinite(n) || n < 1) return 4;
  return Math.min(32, Math.floor(n));
}

async function main() {
  loadRootEnvFile();
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
  const concurrency = concurrencyFromEnv();

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

  console.log(`submission worker listening concurrency=${concurrency}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
