# Redis (without Docker)

This project uses Redis for published-form cache, per-form rate limiting, and BullMQ.

## Option used on this machine

**Redis for Windows** (winget), not Docker:

```powershell
winget install -e --id taizod1024.redis-windows-fork
```

Start Redis (keep this window open, or run in background):

```powershell
mkdir $env:TEMP\webform-redis -Force | Out-Null
redis-server --appendonly yes --dir "$env:TEMP\webform-redis"
```

In `.env`:

```env
REDIS_URL="redis://localhost:6379"
```

Verify:

```powershell
redis-cli ping
```

Expected: `PONG`

## Alternatives

- Docker Compose: `docker compose up -d redis` (see [DOCKER.md](./DOCKER.md))
- Hosted Redis (Upstash, Redis Cloud): put the TLS URL in `REDIS_URL`
