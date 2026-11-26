$ErrorActionPreference = 'Stop'
$pgBin = Join-Path $env:ProgramFiles 'PostgreSQL\18\bin'
$backendRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$testRoot = [IO.Path]::GetFullPath((Join-Path $backendRoot ('outputs\pgadmin-test-' + [Guid]::NewGuid().ToString('N'))))
if (-not $testRoot.StartsWith((Join-Path $backendRoot 'outputs') + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Test path outside backend outputs.' }
New-Item -ItemType Directory -Path $testRoot | Out-Null
$dataPath = Join-Path $testRoot 'data'
$logPath = Join-Path $testRoot 'postgres.log'
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
$listener.Start()
$testPort = $listener.LocalEndpoint.Port
$listener.Stop()
$started = $false
try {
  & (Join-Path $pgBin 'initdb.exe') -D $dataPath --auth=trust --username=agentmart_test --encoding=UTF8 --locale=C
  if ($LASTEXITCODE -ne 0) { throw 'Temporary PostgreSQL initialization failed.' }
  & (Join-Path $pgBin 'pg_ctl.exe') -D $dataPath -l $logPath -o "-h 127.0.0.1 -p $testPort -c shared_buffers=16MB -c max_connections=10" -w start
  if ($LASTEXITCODE -ne 0) { throw 'Temporary PostgreSQL startup failed.' }
  $started = $true
  $psql = Join-Path $pgBin 'psql.exe'
  $connection = @('--no-password', '--host=127.0.0.1', "--port=$testPort", '--username=agentmart_test', '--set=ON_ERROR_STOP=1')
  & $psql @connection --dbname=postgres --command='CREATE DATABASE agentmart_customer;'
  if ($LASTEXITCODE -ne 0) { throw 'Test database creation failed.' }
  $fixture = Join-Path $testRoot 'fixture.sql'
  [IO.File]::WriteAllText($fixture, 'CREATE TABLE public."User" (id TEXT PRIMARY KEY, email TEXT); INSERT INTO public."User" VALUES (''existing-user'', ''preserve@example.invalid'');')
  & $psql @connection --dbname=agentmart_customer --file=$fixture
  if ($LASTEXITCODE -ne 0) { throw 'Test fixture failed.' }
  & $psql @connection --dbname=agentmart_customer --file (Join-Path $backendRoot 'prisma\pgadmin\create-model-tables.sql')
  if ($LASTEXITCODE -ne 0) { throw 'Schema SQL failed.' }
  $verify = Join-Path $testRoot 'verify.sql'
  [IO.File]::WriteAllText($verify, @'
DO $test$
BEGIN
 IF (SELECT count(*) FROM information_schema.tables WHERE table_schema='agentmart' AND table_type='BASE TABLE') <> 15 THEN RAISE EXCEPTION 'Wrong model count'; END IF;
 IF (SELECT count(*) FROM public."User") <> 1 THEN RAISE EXCEPTION 'Existing public data changed'; END IF;
 IF (SELECT count(*) FROM agentmart."User") <> 0 THEN RAISE EXCEPTION 'Unexpected account data'; END IF;
 IF (SELECT count(*) FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='agentmart' AND c.contype='f') < 20 THEN RAISE EXCEPTION 'Missing foreign keys'; END IF;
END
$test$;
'@)
  & $psql @connection --dbname=agentmart_customer --file=$verify
  if ($LASTEXITCODE -ne 0) { throw 'Schema verification failed.' }
  & $psql @connection --dbname=agentmart_customer --file (Join-Path $backendRoot 'prisma\pgadmin\create-model-tables.sql')
  if ($LASTEXITCODE -eq 0) { throw 'Expected a safe refusal when tables already exist.' }
  & $psql @connection --dbname=agentmart_customer --file=$verify
  if ($LASTEXITCODE -ne 0) { throw 'Existing-data preservation failed after repeat attempt.' }
  Write-Output 'PASS: all 15 model tables, foreign keys, existing public data preserved, and repeat execution safely refused.'
} finally {
  if ($started) {
    & (Join-Path $pgBin 'pg_ctl.exe') -D $dataPath -m fast -w stop
    if ($LASTEXITCODE -ne 0) { Write-Warning "Could not stop the temporary server at $dataPath" }
  }
}
