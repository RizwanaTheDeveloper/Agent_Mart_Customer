import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';

// Mock tiles: automated map tests must not load/pan against community OSM servers.
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aI9sAAAAASUVORK5CYII=', 'base64');
const base = process.env.EXPO_BUYER_TEST_URL || 'http://localhost:8083';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let fail = false;
  const requests = [];
  await page.route('https://tile.openstreetmap.org/**', async route => {
    requests.push({ url: route.request().url(), headers: await route.request().allHeaders() });
    await route.fulfill(fail ? { status: 503, body: 'Unavailable' } : { status: 200, contentType: 'image/png', body: pixel, headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public,max-age=604800' } });
  });
  await page.goto(`${base}/tools?view=map`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const f = page.frameLocator('iframe');
  const map = f.locator('#mainmap');
  await expect(map.locator('.mapstatus')).toHaveText('OpenStreetMap • zoom 13');
  assert.ok(requests.length > 0);
  assert.ok(requests.every(request => request.headers.referer === `${base}/`), 'Provider requests require a valid application Referer');
  await expect(map.getByRole('link', { name: '© OpenStreetMap contributors', exact: true })).toBeVisible();
  const image = await map.locator('.maptiles img').first().getAttribute('src');
  assert.ok(image.startsWith('data:image/png;base64,'));
  const frame = page.frames().find(frame => frame !== page.mainFrame());
  const before = requests.length;
  await frame.evaluate(() => drawMap('mainmap'));
  await expect(map.locator('.mapstatus')).toHaveText('OpenStreetMap • zoom 13');
  assert.equal(requests.length, before, 'Repeat renders must reuse session tiles');
  assert.equal(await map.locator('.mapretry').count(), 1);

  fail = true;
  await map.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(map.locator('.mapstatus')).toContainText('Map unavailable');
  await expect(map.getByRole('button', { name: 'Retry map' })).toBeVisible();
  fail = false;
  await map.getByRole('button', { name: 'Retry map' }).click();
  await expect(map.locator('.mapstatus')).toHaveText('OpenStreetMap • zoom 14');
  await expect(map.getByRole('button', { name: 'Retry map' })).toBeHidden();
  assert.equal(await map.locator('.mapretry').count(), 1);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(map.locator('.mapstatus')).toHaveText('OpenStreetMap • zoom 14');
  await expect(map.locator('.mapoverlay button').first()).toBeVisible();
  assert.deepEqual(errors, []);
  console.log('PASS free OSM tile requests, Referer, attribution, pins, cache reuse, failure/retry and resize');
} finally { await browser.close(); }
