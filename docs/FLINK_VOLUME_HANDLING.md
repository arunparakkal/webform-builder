# Flink Volume Handling — Live Per-Form, Per-Hour Aggregation

**Assessment task answered here:**

> Imagine your submissions need to be aggregated live — counts and stats per form, per hour, updating continuously as submissions stream in, at very high volume. How would you process that stream? What maintains the running totals, how do you bucket by hour, and what happens if your processor crashes mid-stream?

This document matches the **implemented** Flink 1.19 job, Redis Stream source, JDBC sink, and dashboard API. Automated checks: API **22** tests passed, web **20** tests passed (including persist-does-not-write-hourly-stats, `GET /api/forms/:formId/analytics/hourly`, and dashboard loading / empty / error).

Architecture overview: [FLINK_ARCHITECTURE.md](./FLINK_ARCHITECTURE.md).

---

## 1. How do you process that stream?

Treat each stored submission as an event. Do **not** re-scan the entire submissions table on every dashboard refresh.

There is **no Postgres poller**. After persist, the worker `XADD`s to Redis Stream `submission-events`. Flink `XREAD`s that stream.

```
User
  ↓
Fastify API                         ← validate & accept (HTTP 202)
  ↓
BullMQ worker                       ← persist, then emit
  ↓
PostgreSQL (form_submissions)       ← product source of truth
  ↓
Redis Stream submission-events      ← Flink source (no Kafka)
  ↓
Apache Flink
  keyBy(formId)
  → one-hour tumbling windows (event time)
  → running count in keyed state
  ↓
PostgreSQL form_hourly_stats        ← UPSERT SET (formId, hour) → count
  ↓
GET /api/forms/:formId/analytics/hourly → React dashboard
```

`form_submissions` is the durable product log. Flink does **not** read it. If Redis trims or loses unread entries, those events are not rebuilt from Postgres.

**High volume:** HTTP and persist stay on the product path. Flink trails on the stream. If submit rate exceeds Flink, the backlog sits in Redis (until `MAXLEN ~ 2_000_000`). Accepting submissions does not wait on analytics.

**Parallelism:** this local job sets `env.setParallelism(1)` (Redis source is also 1). Different `formId`s are separate keys in state, not separate parallel tasks. The JDBC sink batch size is 1.

---

## 2. What maintains the running totals?

**Flink keyed state**, keyed by `formId`, holds the live accumulator for each open hour window.

Conceptually:

```
state[form_A][10:00–11:00] = 250
state[form_A][11:00–12:00] = 180
state[form_B][10:00–11:00] = 120
```

That is the same idea as:

```
form_A + 10:00 → 250 submissions
form_A + 11:00 → 180 submissions
form_B + 10:00 → 120 submissions
```

Flink updates the count on each event (`count = count + 1`). `EmitOnElementTrigger` emits the running total on every submission so the current hour can show up before the window closes.

Those emissions are written to **`form_hourly_stats`**. The dashboard reads that table — a small set of hour rows — instead of `COUNT(*)` over every raw submission.

Dedup is a second keyed state: “seen” per `submissionId` (2 hour TTL) so BullMQ retries that re-`XADD` the same id are not counted twice.

The React hub label “keyed state” is a **Postgres read** of that analytics table, not Flink operator state.

---

## 3. How do you bucket by hour?

**One-hour tumbling windows on event time** (`submittedAt` = Postgres `created_at`, UTC):

```
windowStart = floor_to_hour(submittedAt)
windowEnd   = windowStart + 1 hour
```

Example:

| submittedAt | Window |
|---|---|
| 10:05 | 10:00–11:00 |
| 10:20 | 10:00–11:00 |
| 10:45 | 10:00–11:00 |
| 11:10 | 11:00–12:00 |

Concrete Form A story:

```
10:05 → 1
10:20 → 2
10:45 → 3

10:00–11:00 = 3 submissions

11:10 → new hourly window (starts at 1)
```

**Why event time?** If the worker or Flink is late, a submission that happened at 10:25 still belongs to **10:00–11:00**, not “whatever hour the processor woke up.”

Watermarks: 30s bounded out-of-orderness plus 1 minute idleness. **Allowed lateness is 5 minutes**; later events are dropped (no late side output).

Forms stay separate because of `keyBy(formId)`.

---

## 4. What happens if the processor crashes mid-stream?

```
Redis Stream events
      ↓
Flink
      ↓
State (window counts + stream lastId + dedup)
      ↓
Checkpoint → local checkpoint directory
      ↓
CRASH
      ↓
Restore latest checkpoint as savepoint
      ↓
XREAD from checkpointed lastId
      ↓
Continue aggregation
      ↓
PostgreSQL form_hourly_stats (idempotent SET upsert)
```

| Piece | Role after crash |
|---|---|
| **Checkpoint** | Restores keyed window counts, dedup “seen” flags, and Redis `lastId` |
| **Redis Stream** | Unread entries after `lastId` are replayed. Trimmed entries are gone. |
| **PostgreSQL submissions** | Still hold every accepted row for the product inbox. Flink does not re-read them. |
| **Idempotent sink** | `ON CONFLICT (form_id, window_start) DO UPDATE` with **absolute** `SET` counts — replays overwrite the same PK; they do not `+=` |

**Practical reliability model:** at-least-once processing into Flink, with an idempotent analytics upsert so the same hour row is overwritten. This is **not** end-to-end exactly-once: `CheckpointingMode.EXACTLY_ONCE` aligns Flink operator snapshots; `JdbcSink` is not XA.

This job is a local `java -jar` (embedded Flink). A new process restores only if `LatestCheckpoint` finds `_metadata` and sets `execution.savepoint.path`. `FLINK_RESTORE=skip` starts empty. Default dir: `file:///D:/dev-tools/flink-checkpoints` (override `FLINK_CHECKPOINT_DIR`). Interval: 10 seconds. State backend: `HashMapStateBackend` (heap).

While Flink is down, users can still submit (product path). The chart may look stale until Flink restores and catches up on Redis.

---

## 5. Short interview answer (60 seconds)

> We don’t aggregate by scanning every submission on each request. Fastify accepts the POST, a worker writes the row, then XADDs `{submissionId, formId, submittedAt}` to a Redis Stream — no Kafka. Flink reads that stream, keys by `formId`, assigns one-hour UTC tumbling windows using event time, and keeps running totals in keyed state. Those totals upsert into `form_hourly_stats`. React polls `GET /api/forms/:formId/analytics/hourly`. Ingest stays async so Flink lag doesn’t block submits. If Flink crashes, we restore the last checkpoint, continue from the stream `lastId`, and rely on absolute upserts so replays overwrite the same hour. We call that at-least-once plus idempotent SET, not exactly-once.

---

## 6. What we built for this task

| Requirement | Solution |
|---|---|
| Process the stream | Persist → Redis Stream `submission-events` → Flink `XREAD` |
| Running totals | Keyed state per `formId` + hour window; emit on each element |
| Bucket by hour | Event-time one-hour tumbling windows (UTC) |
| High volume | Async ingest (HTTP 202); pre-aggregated dashboard reads |
| Crash mid-stream | Checkpoints + restore `lastId` + idempotent SET upserts |
| Dashboard shape | `{ formId, data: [{ windowStart, windowEnd, submissionCount }] }` |
| Tests | API 22 passed; web 20 passed |

---

## 7. What this architecture does not claim

- No Kafka, and Redis is not Kafka-equivalent (trim, single-node / AOF durability, one consumer).
- Parallelism is 1 in this local job.
- Dedup TTL is 2 hours; a retry after expiry could increment the same window again.
- Events later than watermark + 5 minutes are dropped.
- Postgres cannot backfill Flink if the stream was trimmed before `XREAD`.
