/**
 * Controlled Postgres volume steps on the real submit pipeline.
 *
 * Default sizes stay small (50 / 100 / 200). Do not aim this at production
 * and do not raise volumes without watching Redis/Postgres.
 *
 * Usage:
 *   npm run load:volume -- --ownerId=<uuid> --slug=<slug>
 */
import { parseArgs } from "node:util";
import {
  connectPrisma,
  loadRootEnvFile,
  newRunId,
  probePublished,
  runPool,
  sleep,
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
    slug: { type: "string" },
    concurrency: { type: "string", default: "10" },
    sizes: { type: "string", default: "50,100,200" },
    emailField: { type: "string", default: "email" },
    timeoutMs: { type: "string", default: "180000" },
    pauseMs: { type: "string", default: "1500" },
  },
});

const base = (values.base ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const ownerId = values.ownerId;
const slug = values.slug;
const concurrency = Number(values.concurrency ?? "10");
const sizes = (values.sizes ?? "50,100,200")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n) && n > 0);
const emailField = values.emailField ?? "email";
const timeoutMs = Number(values.timeoutMs ?? "90000");
const pauseMs = Number(values.pauseMs ?? "1500");

if (!ownerId || !slug) {
  console.error("Missing --ownerId and --slug. Run `npm run load:setup` first.");
  process.exit(1);
}
if (sizes.length === 0) {
  console.error("No valid --sizes. Example: --sizes=50,100,200");
  process.exit(1);
}

const probe = await probePublished(base, ownerId, slug);
if (!probe.ok) {
  console.error(`Form ${ownerId}/${slug} is not published (HTTP ${probe.status}).`);
  process.exit(1);
}

const prisma = await connectPrisma();
const url = submitUrl(base, ownerId, slug);
const steps = [];
let failed = false;

console.log(`DB volume steps: ${sizes.join(", ")}  concurrency=${concurrency}`);
console.log(
  "If you see many 429s, raise RATE_LIMIT_PER_MINUTE locally — otherwise this measures the limiter, not Postgres.",
);

try {
  for (const size of sizes) {
    const runId = newRunId(`vol${size}`);
    console.log(`\n=== size ${size}  runId=${runId} ===`);
    const wallStart = performance.now();
    const results = await runPool({ url, total: size, concurrency, emailField, runId });
    const http = summarizeHttp(results, performance.now() - wallStart);

    const persist = await waitUntilPersisted({
      prisma,
      runId,
      expected: http.accepted,
      timeoutMs,
    });
    const persistRps =
      persist.ok && persist.drainMs > 0 ? (persist.count / persist.drainMs) * 1000 : null;

    const step = {
      size,
      runId,
      http,
      persist: {
        expectedAccepted: http.accepted,
        persisted: persist.count,
        queueProcessingMs: persist.drainMs,
        allAcceptedPersisted: persist.ok && persist.count === http.accepted,
        persistThroughputRps: persistRps,
      },
    };
    steps.push(step);

    console.log(
      `HTTP accepted ${http.accepted}/${http.total}  p95 ${http.latencyMs.p95.toFixed(1)} ms  ${http.throughputRps.toFixed(1)} req/s`,
    );
    console.log(
      `persist ${persist.count}/${http.accepted} in ${persist.drainMs.toFixed(0)} ms` +
        (persistRps != null ? `  (${persistRps.toFixed(1)} rows/s)` : ""),
    );

    if (http.accepted === 0) failed = true;
    if (!(persist.ok && persist.count === http.accepted)) failed = true;

    await sleep(pauseMs);
  }
} finally {
  await prisma.$disconnect().catch(() => undefined);
}

const report = {
  kind: "volume",
  at: new Date().toISOString(),
  ownerId,
  slug,
  concurrency,
  sizes,
  steps,
};

const file = writeReport(`volume-${Date.now()}`, report);
console.log("\n=== summary ===");
console.log(
  ["size", "accepted", "failed", "http_p95_ms", "http_rps", "persist_ms", "persist_ok"].join("\t"),
);
for (const step of steps) {
  console.log(
    [
      step.size,
      step.http.accepted,
      step.http.failed,
      step.http.latencyMs.p95.toFixed(1),
      step.http.throughputRps.toFixed(1),
      step.persist.queueProcessingMs.toFixed(0),
      step.persist.allAcceptedPersisted ? "yes" : "no",
    ].join("\t"),
  );
}
console.log(`report: ${file}`);

if (failed) {
  console.error("One or more volume steps failed to persist every accepted submission.");
  process.exit(1);
}
