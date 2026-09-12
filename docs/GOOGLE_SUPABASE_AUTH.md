# Google sign-in with Supabase Auth

App code is already wired. You only need dashboard + env setup.

## What the app does

1. **Continue with Google** → Supabase OAuth
2. Returns to `http://localhost:5173/auth/callback`
3. API `/api/auth/supabase` verifies the session, creates/finds a Prisma `users` row, returns your app JWT
4. You land on `/app`

Email/password signup/signin still use the existing custom auth (unchanged).

## Checklist (your side)

### A. Supabase URL config

**Authentication → URL Configuration**

- Site URL: `http://localhost:5173`
- Redirect URLs include: `http://localhost:5173/auth/callback`

### B. Enable Google provider

**Authentication → Providers → Google**

1. Enable Google
2. Paste **Client ID** + **Client Secret** from Google Cloud
3. Copy Supabase **Callback URL (for OAuth)** (looks like  
   `https://YOUR_PROJECT.supabase.co/auth/v1/callback`)

### C. Google Cloud Console

OAuth **Web** client:

- Authorized JavaScript origins: `http://localhost:5173`
- Authorized redirect URIs: paste the **Supabase** callback from step B (not localhost)

### D. Env keys

In repo root `.env`:

```env
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

Anon key: **Project Settings → API → anon public**

Replace `PASTE_SUPABASE_ANON_KEY_HERE` if that placeholder is still in `.env`.

### E. Restart

Restart API and Vite after editing `.env`, then test **Continue with Google** on `/signin`.
