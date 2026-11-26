import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Both migrations are idempotent here so existing local seller data is preserved.
const seller = fileURLToPath(new URL('../../frontend/seller/', import.meta.url));
for (const file of ['scripts/sql/bootstrap-seller.sql', 'migrations/0001_buyer_backend.sql']) {
  const result = spawnSync(process.execPath, ['--import', new URL('../../frontend/seller/scripts/sites-env.mjs', import.meta.url).href, fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url)), 'd1', 'execute', 'DB', '--local', '--config', fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)), '--persist-to', fileURLToPath(new URL('../../frontend/seller/.wrangler/state', import.meta.url)), '--file', fileURLToPath(new URL(file, new URL('../', import.meta.url)))], { cwd: seller, stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) process.exit(result.status || 1);
}
