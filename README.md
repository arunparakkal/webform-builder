# Webform Builder

Multi-tenant form builder: visual editor, immutable publish, public submit under burst, version-safe submissions.

## Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design (primary deliverable)
- [TRADEOFFS.md](./TRADEOFFS.md) — three key decisions
- [docs/DEPLOY.md](./docs/DEPLOY.md) — Vercel + Render production deploy
- [docs/SUPABASE.md](./docs/SUPABASE.md) — Postgres
- [docs/REDIS.md](./docs/REDIS.md) — Redis without Docker
- [docs/DOCKER.md](./docs/DOCKER.md) — optional Docker later
- [docs/GOOGLE_SUPABASE_AUTH.md](./docs/GOOGLE_SUPABASE_AUTH.md) — Google sign-in

## Quick start (local)

### 1. Env

```bash
copy .env.example .env
```

Set:

- `DATABASE_URL` — Supabase Postgres URI (`?sslmode=require`)
- `REDIS_URL` — `redis://localhost:6379` (production Upstash: `rediss://…`)
- `JWT_SECRET` — long random string (required in production)
- Optional AI: `GEMINI_API_KEY` (preferred) and/or `OPENAI_API_KEY` on the **API** host
- Optional: `DEMO_OWNER_EMAIL` / `DEMO_OWNER_PASSWORD` for `npm run seed`
- Optional web: `VITE_PUBLIC_WEB_URL` for embed snippet origins
- Same `DATABASE_URL` in `packages/db/.env`

### 2. Database

```bash
npm install
npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
npx prisma generate --schema packages/db/prisma/schema.prisma
npm run seed
```

### 3. Redis (Windows, no Docker)

```bash
winget install -e --id taizod1024.redis-windows-fork
mkdir %TEMP%\webform-redis
redis-server --appendonly yes --dir "%TEMP%\webform-redis"
```

### 4. Run apps (3 terminals)

```bash
npm run dev:api
npm run dev:worker
npm run dev:web
```

Open **http://localhost:5173** for the marketing landing page.  
**Sign up** at `/signup` or **sign in** at `/signin`, then use **http://localhost:5173/app** (protected).  
**Submissions hub:** `/app/submissions` → pick a form → `/forms/:id/submissions`.  
Public forms stay open at `/f/:ownerId/:slug` (no login).

Demo seed user (after `npm run seed`): `owner@example.com` / `password123` (override via env).

Flow: sign up → create form → add fields → save → publish → share/embed → open `/f/:ownerId/:slug` → submit → view submissions (hub or Inbox from the editor).

## Embedding a published form

1. Create a form, add fields, save the draft, then **Publish**.
2. On the editor, open the **Share and Embed** panel (shown after publish).
3. Copy either:
   - **Public URL** — open `/f/:ownerId/:slug` directly
   - **iframe code** — loads `/f/:ownerId/:slug?embed=true` (compact layout, no app chrome)
   - **JavaScript code** — loads `/embed.js`, which mounts an iframe into your target `div`
4. Paste the snippet into the customer website.
5. Submissions still use the existing public API → Zod validation → Redis/BullMQ → worker → Postgres → inbox.

Optional env: `VITE_PUBLIC_WEB_URL` (defaults to the current browser origin for generated snippets).

`npm run build -w @webform/web` emits `dist/embed.js` next to the app. In local `npm run dev:web`, `/embed.js` is also served from `src/embed.ts`.

## Tests

```bash
npm test
```

- Zod validation from a dynamic definition (including show-if)
- Submission integrity after republish (needs reachable `DATABASE_URL`)
- Embed URL / iframe / JavaScript snippet helpers
- Load-test metric helpers (`npm run load:helpers:test`)

## Load tests (measurements)

With API + Redis + Postgres running (in-API worker is on by default):

```bash
npm run load:setup
npm run load -- --ownerId=OWNER_ID --slug=SLUG --concurrency=20 --requests=50
npm run load:recovery -- --ownerId=OWNER_ID --slug=SLUG
npm run load:volume -- --ownerId=OWNER_ID --slug=SLUG
npm run load:persist-probe
```

Worker **process** crash (not queue pause). Ingest-only API, then the script starts/kills `apps/worker`:

```bash
IN_API_WORKER=false npm run dev:api
npm run load:crash -- --ownerId=OWNER_ID --slug=SLUG
```

- **`load`** — HTTP totals, latency, throughput, then queue/DB drain time for that `runId`
- **`load:recovery`** — pause BullMQ, enqueue, resume, **assert** accepted === persisted (exit 1 if not). This is not a crash.
- **`load:crash`** — enqueue, kill the standalone worker process, restart it, **assert** accepted === persisted
- **`load:volume`** — controlled 50/100/200 steps; records persist time (keep volumes small)
- **`load:persist-probe`** — sequential vs parallel Prisma upsert timings (no HTTP)

Default `RATE_LIMIT_PER_MINUTE=60`; extra requests return **429**. Raise that env **locally** to measure ingest rather than the limiter. Do not run these against production. `SUBMIT_WORKER_CONCURRENCY` (default 4) overlaps Postgres round trips; persist is still far slower than HTTP ingest.

How to interpret output: [docs/LOAD_TEST_RESULTS.md](./docs/LOAD_TEST_RESULTS.md). Fill the result tables only with numbers from a run you actually performed.

## Stack

| Piece | Tech |
|-------|------|
| Web | React + Vite + Tailwind + Zustand |
| API | Fastify + Zod |
| Worker | BullMQ |
| DB | Supabase PostgreSQL + Prisma JSONB |
| Cache / queue / rate limit | Redis |

## Deploy note

Keep the monorepo. Deploy `apps/web` and `apps/api` (+ worker) as separate services; share `packages/*` via workspace install.
