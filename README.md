# Webform Builder

Multi-tenant form builder: visual editor, immutable publish, public submit at burst, version-safe submissions.

## Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design (primary deliverable)
- [TRADEOFFS.md](./TRADEOFFS.md) — three key decisions

## Database (step 2)

Postgres stores tenants, mutable drafts, immutable form versions, and submissions (JSONB payloads). Redis is in Compose for the later ingest cache/queue.

```bash
copy .env.example .env
docker compose up -d postgres redis
npm install
npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
npx prisma generate --schema packages/db/prisma/schema.prisma
```

Requires Docker Desktop for local Postgres/Redis. Point `DATABASE_URL` at a Supabase project instead if you are not using Compose.

## Form schema (step 3)

Shared package `@webform/form-schema`: TypeScript types + Zod for form definitions and submissions re-derived from a published revision (including show-if).

```bash
npm install
npm test
```

When the full slice lands, the one command will be:

```bash
docker compose up --build
```
