import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const [command, ...args] = process.argv.slice(2);
if (!['generate', 'validate', 'format'].includes(command)) throw Error('Use this wrapper only for generate, validate or format.');
const root = fileURLToPath(new URL('../', import.meta.url));
// Windows keeps the engine DLL locked while a dev server is running. Reuse a
// verified, already-current client instead of replacing the identical binary.
if (command === 'generate' && args.length === 0 && process.platform === 'win32') {
  const generated = new URL('../node_modules/.prisma/client/', import.meta.url);
  const required = ['schema.prisma', 'package.json', 'index.js', 'index.d.ts', 'query_engine-windows.dll.node'];
  if (required.every(file => existsSync(new URL(file, generated)))) {
    const sourceSchema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
    const generatedSchema = readFileSync(new URL('schema.prisma', generated), 'utf8');
    const generatedVersion = JSON.parse(readFileSync(new URL('package.json', generated), 'utf8')).version;
    const installedVersion = JSON.parse(readFileSync(new URL('../node_modules/@prisma/client/package.json', import.meta.url), 'utf8')).version;
    if (sourceSchema === generatedSchema && generatedVersion === installedVersion) {
      console.log('Prisma Client is already current.');
      process.exit(0);
    }
  }
}
const envFile = new URL('../.env', import.meta.url);
const env = { ...(existsSync(envFile) ? parseEnv(readFileSync(envFile, 'utf8')) : {}), ...process.env };
// These commands inspect schema only; the placeholder is never used by the server.
if (!env.DATABASE_URL?.trim()) {
  env.DATABASE_URL = 'postgresql://schema_validation_only@127.0.0.1:5432/agentmart';
}
const result = spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/prisma/build/index.js', import.meta.url)), command, ...args], { cwd: root, env, stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
