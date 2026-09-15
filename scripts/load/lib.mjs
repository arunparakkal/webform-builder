/**
 * Shared helpers for local scalability tests.
 * Reuses the public submit API + BullMQ + Postgres; does not invent metrics.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const QUEUE_NAME = "form-submissions";

export function loadRootEnvFile() {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [resolve(here, "../../.env"), resolve(process.cwd(), ".env")];
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

export function newRunId(prefix = "lt") {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = Math.random().toString(16).slice(2, 8);
  return `${prefix}-${stamp}-${rand}`;
}

export function sleep(ms) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

export function percentile(sortedAsc, p) {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.ceil((p / 100) * sortedAsc.length) - 1));
  return sortedAsc[idx];
}

export function summarizeHttp(results, wallMs) {
  const accepted = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const byStatus = {};
  for (const r of results) {
    const key = String(r.status);
    byStatus[key] = (byStatus[key] ?? 0) + 1;
  }
  const latencies = results.map((r) => r.ms).sort((a, b) => a - b);
  return {
    total: results.length,
    accepted,
    failed,
    byStatus,
    wallMs,
    throughputRps: wallMs > 0 ? (results.length / wallMs) * 1000 : 0,
    latencyMs: {
      min: latencies[0] ?? 0,
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      max: latencies[latencies.length - 1] ?? 0,
    },
  };
}

export function printHttpSummary(label, summary) {
  console.log(`--- ${label} ---`);
  console.log(`total requests:     ${summary.total}`);
  console.log(`accepted (202):     ${summary.accepted}`);
  console.log(`failed (not 202):   ${summary.failed}`);
  console.log(
    `status counts:      ${Object.entries(summary.byStatus)
      .map(([s, n]) => `${s}:${n}`)
      .join(", ")}`,
  );
  console.log(`wall time:          ${summary.wallMs.toFixed(0)} ms`);
  console.log(`HTTP throughput:    ${summary.throughputRps.toFixed(1)} req/s`);
  console.log(
    `HTTP latency:       min ${summary.latencyMs.min.toFixed(1)}  p50 ${summary.latencyMs.p50.toFixed(1)}  p95 ${summary.latencyMs.p95.toFixed(1)}  p99 ${summary.latencyMs.p99.toFixed(1)}  max ${summary.latencyMs.max.toFixed(1)} ms`,
  );
}

export function submitUrl(base, ownerId, slug) {
  return `${base.replace(/\/$/, "")}/api/public/forms/${encodeURIComponent(ownerId)}/${encodeURIComponent(slug)}/submissions`;
}

export function keyPrefix(runId) {
  return `${runId}-`;
}

export async function oneSubmit({ url, emailField, runId, index }) {
  const started = performance.now();
  const idempotencyKey = `${runId}-${String(index).padStart(5, "0")}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        payload: {
          [emailField]: `${runId}-${index}@loadtest.example`,
        },
        idempotencyKey,
      }),
    });
    return {
      ok: res.status === 202,
      status: res.status,
      ms: performance.now() - started,
      idempotencyKey,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      ms: performance.now() - started,
      idempotencyKey,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function runPool({ url, total, concurrency, emailField, runId }) {
  const results = [];
  let next = 0;
  async function worker() {
    while (next < total) {
      const i = next++;
      results.push(await oneSubmit({ url, emailField, runId, index: i }));
    }
  }
  const n = Math.max(1, Math.min(concurrency, total));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

export async function connectPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required to count persisted rows. Use the repo .env (never commit it).",
    );
  }
  const { PrismaClient } = await import("@prisma/client");
  return new PrismaClient();
}

export async function countPersisted(prisma, runId) {
  return prisma.formSubmission.count({
    where: { idempotencyKey: { startsWith: keyPrefix(runId) } },
  });
}

export async function waitUntilPersisted({
  prisma,
  runId,
  expected,
  timeoutMs = 60_000,
  intervalMs = 250,
}) {
  const started = performance.now();
  let count = 0;
  while (performance.now() - started < timeoutMs) {
    count = await countPersisted(prisma, runId);
    if (count >= expected) {
      return { count, drainMs: performance.now() - started, ok: true };
    }
    await sleep(intervalMs);
  }
  return { count, drainMs: performance.now() - started, ok: false };
}

export async function connectQueue() {
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  const { Queue } = await import("bullmq");
  const { Redis } = await import("ioredis");
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    connectTimeout: 4000,
  });
  const queue = new Queue(QUEUE_NAME, { connection });
  return {
    queue,
    async close() {
      await queue.close();
      await connection.quit().catch(() => undefined);
    },
  };
}

export function writeReport(name, data) {
  const here = dirname(fileURLToPath(import.meta.url));
  const dir = resolve(here, "results");
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, `${name}.json`);
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

export async function probePublished(base, ownerId, slug) {
  const res = await fetch(
    `${base.replace(/\/$/, "")}/api/public/forms/${encodeURIComponent(ownerId)}/${encodeURIComponent(slug)}`,
  );
  return res;
}
