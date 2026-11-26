import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { parseEnv } from 'node:util';

const path = new URL('../.env', import.meta.url);
let source = readFileSync(existsSync(path) ? path : new URL('../.env.example', import.meta.url), 'utf8');
const values = parseEnv(source);
for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
  if (!values[key]?.trim()) {
    values[key] = randomBytes(48).toString('base64url');
    const pattern = new RegExp(`^\\s*${key}\\s*=.*$`, 'm');
    const line = `${key}=${values[key]}`;
    source = pattern.test(source) ? source.replace(pattern, line) : `${source}\n${line}\n`;
  }
  if (values[key].trim().length < 32) throw Error(`${key} must contain at least 32 characters. Existing values were not overwritten.`);
}
if (values.JWT_ACCESS_SECRET === values.JWT_REFRESH_SECRET) throw Error('JWT signing and refresh secrets must be distinct. Existing values were not overwritten.');
writeFileSync(path, source, { mode: 0o600 });
console.log('Local JWT secrets are configured. DATABASE_URL and existing secrets were preserved.');
