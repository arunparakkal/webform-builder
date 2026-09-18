# Flink Architecture — Live Hourly Submission Analytics

This document describes the completed Apache Flink pipeline for **live counts and stats per form, per hour**, updating continuously as submissions stream in at high volume.

No Kafka. Submissions remain the product’s source of truth in PostgreSQL; Flink derives analytics.

---

## End-to-end architecture

```
User
  ↓
Fastify API
  ↓
Submission processing
  ↓
PostgreSQL
  ↓
Incremental submission poller
  ↓
Apache Flink
  ↓
Keyed state
  ↓
One-hour tumbling windows
  ↓
Hourly aggregation
  ↓
PostgreSQL analytics table
  ↓
Fastify analytics API
  ↓
React dashboard
```

---

## Checkpoint / crash recovery

```
Flink
  ↓
Checkpoint
  ↓
Durable checkpoint storage
  ↓
Crash
  ↓
Restore checkpoint
  ↓
Continue processing
```

---

## Components

| Component | Role |
|---|---|
| **User** | Submits a published form. |
| **Fastify API** | Validates, rate-limits, accepts the submission. |
| **Submission processing** | Async persist path so HTTP stays fast under burst. |
| **PostgreSQL** | Stores each submission row (source of truth). |
| **Incremental submission poller** | Reads only *new* submission rows and feeds Flink (no Kafka). |
| **Apache Flink** | Event-time stream processor. |
| **Keyed state** | Per-`formId` running totals inside Flink. |
| **One-hour tumbling windows** | Non-overlapping hour buckets. |
| **Hourly aggregation** | Count per `(formId, hour)`. |
| **PostgreSQL analytics table** | Pre-aggregated rows for cheap dashboard reads. |
| **Fastify analytics API** | Serves hourly / keyed stats to the UI. |
| **React dashboard** | Shows lines like `form_A + 10:00 → 250 submissions`. |

---

## Design rules

1. **Ingest is independent of Flink.** Analytics lag must not block accepting submissions.
2. **Event time** (`submittedAt`) assigns the hour bucket, not wall-clock processing time.
3. **Keyed by `formId`** so forms never share counters.
4. **Checkpoints** recover Flink state after a crash; raw rows in PostgreSQL can be polled again.
5. **Analytics writes are idempotent** upserts on `(formId, windowStart)` so replays do not invent duplicate hours.

---

## Related doc

How volume, running totals, hour buckets, and mid-stream crashes are handled: [FLINK_VOLUME_HANDLING.md](./FLINK_VOLUME_HANDLING.md).
