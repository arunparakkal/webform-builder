$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not $PSScriptRoot) { $root = (Get-Location).Path }
if (Test-Path "$PSScriptRoot\pom.xml") { $root = Split-Path -Parent $PSScriptRoot }

$env:JAVA_HOME = "D:\dev-tools\jdk"
$env:TEMP = "D:\tmp"
$env:TMP = "D:\tmp"
$env:FLINK_CHECKPOINT_DIR = if ($env:FLINK_CHECKPOINT_DIR) { $env:FLINK_CHECKPOINT_DIR } else { "file:///D:/dev-tools/flink-checkpoints" }
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $eq = $line.IndexOf("=")
    if ($eq -le 0) { return }
    $key = $line.Substring(0, $eq).Trim()
    $value = $line.Substring($eq + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    if ($key -eq "DATABASE_URL" -or $key -eq "REDIS_URL") {
      Set-Item -Path "Env:$key" -Value $value
    }
  }
}

if (-not $env:REDIS_URL) { $env:REDIS_URL = "redis://localhost:6379" }
if (-not $env:DATABASE_URL) { throw "DATABASE_URL is not set (put it in the repo .env)" }

$jar = Join-Path $PSScriptRoot "target\flink-job-1.0.0.jar"
if (-not (Test-Path $jar)) { throw "Jar not found. Compile first: mvn -Dmaven.repo.local=D:\dev-tools\m2 package" }

Write-Host "Starting Flink job from $jar"
Write-Host "Web UI http://localhost:8081"
& "$env:JAVA_HOME\bin\java.exe" "-Duser.timezone=UTC" -jar $jar
