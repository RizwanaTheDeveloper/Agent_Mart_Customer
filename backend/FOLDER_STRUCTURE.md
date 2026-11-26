# Backend folder structure

The requested backend directories are available. Previously empty foundation files now contain NestJS and Prisma code; existing Cloudflare business handlers remain in place. Empty candidate directories use .gitkeep so they remain in source control.

```text
backend/
  prisma/
    schema.prisma
    migrations/
    seed.ts
    seeds/
  src/
    main.ts
    app.module.ts
    config/
      app.config.ts
      database.config.ts
      auth.config.ts
      storage.config.ts
      env.validation.ts
    common/
      decorators/ guards/ filters/ interceptors/ middleware/ pipes/
      exceptions/ constants/ interfaces/ dto/ utils/
    prisma/
      prisma.module.ts
      prisma.service.ts
    modules/
      auth/ users/ roles/ permissions/ dashboard/ properties/
      property-images/ property-types/ locations/ buyers/ sellers/
      marketplace/ enquiries/ customers/ site-visits/ saved-properties/
      developments/ firms/ branches/ employees/ documents/ uploads/
      legal/ crda/ investment/ reports/ notifications/ activity-logs/
      settings/ health/
    integrations/
      maps/ gis/ storage/ email/ sms/
  test/
    unit/ integration/ e2e/
  .env.example
  nest-cli.json
  tsconfig.json
  tsconfig.build.json
  eslint.config.js
  Dockerfile
  package.json
```

properties/ also includes dto/, repositories/ and policies/ for the standard feature layout. Controllers, services and repositories are not fabricated for unimplemented features.

## Current implementation versus scaffold

- Existing routes/, db/, lib/, src/types.ts, migrations/, scripts/ and tests/ remain active. Existing package commands and frontend imports are unchanged.
- Buyer registration/sessions, public listings, account state and enquiry delivery currently live in src/routes/buyer.ts.
- Seller workspaces, properties, invitations, permissions, documents and visit workflows currently live in src/routes/workspace.ts, with shared rules under src/lib/.
- Existing GIS research lives in src/routes/research.ts.
- NestJS entry, AppModule, configuration, Prisma module/service, schema, seed, build and lint files are implemented. Health and account authentication modules are registered. Other candidate module folders remain pending business migration.
- PostgreSQL account authentication includes registration, login, refresh rotation and logout; the frontend `/login` screen uses this API. The local Prisma migration is applied. Existing Cloudflare/D1 property APIs have not been replaced and existing identities are not automatically imported.
- .env.example configures the Nest app, and Dockerfile builds its production runtime from repository-root context. Docker execution is unverified. See NEST_SETUP.md.
- The existing integration suite remains tests/buyer-api.test.mjs and continues through npm test. test/integration/auth.test.mjs exercises Nest authentication against isolated PostgreSQL, including browser login; run npm run test:auth.

## Scope

Foundation files and the authentication module are implemented; existing business handlers are retained. The frontend has a separate PostgreSQL account login screen. See AUTHENTICATION.md for startup commands and migration boundaries.
