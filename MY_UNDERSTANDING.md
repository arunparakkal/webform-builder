# MY_UNDERSTANDING — Webform Builder

Simple notes for me: where we are, what we built, which tech we used, and what is left.

You can paste this whole file into ChatGPT to explain the project.

---

## 1. What this project is

A **multi-tenant webform builder**:

- Design forms visually (fields, validation, show-if rules)
- Save **draft**, then **publish** an immutable version
- Share a **public URL** (`/f/:slug`)
- Collect submissions with **server-side validation**
- View / export submissions
- Survive **traffic bursts** via Redis queue (not writing Postgres on every HTTP request)

This was built for a **technical assessment**: architecture first, then a working slice (not a full production SaaS).

GitHub: https://github.com/arunparakkal/webform-builder

---

## 2. Where I am now

| Step | What | Status |
|------|------|--------|
| 1 | Architecture docs (`ARCHITECTURE.md`, `TRADEOFFS.md`) | Done |
| 2 | Prisma DB schema + migrations (Supabase connected) | Done |
| 3 | Shared Zod form schema + tests | Done |
| 4 | Fastify API + BullMQ worker | Done |
| 5 | React UI (editor, public form, submissions) | Done |
| 6 | Load generator + README polish + tests on live DB | Done |

**Core assessment product path works:** create → publish → public submit → store → inbox.

**Not done (optional):** full Docker one-command for all services, real auth/login, cloud deploy, embed SDK.

---

## 3. Technology we used

| Area | Technology | Role |
|------|------------|------|
| Language | **TypeScript** | Shared types for UI + API |
| Frontend | **React + Vite + Tailwind + Zustand** | Builder UI + public form |
| Backend | **Node.js + Fastify** | REST API |
| Validation | **Zod** (`@webform/form-schema`) | Form JSON + submissions from published revision |
| Database | **Supabase PostgreSQL + Prisma** | Tenants, drafts, immutable versions, submissions (JSONB) |
| Cache / rate limit / queue | **Redis + BullMQ** | Hot path under burst |
| Worker | **apps/worker** | Writes submissions durably |
| Local Redis (no Docker) | **Redis for Windows** (winget) | Because C: disk was too full for Docker Desktop |
| Docs | Markdown | Architecture, tradeoffs, run guides |
| Git | GitHub | Incremental commits |

**Monorepo folders (do not need to split for deploy):**

```text
apps/web          → frontend
apps/api          → backend API
apps/worker       → queue consumer
packages/db       → Prisma
packages/form-schema → Zod + types
scripts/load      → burst load test
```

---

## 4. What we built (features)

### Form building
- Field types: text, email, number, textarea, select, multiselect, radio, checkbox, date
- Required / optional, help text, placeholders, validation rules, options
- Conditional visibility: show field B only if field A = X
- Reorder fields, save draft, preview, publish

### Draft vs publish (important)
- **Draft** lives on `forms.draft_definition` (editable)
- **Publish** creates a new **immutable** row in `form_versions`
- Public page reads **only** the published version
- Editing draft never changes old submissions

### Public serving & submit
- `GET /api/public/forms/:slug` — published JSON
- Public UI at `/f/:slug`
- Client validation + same show-if rules
- Server re-validates with Zod from that revision
- Honeypot field (`website`) + per-form Redis rate limit
- Submit returns **202** after queue accept; worker saves to Postgres

### Submissions
- Paginated inbox (cursor)
- Filter by revision
- CSV export
- Each row stores `form_version_id` so republish cannot rewrite history

### Proof / quality
- Automated tests (dynamic validation + version integrity) — passed against Supabase
- Load generator: `npm run load:setup` then `npm run load`
- Architecture diagram and Built vs Designed in `ARCHITECTURE.md`

---

## 5. How a submission travels (simple)

1. User opens `/f/my-form` and clicks Submit  
2. API loads published definition (Redis cache → Postgres)  
3. Honeypot + rate limit check  
4. Zod validates payload from **that version**  
5. Job goes to BullMQ → API returns **202**  
6. Worker inserts `form_submissions` with `form_version_id`  

If Postgres is slow, jobs retry — we do not drop accepted submits.

---

## 6. How to run locally (today)

```text
1. Redis     → redis-server (Windows)   REDIS_URL=redis://localhost:6379
2. Database  → Supabase                 DATABASE_URL=... in .env
3. API       → npm run dev:api          :3001
4. Worker    → npm run dev:worker
5. Web       → npm run dev:web          http://localhost:5173
```

Create form: open **http://localhost:5173/** → Title + Slug → **Create form** button (on the home page, not in the top nav).

---

## 7. Important docs in this repo

| File | Purpose |
|------|---------|
| **MY_UNDERSTANDING.md** (this file) | My simple overview of everything |
| `ARCHITECTURE.md` | Full design (primary assessment deliverable) |
| `TRADEOFFS.md` | Three key decisions |
| `README.md` | How to run, load test, stack |
| `docs/SUPABASE.md` | Connect Postgres |
| `docs/REDIS.md` | Redis without Docker |
| `docs/DOCKER.md` | Docker later (optional) |

---

## 8. Built vs not built yet

### Built
- Working app slice end-to-end
- Supabase DB + migrations + seed user
- Redis queue/cache/rate limit
- React builder + public form + submissions
- Tests + burst load script
- Architecture & tradeoff writeups
- Git history on GitHub

### Not built (designed / later)
- Real login / Supabase Auth / RLS
- One-command `docker compose up --build` for all apps
- Cloudflare CDN / CAPTCHA
- SQS/Kafka instead of Redis for production queue
- Embed widget for customer websites
- Deploy to Vercel + Railway (optional next step)
- Huge-scale export to S3 / partitioning

---

## 9. What I should say in a review

> We designed for scale with queue-first public ingest, immutable form versions, and Zod validation re-derived from the published definition. The working slice proves create/publish/submit/store with Redis+BullMQ, Supabase Postgres JSONB, and a React builder. Production edge (CDN, auth, SQS) is documented as Designed, not Built.

---

## 10. Optional next steps for me

1. Smoke-test UI thoroughly (create → publish → submit → inbox)  
2. Make “Create form” more obvious in the UI if needed  
3. Deploy frontend and backend on separate platforms (keep monorepo)  
4. Use Upstash Redis in cloud for production  

---

*Last updated for the completed local working slice (steps 1–6).*
