/**
 * Worker *process* crash recovery — not the same as queue.pause().
 *
 * Requires HTTP ingest without an in-API worker:
 *   IN_API_WORKER=false npm run dev:api
 *
 * Then:
 *   npm run load:crash -- --ownerId=... --slug=...
 *
 * The script starts apps/worker, kills that process while jobs are pending,
 * starts it again, and asserts persisted === accepted for the runId.
 */
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  connectPrisma,
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
    timeoutMs: { type: "string", default: "90000" },
  },
});

const base = (values.base ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const ownerId = values.ownerId;
const slug = values.slug;
const concurrency = Number(values.concurrency ?? "5");
const total = Number(values.requests ?? "20");
const emailField = values.emailField ?? "email";
const timeoutMs = Number(values.timeoutMs ?? "90000");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

if (!ownerId || !slug) {
  console.error("Missing --ownerId and --slug. Run `npm run load:setup` first.");
  process.exit(1);
}

const probe = await probePublished(base, ownerId, slug);
if (!probe.ok) {
  console.error(`Form ${ownerId}/${slug} is not published (HTTP ${probe.status}).`);
  process.exit(1);
}

const runId = newRunId("crash");
const url = submitUrl(base, ownerId, slug);
const prisma = await connectPrisma();
const report = {
  kind: "crash",
  at: new Date().toISOString(),
  runId,
  ownerId,
  slug,
  assertions: [],
};
let failed = false;

function assert(name, ok, detail) {
  report.assertions.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed = true;
}

function startStandaloneWorker() {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", resolve(root, "apps/worker/src/index.ts")],
    {
      cwd: root,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  const onData = (buf) => {
    output += buf.toString();
  };
  child.stdout?.on("data", onData);
  child.stderr?.on("data", onData);
  return { child, getOutput: () => output };
}

async function waitForWorkerReady(getOutput, child, ms = 15000) {
  const started = Date.now();
  while (Date.now() - started < ms) {
    if (getOutput().includes("submission worker listening")) return;
    if (child.exitCode != null) {
      throw new Error(`worker exited early (${child.exitCode}): ${getOutput()}`);
    }
    await sleep(100);
  }
  throw new Error(`worker did not become ready. output:\n${getOutput()}`);
}

async function stopWorker(child) {
  if (!child || child.exitCode != null) return;
  child.kill("SIGTERM");
  const started = Date.now();
  while (child.exitCode == null && Date.now() - started < 8000) {
    await sleep(100);
  }
  if (child.exitCode == null && child.pid) {
    try {
      process.kill(child.pid, "SIGKILL");
    } catch {
      /* already gone */
    }
  }
}

let worker = null;
try {
  console.log(`Crash recovery runId=${runId}  requests=${total}`);
  console.log("This kills the standalone worker process. Queue.pause() is not used.");

  const wallStart = performance.now();
  const results = await runPool({ url, total, concurrency, emailField, runId });
  const http = summarizeHttp(results, performance.now() - wallStart);
  printHttpSummary("HTTP with worker down (expected)", http);
  report.http = http;

  assert("at least one submit accepted into Redis", http.accepted > 0, `accepted=${http.accepted}`);
  const unexpected = Object.keys(http.byStatus).filter((s) => s !== "202" && s !== "429");
  assert("no unexpected HTTP statuses", unexpected.length === 0, JSON.stringify(http.byStatus));

  await sleep(2000);
  const beforeWorker = await countPersisted(prisma, runId);
  report.persistedBeforeWorker = beforeWorker;
  assert(
    "no in-API worker stole jobs (rows still 0)",
    beforeWorker === 0,
    `persisted=${beforeWorker}. Set IN_API_WORKER=false and restart the API, then re-run.`,
  );

  if (beforeWorker !== 0) {
    throw new Error("in-API worker is processing jobs; crash test cannot isolate the worker process");
  }

  worker = startStandaloneWorker();
  await waitForWorkerReady(worker.getOutput, worker.child);
  await sleep(400);
  await stopWorker(worker.child);
  worker = null;

  const afterKill = await countPersisted(prisma, runId);
  report.persistedAfterKill = afterKill;
  console.log(`persisted after killing worker: ${afterKill} / ${http.accepted}`);

  worker = startStandaloneWorker();
  await waitForWorkerReady(worker.getOutput, worker.child);
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
  console.log(`persisted after restart: ${persist.count} / ${http.accepted} in ${persist.drainMs.toFixed(0)} ms`);

  assert(
    "every accepted submission persisted after worker crash+restart",
    persist.ok && persist.count === http.accepted,
    `persisted=${persist.count} accepted=${http.accepted}`,
  );
} catch (err) {
  failed = true;
  report.error = err instanceof Error ? err.message : String(err);
  console.error(report.error);
} finally {
  if (worker?.child) await stopWorker(worker.child);
  await prisma.$disconnect().catch(() => undefined);
}

const file = writeReport(`crash-${runId}`, report);
console.log(`report: ${file}`);
if (failed) {
  console.error("Crash recovery assertions failed — not claiming zero data loss.");
  process.exit(1);
}
console.log("Crash recovery assertions passed for this runId.");
