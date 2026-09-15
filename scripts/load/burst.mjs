/**
 * Burst load generator for the public submit path — with measurements.
 *
 * Usage:
 *   npm run load:setup
 *   npm run load -- --ownerId=<uuid> --slug=<slug> --concurrency=20 --requests=50
 *
 * Optional: waits for the worker to persist accepted jobs (needs DATABASE_URL).
 * 429s mean RATE_LIMIT_PER_MINUTE was hit — raise it locally for ingest measurements.
 */
import { parseArgs } from "node:util";
import {
  connectPrisma,
  loadRootEnvFile,
  newRunId,
  printHttpSummary,
  probePublished,
  runPool,
  submitUrl,
  summarizeHttp,
  waitUntilPersisted,
  writeReport,
} from "./lib.mjs";

loadRootEnvFile();

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "http://127.0.0.1:3001" },
    ownerId: { type: "string" },
    slug: { type: "string", default: "load-test" },
    concurrency: { type: "string", default: "20" },
    requests: { type: "string", default: "50" },
    emailField: { type: "string", default: "email" },
    waitPersist: { type: "string", default: "true" },
    timeoutMs: { type: "string", default: "60000" },
  },
});

const base = (values.base ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const ownerId = values.ownerId;
const slug = values.slug ?? "load-test";
const concurrency = Number(values.concurrency ?? "20");
const total = Number(values.requests ?? "50");
const emailField = values.emailField ?? "email";
const waitPersist = (values.waitPersist ?? "true") !== "false";
const timeoutMs = Number(values.timeoutMs ?? "60000");

if (!ownerId) {
  console.error("Missing --ownerId (UUID). Run `npm run load:setup` first and copy ownerId.");
  process.exit(1);
}

const probe = await probePublished(base, ownerId, slug);
if (!probe.ok) {
  console.error(
    `Form ${ownerId}/${slug} is not published (HTTP ${probe.status}). Publish a form first, then re-run.`,
  );
  process.exit(1);
}

const runId = newRunId("burst");
const url = submitUrl(base, ownerId, slug);

console.log(`Bursting ${total} submits → ${url}`);
console.log(`concurrency=${concurrency}  runId=${runId}`);

const wallStart = performance.now();
const results = await runPool({ url, total, concurrency, emailField, runId });
const http = summarizeHttp(results, performance.now() - wallStart);
printHttpSummary("HTTP ingest", http);

if (http.byStatus["429"]) {
  console.log(
    "Note: 429s are expected if RATE_LIMIT_PER_MINUTE is hit. Raise that env locally (and restart the API) to measure ingest capacity rather than the limiter.",
  );
}

const report = {
  kind: "burst",
  at: new Date().toISOString(),
  runId,
  ownerId,
  slug,
  concurrency,
  waitPersist,
  http,
  persist: null,
};

if (http.accepted === 0) {
  writeReport(`burst-${runId}`, report);
  console.error("No requests were accepted (202). Nothing to measure in the queue/worker.");
  process.exit(2);
}

if (waitPersist) {
  try {
    const prisma = await connectPrisma();
    try {
      const persist = await waitUntilPersisted({
        prisma,
        runId,
        expected: http.accepted,
        timeoutMs,
      });
      report.persist = {
        expectedAccepted: http.accepted,
        persisted: persist.count,
        queueProcessingMs: persist.drainMs,
        allAcceptedPersisted: persist.ok && persist.count === http.accepted,
      };
      console.log("--- queue / worker ---");
      console.log(`persisted rows:     ${persist.count} / ${http.accepted} accepted`);
      console.log(`queue+DB drain:     ${persist.drainMs.toFixed(0)} ms`);
      if (persist.ok && persist.count === http.accepted) {
        const persistRps = persist.drainMs > 0 ? (persist.count / persist.drainMs) * 1000 : 0;
        console.log(`persist throughput: ${persistRps.toFixed(1)} rows/s`);
        report.persist.persistThroughputRps = persistRps;
      } else {
        console.log(
          "Persist wait timed out or count mismatch. Redis may still be draining, or the worker is down.",
        );
      }
    } finally {
      await prisma.$disconnect().catch(() => undefined);
    }
  } catch (err) {
    console.log(`Skipping persist wait: ${err instanceof Error ? err.message : String(err)}`);
  }
}

const file = writeReport(`burst-${runId}`, report);
console.log(`report: ${file}`);
console.log("Do not copy these numbers into docs unless this is a run you actually performed.");
