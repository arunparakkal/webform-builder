# Webform Builder

Multi-tenant form builder: visual editor, immutable publish, public submit under burst, version-safe submissions.

## Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design (primary deliverable)
- [TRADEOFFS.md](./TRADEOFFS.md) — three key decisions
- [docs/SUPABASE.md](./docs/SUPABASE.md) — Postgres
- [docs/REDIS.md](./docs/REDIS.md) — Redis without Docker
- [docs/DOCKER.md](./docs/DOCKER.md) — optional Docker later

## Quick start (local)

### 1. Env

```bash
copy .env.example .env
```

Set:

- `DATABASE_URL` — Supabase Postgres URI (`?sslmode=require`)
- `REDIS_URL` — `redis://localhost:6379`
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

Open **http://localhost:5173**

Flow: create form → add fields → save → publish → open `/f/:slug` → submit → view submissions.

## Tests

```bash
npm test
```

- Zod validation from a dynamic definition (including show-if)
- Submission integrity after republish (needs reachable `DATABASE_URL`)

## Load generator (burst submit)

With API + worker + Redis running:

```bash
npm run load:setup
npm run load -- --slug=YOUR_SLUG --concurrency=40 --requests=200
```

Expect many **202** responses. **429** means per-form rate limiting is working.

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
