# Webform Builder

Multi-tenant form builder: visual editor, immutable publish, public submit at burst, version-safe submissions.

## Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design (primary deliverable)
- [TRADEOFFS.md](./TRADEOFFS.md) — three key decisions

## Database (step 2)

Postgres stores tenants, mutable drafts, immutable form versions, and submissions (JSONB payloads).

**Recommended now (no local Postgres required):** connect **Supabase** — see [docs/SUPABASE.md](./docs/SUPABASE.md).

```bash
# 1. Put Supabase URI in .env and packages/db/.env as DATABASE_URL
# 2. Then:
npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
npx prisma generate --schema packages/db/prisma/schema.prisma
npm run seed
```

**Optional later:** Docker Compose for local Postgres + Redis:

```bash
docker compose up -d postgres redis
```


## Form schema (step 3)

Shared package `@webform/form-schema`: TypeScript types + Zod for form definitions and submissions re-derived from a published revision (including show-if).

```bash
npm install
npm test
```

## API + worker (step 4)

Fastify REST API and BullMQ worker.

1. Set `DATABASE_URL` to Supabase Postgres (or local Docker Postgres).
2. Set `REDIS_URL` (local Redis or a Redis host).
3. Apply migrations and seed the demo owner:

```bash
copy .env.example .env
npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
npx prisma generate --schema packages/db/prisma/schema.prisma
npm run seed
npm run dev:api
npm run dev:worker
```

Owner routes use the seeded user by default (`DEMO_OWNER_EMAIL`). Override with header `X-Owner-Id`.

When the full slice lands, the one command will be:

```bash
docker compose up --build
```
