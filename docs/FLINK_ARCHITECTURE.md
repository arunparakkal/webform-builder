# Flink Architecture — Live Hourly Submission Analytics

This document describes the **implemented** Apache Flink 1.19 pipeline for live counts per form, per hour.

No Kafka. Submissions remain the product’s source of truth in PostgreSQL. Flink derives analytics from Redis Stream `submission-events` after persist. Flink does **not** poll `form_submissions`.

How volume, windows, and crashes are handled: [FLINK_VOLUME_HANDLING.md](./FLINK_VOLUME_HANDLING.md).

---

## End-to-end architecture

```
User
  ↓
Fastify API                         ← HTTP 202
  ↓
BullMQ worker
  ↓
PostgreSQL form_submissions         ← product log (Flink does not read this)
  ↓
Redis Stream submission-events      ← Flink source
  ↓
Apache Flink 1.19
  keyBy(formId)
  one-hour event-time tumbling windows
  keyed window counts + submissionId dedup
  ↓
PostgreSQL form_hourly_stats        ← UPSERT SET
  ↓
GET /api/forms/:formId/analytics/hourly
  ↓
React dashboard (15s poll)
```

---

## Checkpoint / crash recovery

```
Flink (embedded local java -jar)
  ↓
Checkpoint every 10s
  (window counts, Redis lastId, dedup)
  ↓
Local directory (FLINK_CHECKPOINT_DIR)
  ↓
Crash
  ↓
LatestCheckpoint → execution.savepoint.path
  ↓
XREAD from restored lastId
```

A new process does not restore unless that savepoint path is set. `FLINK_RESTORE=skip` starts empty.

---

## Components

| Component | Role |
|---|---|
| **User** | Submits a published form. |
| **Fastify API** | Validates, rate-limits, enqueues, returns 202. Does not wait on Flink. |
| **BullMQ worker** | Inserts `form_submissions`, then `XADD`s `{submissionId, formId, submittedAt}`. |
| **PostgreSQL submissions** | Product source of truth. Not a Flink source. |
| **Redis Stream `submission-events`** | Buffer Flink reads (`XREAD`, `MAXLEN ~ 2e6`). No Kafka. |
| **Apache Flink** | Event-time stream job, parallelism 1. |
| **Keyed state** | Per-`formId` hour accumulators; per-`submissionId` dedup (2h TTL). |
| **One-hour tumbling windows** | UTC, event time (`submittedAt`). Allowed lateness 5 minutes. |
| **JDBC sink** | Idempotent `SET` upsert on `(form_id, window_start)`. At-least-once, not XA. |
| **Fastify analytics API** | `GET /api/forms/:formId/analytics/hourly` reads `form_hourly_stats` only. |
| **React dashboard** | Hourly ranges + counts; loading / empty / error; periodic refresh. |

---

## Design rules

1. **Ingest is independent of Flink.** Analytics lag must not block accepting submissions.
2. **Event time** (`submittedAt`) assigns the hour bucket, not wall-clock processing time.
3. **Keyed by `formId`** so forms never share counters.
4. **Checkpoints** recover Flink state and the Redis stream offset. Postgres rows are **not** re-polled into Flink.
5. **Analytics writes are idempotent** absolute upserts on `(formId, windowStart)` so replays overwrite the same hour.

**Reliability line:** at-least-once processing plus idempotent SET. Do not call this end-to-end exactly-once.

---

## Related doc

Interview-style volume, totals, hour buckets, and crash recovery: [FLINK_VOLUME_HANDLING.md](./FLINK_VOLUME_HANDLING.md).
