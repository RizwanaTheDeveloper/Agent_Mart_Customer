const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const frontend = path.resolve(__dirname, '..');
  const origin = process.env.SELLER_TEST_ORIGIN || 'http://127.0.0.1:5173';
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname));
  const { planningRequest } = await import(pathToFileURL(path.join(frontend, 'buyer/src/master-plan/api.ts')).href);
  const code = '13-535-2974-11-C18';
  const data = await planningRequest({ action: 'plot', layer: 'plots', code }, AbortSignal.timeout(20000));
  const ring = data.features[0].geometry.coordinates[0], xs = ring.map(p => p[0]), ys = ring.map(p => p[1]);
  const lat = (Math.min(...ys) + Math.max(...ys)) / 2, lon = (Math.min(...xs) + Math.max(...xs)) / 2;
  const owner = { userId: 'test-owner', name: 'Map test owner', email: 'map-test@example.invalid', role: 'owner', active: 1 };
  const fixture = { demo: true, workspace: { id: 'map-test', name: 'Map test workspace' }, user: owner, members: [owner], records: [] };
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(30000);
    let writes = 0;
    // Test-only browser responses; no account authentication or database changes.
    await page.route('**/api/workspace', route => {
      if (route.request().method() !== 'GET') { writes++; return route.abort(); }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) });
    });
    await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('button', { name: 'Properties', exact: true }).click();
    await page.getByRole('button', { name: 'Add property', exact: true }).first().click();
    await page.getByRole('button', { name: 'Location', exact: true }).click();
    await page.getByLabel('Latitude', { exact: true }).fill(String(lat));
    await page.getByLabel('Longitude', { exact: true }).fill(String(lon));
    await page.getByRole('button', { name: 'Review pin on map', exact: true }).click();
    const frame = page.frameLocator('iframe[title="Interactive CRDA property map"]');
    await expect(frame.locator('.leaflet-container')).toBeVisible({ timeout: 45000 });
    const box = await frame.locator('#map').boundingBox();
    await frame.locator('#map').click({ position: { x: box.width / 2, y: box.height / 2 } });
    await expect(frame.locator('.leaflet-popup-content').last()).toContainText('CRDA plot code: ' + code, { timeout: 30000 });
    await expect(frame.locator('.leaflet-popup-content').last()).toContainText('Plot number');
    const output = path.join(frontend, 'outputs/master-plan'); mkdirSync(output, { recursive: true });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(output, 'seller-map-click.png'), fullPage: true });
    assert.equal(writes, 0);
    console.log('PASS: Seller preview shows the live CRDA code and plot number. No workspace writes.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
