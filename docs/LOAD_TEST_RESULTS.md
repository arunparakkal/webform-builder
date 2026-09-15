# Load test results and how to run them

These tests measure the **existing** public submit path:

`POST /api/public/forms/:ownerId/:slug/submissions` → Zod → BullMQ (`form-submissions`) → worker upsert → `form_submissions`.

They do **not** invent performance numbers. Copy numbers into the tables below only from a run you performed. JSON reports are written to `scripts/load/results/` (gitignored).

## Prerequisites

1. API + Redis + Postgres running (`npm run dev:api`; Redis local or `REDIS_URL`).
2. The in-API BullMQ worker is on by default (`submission worker listening (in-api) concurrency=N`). Set `IN_API_WORKER=false` only for the crash test.
3. Seeded owner: `npm run seed` (or `LOAD_EMAIL` / `LOAD_PASSWORD`).
4. Repo `.env` with `DATABASE_URL` and `REDIS_URL` (never commit secrets).
5. A published load-test form:

```bash
npm run load:setup
```

Copy `ownerId` and `slug` from the output.

Default `RATE_LIMIT_PER_MINUTE=60`. If you send more than that in one minute you will see **429**s. That proves the limiter, not ingest/Postgres capacity. For capacity measurements, raise the limit in **local** `.env` and restart the API.

Do not point `--base` at production.

## Commands

### HTTP burst + queue drain

```bash
npm run load -- --ownerId=OWNER_ID --slug=SLUG --concurrency=20 --requests=50
```

Reports:

- total / accepted (202) / failed
- status histogram (including 429)
- wall time and HTTP req/s
- latency min / p50 / p95 / p99 / max
- persisted row count for this `runId` vs accepted
- queue+DB drain time (first wait until all accepted rows exist)

Skip the DB wait with `--waitPersist=false`.

### Queue pause recovery (asserted)

```bash
npm run load:recovery -- --ownerId=OWNER_ID --slug=SLUG
```

What it does:

1. Pauses the BullMQ queue (jobs remain in Redis; HTTP can still return 202).
2. Sends a unique batch (`runId` prefix on `idempotencyKey`).
3. Resumes the queue.
4. **Asserts** `persisted === accepted` for that `runId`.

This is **not** a worker-process crash. Pause/resume never kills the consumer.

Exit **0** only when the assertion passes. Exit **1** means do **not** claim zero data loss.

Default size is 20 requests so it stays under the default rate limit.

### Worker process crash recovery (asserted)

The in-API worker shares the API process, so killing it would also kill HTTP ingest. The crash script therefore requires ingest-only API plus a **standalone** `apps/worker` process:

```bash
# terminal 1 — HTTP only (no in-API consumer)
IN_API_WORKER=false npm run dev:api

# terminal 2
npm run load:crash -- --ownerId=OWNER_ID --slug=SLUG
```

On Windows PowerShell: `$env:IN_API_WORKER="false"; npm run dev:api`

What it does:

1. Enqueues a unique batch through the public submit API (worker is not running).
2. Asserts 0 rows for that `runId` (proves the in-API worker is off).
3. Starts `apps/worker`, then **kills that OS process** (SIGTERM, then SIGKILL if needed). `Queue.pause()` is not used.
4. Starts the worker again.
5. **Asserts** `persisted === accepted` for that `runId`.

Exit **0** only when the assertion passes.

### Controlled DB volume

```bash
npm run load:volume -- --ownerId=OWNER_ID --slug=SLUG
```

Default steps: 50, 100, 200. Persist wait default is 180s per step. Override with `--sizes=50,100` (keep this small).

Each step records HTTP stats, persist time, and whether every accepted job landed in Postgres.

### Persist probe (Prisma only, no HTTP)

```bash
npm run load:persist-probe
```

Times sequential vs parallel `form_submissions` upserts against the same `DATABASE_URL`. Use this to separate “one job at a time” from “Postgres round-trip cost”.

### Helper unit tests (no API)

```bash
npm run load:helpers:test
```

These only check metric helpers. They are also run from `npm test`.

## What each measurement means

| Metric | Meaning |
|---|---|
| accepted (202) | Queue accepted the job. The row may not exist in Postgres yet. |
| failed / 429 | Not enqueued. 429 = rate limit. 400 = validation. 0 = network. |
| HTTP p95 | 95% of *request* times. Does not include worker drain. |
| HTTP req/s | Completes / wall-clock. High 429 rate makes this look like limiter throughput. |
| persisted | Rows in `form_submissions` whose `idempotency_key` starts with this `runId`. |
| queue+DB drain | Time from start of persist-wait until persisted ≥ accepted. Includes worker + Postgres. |
| persist rows/s | `persisted / drain_ms`. Use this to talk about the data layer, not the HTTP p95. |

## Persistence bottleneck (measured)

The worker handler is a single Prisma `upsert` per job. There is no extra lookup round-trip in the job. Prisma uses the default client pool (no custom `connection_limit` in app code).

`npm run load:persist-probe` (n=8 upserts, same remote Postgres as the API, 2026-09-15):

| Mode | wall (ms) | avg upsert (ms) | rows/s |
|---|---|---|---|
| sequential | 5422 | 678 | 1.5 |
| 8-way parallel | 2434 | 1716 | 3.3 |

That matches the **before** worker (BullMQ concurrency 1): ~1.6 persist rows/s. The limiter is **round-trip time to hosted Postgres (~650–680 ms per upsert)**, not Redis and not extra Prisma queries.

Raising BullMQ `SUBMIT_WORKER_CONCURRENCY` from 1 to 4 (in-API and standalone worker) overlapped those RTTs. It does **not** make upserts 4× faster; the pooler still serializes a lot of work. After the change, burst persist was **5.4 rows/s** (see below). Further concurrency was not added: the probe’s 8-way parallel run only reached 3.3 rows/s.

## What the tests prove / do not prove

### Prove (for the `runId` that was measured)

- HTTP ingest can accept a burst of 50 valid submits (202) on this local API without 429s when local rate limits are raised.
- Queue-first ingest is much faster than persist: hundreds of HTTP req/s vs a few persist rows/s.
- Pause/resume: every accepted job for that `runId` was stored after the queue was paused (0 rows during pause) and resumed.
- Process crash: every accepted job for that `runId` was stored after the standalone worker OS process was killed and started again.
- Volume 50 / 100 / 200: every accepted job eventually persisted (after concurrency=4, within the 180s wait).

### Do not prove

- Zero data loss for Redis wipe, Postgres outage, API crash before Redis ACK, or production.
- Pause/resume ≠ process crash. Only `load:crash` kills a worker process.
- Crash recovery is not instant. After a hard kill, BullMQ may wait for the job lock / stalled-job interval (on the order of tens of seconds) before another worker may take the job. The crash run below persisted 0 rows immediately after kill, then 20/20 after restart.
- Capacity of Render, Upstash, or a local Postgres. These numbers are this laptop → local Redis → **remote** Supabase pooler.
- Behaviour at thousands of concurrent tenants, multipart uploads, or AI endpoints.

### Local environment limitations

- API is `127.0.0.1:3001` (`tsx watch`), Redis is local `127.0.0.1:6379`. Postgres is the **dev** `DATABASE_URL` (hosted), not a local Docker Postgres and not production Render.
- `RATE_LIMIT_PER_MINUTE=10000` / `RATE_LIMIT_OWNER_PER_MINUTE=10000` in gitignored `.env` for these runs. Default 60 would mostly return 429.
- One API process, one worker (in-API or standalone). No load balancer.
- Network RTT to Supabase dominates persist. A colocated Postgres would look different.
- Windows process signals: the crash script uses SIGTERM then SIGKILL. Graceful `worker.close()` is intentionally not used.

## Recorded runs (this machine, 2026-09-15)

Local API `http://127.0.0.1:3001`, local Redis `127.0.0.1:6379`, dev `DATABASE_URL`. Form slug `load-mu2lw9nk`.

### Burst

`npm run load -- --ownerId=… --slug=load-mu2lw9nk --concurrency=20 --requests=50`

| When | worker | requests | accepted | failed | HTTP p95 (ms) | HTTP req/s | persisted | drain (ms) | persist rows/s |
|---|---|---|---|---|---|---|---|---|---|
| before | concurrency=1 | 50 | 50 | 0 | 81.1 | 278.9 | 50 | 31901 | ~1.6 |
| after | concurrency=4 | 50 | 50 | 0 | 73.7 | 277.4 | 50 | 9325 | 5.4 |

After runId: `burst-20260915120744-35ef8a`. HTTP min 46.4 / p50 61.6 / p99 74.5 ms. No 429s.

HTTP ingest did not change in a meaningful way. Persist drain improved because overlapping upserts hide some of the ~680 ms RTT.

### Recovery (queue pause — not a crash)

`npm run load:recovery -- --ownerId=… --slug=load-mu2lw9nk`

| When | worker | requests | accepted | persisted during pause | persisted after resume | drain (ms) | PASS/FAIL |
|---|---|---|---|---|---|---|---|
| before | concurrency=1 | 20 | 20 | 0 | 20 | 12783 | PASS |
| after | concurrency=4 | 20 | 20 | 0 | 20 | 3898 | PASS |

After runId: `rec-20260915120802-61d49a`. HTTP p95 34.3 ms.

### Worker crash (standalone process kill)

API started with `IN_API_WORKER=false`. Script started `apps/worker`, killed it, started it again.

`npm run load:crash -- --ownerId=… --slug=load-mu2lw9nk`  
runId `crash-20260915121000-2e8e0f`

| When | accepted | persisted before worker | persisted after kill | persisted after restart | wait after restart (ms) | PASS/FAIL |
|---|---|---|---|---|---|---|
| 2026-09-15 | 20 | 0 | 0 | 20 | 61146 | PASS |

HTTP while worker down: 20/20 accepted, p95 46.5 ms, 185.4 req/s. Exit 0.

The ~61 s wait after restart is consistent with BullMQ holding locks from the killed process until jobs are marked stalled, then re-running the upserts. It is **not** the same as the 3.9 s pause/resume drain.

### Volume

`npm run load:volume -- --ownerId=… --slug=load-mu2lw9nk`

| When | worker | size | accepted | failed | HTTP p95 (ms) | HTTP req/s | persist (ms) | persist rows/s | persist_ok |
|---|---|---|---|---|---|---|---|---|---|
| before | concurrency=1 | 50 | 50 | 0 | 78.4 | 203.7 | 32026 | ~1.6 | yes |
| before | concurrency=1 | 100 | 100 | 0 | 42.4 | 381.3 | 62877 | ~1.6 | yes |
| before | concurrency=1 | 200 | 200 | 0 | 51.2 | — | 90314 (90s cap) | — | **no** at timeout (143/200); recount later **200/200** |
| after | concurrency=4 | 50 | 50 | 0 | 74.6 | 312.0 | 8461 | 5.9 | yes |
| after | concurrency=4 | 100 | 100 | 0 | 72.9 | 447.3 | 16601 | 6.0 | yes |
| after | concurrency=4 | 200 | 200 | 0 | 32.0 | 612.4 | 32116 | 6.2 | yes |

After volume report: `scripts/load/results/volume-1789474159276.json`. Persist wait raised to 180s so a slow drain is recorded as timeout rather than assumed lost.

**Data-layer strain:** HTTP ingest stayed hundreds of req/s (0 failures with local limits raised). Persist is still the bottleneck: ~1.6 rows/s at concurrency 1, ~5–6 rows/s at concurrency 4, both limited by remote Postgres RTT. Volume grows roughly linearly with N. This is not evidence that 200 is a production ceiling; it is evidence that drain time ≈ N / persist_rps on this path.

## Manual crash procedure (if the script cannot spawn a worker)

Use this when `IN_API_WORKER=false` cannot be set, or spawning `apps/worker` fails on the OS.

1. Stop the API (in-API worker dies with it) **after** enqueueing, or run ingest-only API from the start.
2. `npm run load -- ... --waitPersist=false --requests=20` and copy `runId` plus the accepted count.
3. Confirm jobs in Redis (`getJobCounts` on queue `form-submissions`) and 0 (or partial) rows for `idempotency_key LIKE '<runId>-%'`.
4. Start `npm run start -w @webform/worker`.
5. Kill that worker process in Task Manager / `taskkill` (do not `Queue.pause()`).
6. Start the worker again.
7. Count rows for that `runId`. Pass only if count equals HTTP 202s from that run.

Do not treat `npm run load:recovery` as a substitute.

## Isolation

Each run uses a unique `runId` in `idempotencyKey` (`burst-…`, `rec-…`, `crash-…`, `vol50-…`). Counts never scan the whole table. Safe on a shared dev database; still do not use production.
