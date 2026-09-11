# Trade-offs

Three decisions that shape this system. Each lists what we chose, what we rejected, and why.

---

## 1. Postgres JSONB vs MongoDB vs a SQL column per field

**Choice:** PostgreSQL with JSONB for form definitions and submission payloads, plus normal columns for ids, ownership, slug, status, revision, and timestamps.

**Rejected: a table or column per field type.**  
Field sets are user-defined and change on every publish. Adding “Phone” cannot mean `ALTER TABLE`. Conditional fields and mixed revisions would not fit a wide, static schema.

**Rejected: MongoDB (or another document DB) as the primary store.**  
Flexible documents look like a natural fit for dynamic forms. The hard problems here are not flexibility — they are **immutable versions**, **foreign keys from submission → exact revision**, **tenant isolation**, and **transactions on publish** (insert version + flip pointer together). Postgres already does those. JSONB is enough flexibility without giving up integrity.

**Cost of the choice:** filtering inside JSONB is weaker than typed columns. We accept that. The inbox and export always start with `WHERE form_id = $1 ORDER BY created_at DESC` on a B-tree index. JSON filters are secondary. At very large scale we would partition that table, not switch database engines.

---

## 2. Queue-first ingest vs writing Postgres on the request

**Choice:** The public submit path validates, then enqueues (BullMQ on Redis). It returns **202 only after the queue accepts**. A worker inserts the row. Retries and a dead-letter queue cover downstream failure.

**Rejected: insert into Postgres inside the HTTP handler, then 201.**  
That is simpler and the row is durable as soon as the client gets success. It fails the brief under the two conditions that matter:

- **Burst:** a spike plus a slow disk or lock waits on Postgres makes every submit wait on the database. The API falls over with the DB.
- **Downstream unavailable:** if Postgres is down, the handler cannot accept work. Accepted-but-not-yet-stored is exactly what a durable queue is for.

**Cost of the choice:** the client sees “accepted,” not “row visible in the inbox,” for a short time. Redis AOF is weaker than SQS. The working slice still uses Redis + BullMQ because it is runnable in one Docker Compose file. Production should replace the buffer with SQS (or Kafka) **without changing the REST contract**. Cache and rate limits can stay on Redis.

We also rejected “enqueue without validating.” Invalid traffic must not fill the queue. Zod runs **before** enqueue, using the published revision (including show-if).

---

## 3. Fastify + React vs a Next.js monolith

**Choice:** React (Vite) for the builder and public renderer. Fastify for the API. Separate processes.

**Rejected: Next.js App Router for UI and public submit.**  
Next.js would ship a builder faster (one app, one deploy). The public submit path is an ingest problem: we need a process we can put behind a load balancer, scale on queue depth, and keep thin (cache, rate limit, validate, enqueue). Coupling that path to a full-stack UI framework hides the split the architecture is trying to prove.

**Rejected: Go (or another systems language) for ingest in this slice.**  
Go is an excellent later extraction for the hot path. Two languages in a 6–8 hour slice would cost a shared form definition and shared Zod/types. TypeScript lets the editor, the public renderer, and the server validate the **same** JSON. The architecture still allows replacing Fastify ingest with a Go or edge worker later; the job payload and `form_version_id` contract would stay.

**Cost of the choice:** two Node processes and a reverse-proxy in Compose, instead of one Next.js server. That is the point: ingest and the builder do not scale the same way.
