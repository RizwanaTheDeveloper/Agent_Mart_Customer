import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = new URL('../prisma/migrations/20261124000000_initial/', import.meta.url);
const target = new URL('migration.sql', directory);
if (existsSync(target)) throw Error('Initial migration already exists; refusing to overwrite it.');
const result = spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/prisma/build/index.js', import.meta.url)), 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
  cwd: root, encoding: 'utf8', windowsHide: true,
  env: { ...process.env, DATABASE_URL: 'postgresql://schema_validation_only@127.0.0.1:5432/agentmart', NO_COLOR: '1' },
});
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
if (!result.stdout.includes('CREATE TABLE')) throw Error('Prisma did not generate SQL.');
mkdirSync(directory, { recursive: true });
writeFileSync(target, '-- Generated initial PostgreSQL schema. This command does not apply it to a database.\n' + result.stdout + '\n-- Business invariants retained from property validation.\nALTER TABLE "Property" ADD CONSTRAINT "Property_positive_price" CHECK ("price" > 0);\nALTER TABLE "Property" ADD CONSTRAINT "Property_positive_area" CHECK ("area" > 0);\n');
writeFileSync(new URL('../prisma/migrations/migration_lock.toml', import.meta.url), 'provider = "postgresql"\n');
console.log('Generated initial PostgreSQL migration without connecting to a database.');
