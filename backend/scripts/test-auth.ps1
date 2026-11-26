param([switch]$SkipBrowser)
$ErrorActionPreference = 'Stop'
$pgBin = Join-Path $env:ProgramFiles 'PostgreSQL\18\bin'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$testRoot = [IO.Path]::GetFullPath((Join-Path $root ('outputs\auth-test-' + [Guid]::NewGuid().ToString('N'))))
if (-not $testRoot.StartsWith((Join-Path $root 'outputs') + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid test directory.' }
New-Item -ItemType Directory -Path $testRoot | Out-Null
$dataPath = Join-Path $testRoot 'data'
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
$listener.Start(); $port = $listener.LocalEndpoint.Port; $listener.Stop()
$keys = @('DATABASE_URL','AUTH_TEST_DATABASE_URL','NODE_ENV','JWT_ACCESS_SECRET','JWT_REFRESH_SECRET','AUTH_TEST_BROWSER')
$saved = @{}
foreach ($key in $keys) { $saved[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
$started = $false
Push-Location $root
try {
  & (Join-Path $pgBin 'initdb.exe') -D $dataPath --auth=trust --username=agentmart_test --encoding=UTF8 --locale=C
  if ($LASTEXITCODE -ne 0) { throw 'Could not initialize temporary PostgreSQL.' }
  & (Join-Path $pgBin 'pg_ctl.exe') -D $dataPath -l (Join-Path $testRoot 'postgres.log') -o "-h 127.0.0.1 -p $port -c shared_buffers=16MB -c max_connections=20" -w start
  if ($LASTEXITCODE -ne 0) { throw 'Could not start temporary PostgreSQL.' }
  $started = $true
  & (Join-Path $pgBin 'psql.exe') --no-password --host=127.0.0.1 --port=$port --username=agentmart_test --dbname=postgres --set=ON_ERROR_STOP=1 --command='CREATE DATABASE agentmart_auth_test;'
  if ($LASTEXITCODE -ne 0) { throw 'Could not create isolated authentication database.' }
  $env:DATABASE_URL = "postgresql://agentmart_test@127.0.0.1:$port/agentmart_auth_test?schema=public"
  $env:AUTH_TEST_DATABASE_URL = $env:DATABASE_URL
  $env:NODE_ENV = 'test'
  $env:JWT_ACCESS_SECRET = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
  $env:JWT_REFRESH_SECRET = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
  $env:AUTH_TEST_BROWSER = if ($SkipBrowser) { '0' } else { '1' }
  & node node_modules/prisma/build/index.js migrate deploy
  if ($LASTEXITCODE -ne 0) { throw 'Isolated test migration failed.' }
  & node --test test/integration/auth.test.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Authentication integration checks failed.' }
} finally {
  if ($started -or (Test-Path -LiteralPath (Join-Path $dataPath 'postmaster.pid'))) {
    & (Join-Path $pgBin 'pg_ctl.exe') -D $dataPath -m fast -w stop
    if ($LASTEXITCODE -ne 0) { Write-Warning 'Temporary PostgreSQL shutdown needs attention.' }
  }
  foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $saved[$key], 'Process') }
  Pop-Location
}
