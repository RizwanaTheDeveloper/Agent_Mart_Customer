import { readFile, writeFile } from 'node:fs/promises';
const assets = new URL('../assets/fonts/', import.meta.url);
const files = ['DMSans-Regular.ttf', 'DMSans-SemiBold.ttf', 'DMSans-Bold.ttf', 'Manrope-Bold.ttf', 'Manrope-ExtraBold.ttf'];
const fonts = {};
for (const file of files) fonts[file] = (await readFile(new URL(file, assets))).toString('base64');
await writeFile(new URL('../src/buyer-tools/theme-fonts.json', import.meta.url), JSON.stringify(fonts));
console.log('Packed offline fonts for Buyer tools; licenses are in assets/fonts.');
