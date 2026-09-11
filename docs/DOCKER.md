# Docker Desktop (Windows)

We use Docker for **Redis** (cache, rate limit, BullMQ). Postgres can stay on Supabase.

## Install

1. Download: https://docs.docker.com/desktop/setup/install/windows-install/
2. Run **Docker Desktop Installer**.
3. Enable **WSL 2** if the installer asks (recommended).
4. Restart the PC if prompted.
5. Open Docker Desktop and wait until it says **Running**.

Or with winget (Admin PowerShell):

```powershell
winget install -e --id Docker.DockerDesktop
```

## Verify

```powershell
docker --version
docker compose version
```

## Start Redis for this project

```powershell
cd C:\Users\aruna\OneDrive\Desktop\webform-builder
docker compose up -d redis
```

Optional: also start local Postgres (only if you are not using Supabase):

```powershell
docker compose up -d postgres redis
```
