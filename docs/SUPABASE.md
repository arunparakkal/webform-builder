# Connect Supabase (Postgres)

Use this before running the API, worker, seed, or DB tests.

## 1. Create a project

1. Go to https://supabase.com and create a project.
2. Wait until the database is ready.

## 2. Copy the connection string

1. Open **Project Settings → Database**.
2. Under **Connection string**, choose **URI**.
3. Prefer **Session** pooler or **Direct** connection for Prisma migrations.
4. Replace the password placeholder with your database password.
5. If the URI has no SSL flag, append `?sslmode=require` (or `&sslmode=require` if query params already exist).

Example shape (do not commit real secrets):

```env
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

## 3. Put it in local env files only

Edit these files on your machine (they are gitignored):

- `.env`
- `packages/db/.env`

Set the same `DATABASE_URL` in both. Keep `REDIS_URL` for later (Docker Redis).

For **Google sign-in**, also see [GOOGLE_SUPABASE_AUTH.md](./GOOGLE_SUPABASE_AUTH.md).

## 4. Apply schema

From the repo root:

```powershell
npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
npx prisma generate --schema packages/db/prisma/schema.prisma
npm run seed
```

In the Supabase **Table Editor** you should see: `users`, `forms`, `form_versions`, `form_submissions`.

## 5. Redis (next)

Submit/cache/rate-limit need Redis. After Docker Desktop is installed:

```powershell
docker compose up -d redis
```

Or set `REDIS_URL` to a hosted Redis (e.g. Upstash).
