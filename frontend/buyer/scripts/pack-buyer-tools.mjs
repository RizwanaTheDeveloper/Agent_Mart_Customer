import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../src/buyer-tools/vendor/', import.meta.url);
const script = await readFile(new URL('app.js.txt', root), 'utf8');
const locales = await readFile(new URL('locales.js.txt', root), 'utf8');
const css = await readFile(new URL('styles.css', root), 'utf8');
await writeFile(new URL('assets.json', root), JSON.stringify({ script, locales, css }));
console.log('Packed the audited Buyer APK assets. Adaptations live in buyer-tools/document.ts.');
