# Deploy: Vercel (web) + Render (API + worker)

This app is a monorepo. Host the **Vite SPA** on Vercel and the **Fastify API** on Render. Use **Supabase** for Postgres (and Google Auth) and **Upstash** for Redis.

On Render **free** tier, the BullMQ submission consumer runs **inside the API process** (background workers are not available). The separate `apps/worker` package is still useful for local/dev or paid Render plans.

## Architecture

```
Browser → Vercel (apps/web)
            └─ VITE_API_BASE_URL → Render webform-api
                                      ├─ Supabase Postgres
                                      ├─ Upstash Redis (queue + rate limit)
                                      └─ in-process BullMQ worker → Postgres
```

Repo helpers:

- [`vercel.json`](../vercel.json) — web build + SPA rewrites
- [`render.yaml`](../render.yaml) — API web service blueprint (free tier)

## Your checklist

### 1. Upstash Redis

1. Create a free Redis database at [upstash.com](https://upstash.com).
2. Copy the **TLS** URL (`rediss://…`).
3. You will paste it as `REDIS_URL` on both Render services.

### 2. Supabase

1. Confirm `DATABASE_URL` (pooler + `sslmode=require`) still works.
2. Auth → URL configuration: add  
   `https://YOUR_VERCEL_DOMAIN/auth/callback`  
   (keep `http://localhost:5173/auth/callback` for local).
3. Keep Google provider enabled with the same Client ID/secret.

### 3. Push code to GitHub

Commit and push these deploy files, then connect the same repo to Render and Vercel.

### 4. Render (API + worker)

1. Render Dashboard → **New** → **Blueprint** → select this repo (`render.yaml`).
2. Fill secrets when prompted:

| Variable | Required |
|----------|----------|
| `DATABASE_URL` | yes |
| `REDIS_URL` | yes (Upstash `rediss://…`) |
| `JWT_SECRET` | yes (long random) |
| `SUPABASE_URL` | yes |
| `SUPABASE_ANON_KEY` | yes |

3. After deploy, open `https://YOUR_API.onrender.com/health` → `{ "ok": true }`.
4. API logs should also show `submission worker listening (in-api)`.

Migrations run in the API **build** command (`db:migrate:deploy`) because free-tier Render does not support `preDeployCommand`. Free tier also does not support a separate Background Worker — the queue consumer is started with the API.

Free web services sleep when idle; the first request can take ~30–60s.

To reduce cold starts, this repo includes [`.github/workflows/keep-render-awake.yml`](../.github/workflows/keep-render-awake.yml), which pings `/health` every 10 minutes. Enable GitHub Actions on the repo (Actions tab → allow workflows). Optional secret `RENDER_HEALTH_URL` overrides the default `https://webform-api.onrender.com/health`.

### 5. Vercel (frontend)

1. Import the same GitHub repo.
2. Leave root as the monorepo root (uses `vercel.json`).
3. Environment variables (Production):

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `https://webform-api.onrender.com` (no trailing slash) |
| `VITE_PUBLIC_WEB_URL` | `https://your-app.vercel.app` |
| `VITE_SUPABASE_URL` | same as API |
| `VITE_SUPABASE_ANON_KEY` | same as API |

4. Deploy. Confirm `/`, `/app`, `/f/some-slug`, and `/embed.js` load.

### 6. Smoke test

1. Sign up or Google sign-in on the Vercel URL.
2. Create + publish a form.
3. Open the public URL and submit.
4. Check **Submissions** inbox (proves worker + Redis).
5. Paste the script/iframe embed into a local HTML file and submit again.

## Local vs production

| Setting | Local | Production |
|---------|-------|------------|
| `VITE_API_BASE_URL` | unset (Vite proxy) | Render API URL |
| `REDIS_URL` | `redis://localhost:6379` | Upstash `rediss://…` |
| `VITE_PUBLIC_WEB_URL` | optional | Vercel domain |

## Troubleshooting

- **Submit 500 / Connection is closed** — Redis URL wrong or worker/API not using Upstash.
- **Accepted but no inbox rows** — Redis URL wrong, or API not running the in-process worker (check logs for `submission worker listening (in-api)`).
- **CORS / network errors from Vercel** — `VITE_API_BASE_URL` missing or wrong; rebuild after changing `VITE_*` vars.
- **Google callback fails** — production redirect URL not added in Supabase Auth.
