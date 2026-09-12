# Webform Builder

Multi-tenant form builder: visual editor, immutable publish, public submit under burst, version-safe submissions.

## Documents

- [MY_UNDERSTANDING.md](./MY_UNDERSTANDING.md) — simple overview of everything we built (good to paste into ChatGPT)
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
- `JWT_SECRET` — long random string (required in production)
- Optional: `DEMO_OWNER_EMAIL` / `DEMO_OWNER_PASSWORD` for `npm run seed`
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
Public forms stay open at `/f/:slug` (no login).

Demo seed user (after `npm run seed`): `owner@example.com` / `password123` (override via env).

Flow: sign up → create form → add fields → save → publish → share/embed → open `/f/:slug` → submit → view submissions.

## Embedding a published form

1. Create a form, add fields, save the draft, then **Publish**.
2. On the editor, open the **Share and Embed** panel (shown after publish).
3. Copy either:
   - **Public URL** — open `/f/:slug` directly
   - **iframe code** — loads `/f/:slug?embed=true` (compact layout, no app chrome)
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
