# Flink hourly submission analytics

Phase 4 job. Source: Redis Stream `submission-events` (Phase 2). No Kafka.

## One-time tools (already on D:)

- JDK 17: `D:\dev-tools\jdk`
- Maven: `D:\dev-tools\maven`
- Checkpoints: `D:\dev-tools\flink-checkpoints`

## Start Redis (required source)

```powershell
$redis = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\taizod1024.redis-windows-fork_Microsoft.Winget.Source_8wekyb3d8bbwe\Redis-8.10.1-Windows-x64-msys2\redis-server.exe"
& $redis --appendonly yes --dir "D:\dev-tools\redis-data"
```

## Compile

```powershell
$env:JAVA_HOME = "D:\dev-tools\jdk"
$env:TEMP = "D:\tmp"
$env:TMP = "D:\tmp"
cd flink-job
D:\dev-tools\maven\bin\mvn.cmd -Dmaven.repo.local=D:\dev-tools\m2 -q package
```

## Run

From repo root, with the same `.env` `DATABASE_URL` / `REDIS_URL` as the API:

```powershell
.\flink-job\run-local.ps1
```

Web UI: http://localhost:8081
