/**
 * Worker / queue pause recovery test.
 *
 * Pauses the BullMQ queue (jobs stay in Redis; HTTP can still 202),
 * sends a unique batch, then resumes and asserts every accepted job
 * is persisted in PostgreSQL.
 *
 * Usage:
 *   npm run load:recovery -- --ownerId=<uuid> --slug=<slug>
 *
 * Exit 0 only when accepted === persisted after resume.
 */
import { parseArgs } from "node:util";
import {
  connectPrisma,
  connectQueue,
  countPersisted,
  loadRootEnvFile,
  newRunId,
  printHttpSummary,
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
    concurrency: { type: "string", default: "5" },
    requests: { type: "string", default: "20" },
    emailField: { type: "string", default: "email" },
    timeoutMs: { type: "string", default: "60000" },
  },
});

const base = (values.base ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const ownerId = values.ownerId;
const slug = values.slug;
const concurrency = Number(values.concurrency ?? "5");
const total = Number(values.requests ?? "20");
const emailField = values.emailField ?? "email";
const timeoutMs = Number(values.timeoutMs ?? "60000");

if (!ownerId || !slug) {
  console.error("Missing --ownerId and --slug. Run `npm run load:setup` first.");
  process.exit(1);
}

const probe = await probePublished(base, ownerId, slug);
if (!probe.ok) {
  console.error(`Form ${ownerId}/${slug} is not published (HTTP ${probe.status}).`);
  process.exit(1);
}

const runId = newRunId("rec");
const url = submitUrl(base, ownerId, slug);
const prisma = await connectPrisma();
const { queue, close: closeQueue } = await connectQueue();

let failed = false;
const report = {
  kind: "recovery",
  at: new Date().toISOString(),
  runId,
  ownerId,
  slug,
  assertions: [],
};

function assert(name, ok, detail) {
  report.assertions.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed = true;
}

try {
  console.log(`Recovery runId=${runId}  requests=${total}`);
  await queue.pause();
  await sleep(400);

  const wallStart = performance.now();
  const results = await runPool({ url, total, concurrency, emailField, runId });
  const http = summarizeHttp(results, performance.now() - wallStart);
  printHttpSummary("HTTP while queue paused", http);
  report.http = http;

  assert(
    "at least one submit accepted while queue paused",
    http.accepted > 0,
    `accepted=${http.accepted}`,
  );
  const unexpectedStatuses = Object.keys(http.byStatus).filter(
    (status) => status !== "202" && status !== "429",
  );
  assert(
    "HTTP failures are only rate-limits (429), if any",
    unexpectedStatuses.length === 0,
    `statuses=${JSON.stringify(http.byStatus)}`,
  );

  await sleep(1500);
  const duringPause = await countPersisted(prisma, runId);
  report.persistedDuringPause = duringPause;
  console.log(`persisted while paused (after 1.5s settle): ${duringPause}`);
  if (duringPause > 0) {
    console.log(
      "Some rows appeared during pause (in-flight jobs). The no-loss check still requires all accepted rows after resume.",
    );
  }

  await queue.resume();
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
  };

  console.log("--- after resume ---");
  console.log(`persisted:          ${persist.count} / ${http.accepted} accepted`);
  console.log(`queue+DB drain:     ${persist.drainMs.toFixed(0)} ms`);

  assert(
    "every accepted submission persisted after resume",
    persist.ok && persist.count === http.accepted,
    `persisted=${persist.count} accepted=${http.accepted}`,
  );
} catch (err) {
  failed = true;
  report.error = err instanceof Error ? err.message : String(err);
  console.error(report.error);
  console.error(
    "If Redis is unreachable, pause/resume cannot be automated. See docs/LOAD_TEST_RESULTS.md (manual procedure).",
  );
} finally {
  await queue.resume().catch(() => undefined);
  await closeQueue();
  await prisma.$disconnect().catch(() => undefined);
}

const file = writeReport(`recovery-${runId}`, report);
console.log(`report: ${file}`);

if (failed) {
  console.error("Recovery assertions failed — not claiming zero data loss.");
  process.exit(1);
}

console.log("Recovery assertions passed: accepted count matched persisted rows for this runId.");
