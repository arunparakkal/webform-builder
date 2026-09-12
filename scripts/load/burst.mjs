/**
 * Burst load generator for the public submit path.
 *
 * Usage:
 *   npm run load -- --ownerId=<uuid> --slug=newsletter --concurrency=50 --requests=200
 *
 * Prerequisites: API + worker + Redis running; form published at that ownerId/slug.
 */
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "http://127.0.0.1:3001" },
    ownerId: { type: "string" },
    slug: { type: "string", default: "load-test" },
    concurrency: { type: "string", default: "40" },
    requests: { type: "string", default: "200" },
    emailField: { type: "string", default: "email" },
  },
});

const base = (values.base ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const ownerId = values.ownerId;
const slug = values.slug ?? "load-test";
const concurrency = Number(values.concurrency ?? "40");
const total = Number(values.requests ?? "200");
const emailField = values.emailField ?? "email";

if (!ownerId) {
  console.error("Missing --ownerId (UUID). Run `npm run load:setup` first and copy ownerId.");
  process.exit(1);
}

const path = `/api/public/forms/${encodeURIComponent(ownerId)}/${encodeURIComponent(slug)}`;
const url = `${base}${path}/submissions`;

async function oneRequest(i) {
  const started = performance.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        payload: {
          [emailField]: `burst-${i}-${Date.now()}@example.com`,
        },
        idempotencyKey: `load-${slug}-${i}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      }),
    });
    return { ok: res.status === 202, status: res.status, ms: performance.now() - started };
  } catch {
    return { ok: false, status: 0, ms: performance.now() - started };
  }
}

async function runPool() {
  const results = [];
  let next = 0;

  async function worker() {
    while (next < total) {
      const i = next++;
      results.push(await oneRequest(i));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

const probe = await fetch(`${base}${path}`);
if (!probe.ok) {
  console.error(
    `Form ${ownerId}/${slug} is not published (HTTP ${probe.status}). Publish a form first, then re-run.`,
  );
  process.exit(1);
}

console.log(`Bursting ${total} submits → ${url}`);
console.log(`concurrency=${concurrency}`);

const wallStart = performance.now();
const results = await runPool();
const wallMs = performance.now() - wallStart;

const accepted = results.filter((r) => r.ok).length;
const rejected = results.filter((r) => !r.ok).length;
const byStatus = new Map();
for (const r of results) {
  byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
}
const latencies = results.map((r) => r.ms).sort((a, b) => a - b);
const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
const p99 = latencies[Math.floor(latencies.length * 0.99)] ?? 0;
const rps = (total / wallMs) * 1000;

console.log("---");
console.log(`accepted(202): ${accepted}`);
console.log(`not accepted:  ${rejected}`);
console.log(`status counts: ${[...byStatus.entries()].map(([s, n]) => `${s}:${n}`).join(", ")}`);
console.log(`wall time:     ${wallMs.toFixed(0)} ms`);
console.log(`throughput:    ${rps.toFixed(1)} req/s`);
console.log(`latency p50:   ${p50.toFixed(1)} ms`);
console.log(`latency p95:   ${p95.toFixed(1)} ms`);
console.log(`latency p99:   ${p99.toFixed(1)} ms`);
console.log("---");
console.log(
  "Note: 429s are expected if RATE_LIMIT_PER_MINUTE is hit — that proves per-form rate limiting.",
);

if (accepted === 0) {
  process.exit(2);
}
