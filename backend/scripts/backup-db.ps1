# Backs up the local Postgres DB (from backend/.env DATABASE_URL) with pg_dump custom format.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\backup-db.ps1 [-Keep 14]
# Restore: pg_restore -h localhost -U postgres -d <db> --clean --if-exists <file.dump>
param([int]$Keep = 14)
$ErrorActionPreference = 'Stop'

$root = Split-Path $PSScriptRoot -Parent
$line = Select-String -Path (Join-Path $root '.env') -Pattern '^DATABASE_URL=' | Select-Object -First 1
if (-not $line) { throw 'DATABASE_URL not found in .env' }
$url = ($line.Line -replace '^DATABASE_URL=', '').Trim('"', "'")

if ($url -notmatch '^postgres(?:ql)?://([^:]+):([^@]*)@([^:/]+)(?::(\d+))?/([^?]+)') { throw 'Cannot parse DATABASE_URL' }
$dbUser = $Matches[1]; $dbPass = [uri]::UnescapeDataString($Matches[2]); $dbHost = $Matches[3]
$dbPort = if ($Matches[4]) { $Matches[4] } else { '5432' }; $dbName = $Matches[5]

$pgDump = (Get-Command pg_dump -ErrorAction SilentlyContinue).Source
if (-not $pgDump) { $pgDump = (Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\pg_dump.exe' | Sort-Object FullName -Descending | Select-Object -First 1).FullName }
if (-not $pgDump) { throw 'pg_dump not found' }

$dir = Join-Path $root 'backups'
New-Item -ItemType Directory -Force $dir | Out-Null
$file = Join-Path $dir ("{0}-{1}.dump" -f $dbName, (Get-Date -Format 'yyyyMMdd-HHmmss'))

$env:PGPASSWORD = $dbPass
try {
  & $pgDump -h $dbHost -p $dbPort -U $dbUser -Fc -f $file $dbName
  if ($LASTEXITCODE -ne 0) { throw "pg_dump failed ($LASTEXITCODE)" }
} finally { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }

Get-ChildItem $dir -Filter "$dbName-*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -Skip $Keep | Remove-Item
Write-Host "Backup OK: $file"
