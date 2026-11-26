# Create the model tables in pgAdmin

Prepared target: database agentmart_customer, new schema agentmart. This deliberately preserves the existing public schema and its User records. The script has not been applied to your database until verified execution is reported.

1. In pgAdmin, right-click agentmart_customer and choose Query Tool.
2. Open create-model-tables.sql from this directory.
3. Run the entire file. Do not select only individual statements.
4. Refresh agentmart_customer > Schemas. Expand agentmart > Tables.

The transaction creates all 15 model tables, seven enum types, indexes, foreign keys and positive property price/area checks. If the target schema already contains tables/views, it stops before creating anything. Do not drop existing tables to bypass the check.

To use these tables with Prisma, set backend/.env DATABASE_URL to your real connection URL with ?schema=agentmart. Keep the password in the local ignored file. Since manual SQL does not write Prisma migration history, baseline this exact successful initial migration using the local Prisma CLI:

```powershell
cd backend
npx.cmd prisma migrate resolve --applied 20261124000000_initial
```

Only run that after all 15 tables were successfully created by this script. An alternative for a new empty agentmart schema is npm.cmd run prisma:deploy, which creates both the tables and proper migration history directly; it requires DATABASE_URL first.

All model tables initially contain zero records. The optional npm.cmd run prisma:seed inserts only property reference types. Existing public data is not automatically imported or connected to these new tables.

## Verification

Tested on an isolated temporary PostgreSQL 18 instance: all 15 model tables and foreign keys were created, a pre-existing public.User row was preserved, and repeat application was refused without changing data. The temporary server was stopped. This is not a claim that the script has been applied to your existing database.
