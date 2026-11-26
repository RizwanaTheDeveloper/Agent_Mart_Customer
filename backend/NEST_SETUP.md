# Implemented NestJS files

The previously empty NestJS, Prisma, configuration and build files now contain executable code. The Nest app has one Express server with configuration validation, secure headers, explicit CORS, request limits, DTO validation, sanitized errors, shutdown hooks, Swagger and database health checks.

## Run on Windows

From `backend/`:

```powershell
# Dependencies and Prisma Client are already installed in this checkout.
# For a fresh checkout, run npm.cmd ci first.
if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
npm.cmd run auth:setup
npm.cmd run start:dev
```

Create `.env` only if it does not already exist; preserve any existing settings. Open:

- `http://localhost:4000/api/v1/health` — process liveness.
- `http://localhost:4000/api/v1/health/ready` — PostgreSQL readiness.
- `http://localhost:4000/api/v1/docs` — Swagger in development.

With no `DATABASE_URL`, development liveness works and readiness returns HTTP 503 with `database: unconfigured`. No database connection or data is fabricated. Production requires `DATABASE_URL`; configured connections must succeed during startup.

## PostgreSQL setup

Edit the ignored `backend/.env` with a real PostgreSQL connection URL, then:

```powershell
npm.cmd run prisma:validate
npm.cmd run prisma:generate
npm.cmd run prisma:deploy
npm.cmd run prisma:seed
npm.cmd run start:dev
```

The checked-in initial migration was generated from the Prisma schema without connecting to a database. `prisma:deploy` applies it to the URL you configure. Use `prisma:migrate -- --name your_change` to create later development migrations. The seed is repeatable and inserts only the five property reference types; it creates no users, passwords or sample business records.

`prisma:validate` and `prisma:generate` can run without a database URL. Their wrapper supplies a process-local placeholder only for nonconnecting schema operations. It is never used by the server, migrations or seed.

The schema covers users, firms, memberships, branches, property types, listings/images, saves/comparisons/drafts, enquiries, visits, documents, sessions and audits. Composite foreign keys preserve firm references for linked branch/property/enquiry records. Database checks enforce positive price and area. Application role/assignment policies and the remaining Nest business endpoints are still to be migrated.

## Existing application compatibility

The running Buyer/Seller application still uses its established Cloudflare/D1 APIs on port 5173. Existing `dev`, `start`, `setup`, `test` and Drizzle commands are retained. The Nest development command is **`start:dev`**; production is **`start:prod`** after `npm.cmd run build`.

The Nest app exposes health and PostgreSQL account authentication endpoints. See [authentication setup](AUTHENTICATION.md) for the frontend login screen and API contract. Existing `routes/`, `db/` and `lib/` continue to serve property workspace functions through the framework host. No SQLite records, platform identities, password hashes or encrypted objects were automatically imported or deleted. Such a migration requires explicit ID/identity mapping and password-format compatibility work.

Authentication includes Argon2id passwords, JWT access tokens, rotating refresh tokens and session revocation. Run `npm.cmd run auth:setup` before first startup to fill missing JWT secrets without overwriting existing configuration. Upload providers and the remaining candidate business modules await implementation.

## Verification

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:nest
npm.cmd test
```

Executed: Prisma Client generation, schema validation, build, strict typecheck, lint, 13 Nest configuration/HTTP tests, 14 existing Worker/D1 API tests and 11 isolated PostgreSQL authentication tests including browser login. The initial migration has been applied to the configured local PostgreSQL schema. Authentication tests use their own temporary PostgreSQL cluster. Docker execution remains unverified.

The Dockerfile builds the Nest app using repository-root context. It excludes the frontend runtime and does not copy `.env`. Supply production environment variables externally and apply migrations as a separate deployment step. Throttling currently uses Nest's per-process memory store; shared multi-instance rate limits require a storage adapter before scaling.
