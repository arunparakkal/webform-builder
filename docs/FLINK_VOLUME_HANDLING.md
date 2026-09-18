# Flink Volume Handling — Live Per-Form, Per-Hour Aggregation

**Assessment task answered here:**

> Imagine your submissions need to be aggregated live — counts and stats per form, per hour, updating continuously as submissions stream in, at very high volume. How would you process that stream? What maintains the running totals, how do you bucket by hour, and what happens if your processor crashes mid-stream?

This document is the completed answer for that Flink-based volume handling work.

Architecture overview: [FLINK_ARCHITECTURE.md](./FLINK_ARCHITECTURE.md).

---

## 1. How do you process that stream?

Treat each stored submission as an event. Do **not** re-scan the entire submissions table on every dashboard refresh.

```
User
  ↓
Fastify API                         ← validate & accept (fast)
  ↓
Submission processing               ← async persist
  ↓
PostgreSQL (form_submissions)       ← durable event log
  ↓
Incremental submission poller       ← only new rows → Flink (no Kafka)
  ↓
Apache Flink
  keyBy(formId)
  → one-hour tumbling windows (event time)
  → running count in keyed state
  ↓
PostgreSQL analytics table          ← upsert (formId, hour) → count
  ↓
Fastify analytics API → React dashboard
```

**High volume:** HTTP and persist stay on the product path. Flink trails via the poller. If submit rate exceeds Flink for a while, the backlog sits in PostgreSQL and Flink catches up; accepting submissions does not wait on analytics.

**Parallelism:** Flink tasks process different `formId` keys in parallel. Batching on the poller and on the analytics sink reduces database round trips.

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

Flink updates the count on each event (`count = count + 1`). For a live current hour, a continuous trigger can emit the running total before the hour closes.

Those emissions are written to the **PostgreSQL analytics table**. The dashboard reads that table — a small set of hour rows — instead of `COUNT(*)` over every raw submission.

---

## 3. How do you bucket by hour?

**One-hour tumbling windows on event time** (`submittedAt`):

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

**Why event time?** If the poller or Flink is late, a submission that happened at 10:25 still belongs to **10:00–11:00**, not “whatever hour the processor woke up.”

Forms stay separate because of `keyBy(formId)`.

---

## 4. What happens if the processor crashes mid-stream?

```
Submission events
      ↓
Flink
      ↓
State (keyed counts)
      ↓
Checkpoint → durable checkpoint storage
      ↓
CRASH
      ↓
Restore checkpoint
      ↓
Replay / continue from incremental poller
      ↓
Continue aggregation
      ↓
PostgreSQL analytics table (idempotent upsert)
```

| Piece | Role after crash |
|---|---|
| **Checkpoint** | Restores keyed window counts + poller progress |
| **PostgreSQL submissions** | Still hold every accepted row; poller can read again |
| **Idempotent sink** | `ON CONFLICT (form_id, window_start) DO UPDATE` with absolute counts — replays do not invent extra hour rows |

**Practical reliability model:** at-least-once processing into Flink, with an idempotent analytics upsert so final hourly totals stay correct.

While Flink is down, users can still submit (product path). The chart may look stale until Flink restores and catches up.

---

## 5. Short interview answer (60 seconds)

> We don’t aggregate by scanning every submission on each request. Each accepted submission is stored in PostgreSQL, then an incremental poller feeds new rows into Flink without Kafka. Flink keys by `formId`, assigns one-hour tumbling windows using event time, and keeps running totals in keyed state. Those totals upsert into a small analytics table the dashboard reads. Under high volume, ingest stays async so Flink lag doesn’t block submits. If Flink crashes, we restore the last checkpoint, continue from the poller watermark, and rely on idempotent upserts so replays don’t double-count hours.

---

## 6. What we built for this task

| Requirement | Solution |
|---|---|
| Process the stream | Incremental poller → Flink pipeline |
| Running totals | Keyed state per `formId` + hour window |
| Bucket by hour | Event-time one-hour tumbling windows |
| High volume | Async ingest; Flink parallel keys; pre-aggregated reads |
| Crash mid-stream | Checkpoints + re-poll + idempotent analytics upserts |
| Dashboard shape | `form + hour → count` via analytics API |
