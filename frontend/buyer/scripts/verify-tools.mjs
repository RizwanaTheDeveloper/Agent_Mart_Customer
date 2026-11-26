import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.env.EXPO_BUYER_TEST_URL || 'http://localhost:8083';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  await page.goto(`${base}/tools`);
  const f = page.frameLocator('iframe');
  await expect(f.locator('#toolsMode')).toHaveText('Sample workspace · changes stay on this device');
  await expect(f.locator('#app')).toContainText('Property listings');
  const frame = page.frames().find(frame => frame !== page.mainFrame());
  assert.equal(await frame.evaluate(() => Market.demo), true);
  for (const route of ['map', 'legal', 'crda', 'plotAI', 'development', 'investment', 'marketSaved', 'marketCompare', 'marketRequests', 'marketAccount', 'marketSecurity', 'firmSettings', 'about', 'home']) {
    await f.locator('#toolsMenu summary').click();
    await f.locator(`[data-route="${route}"]`).click();
    await expect(f.locator('#app')).not.toBeEmpty();
  }
  await f.locator('#toolsMenu summary').click();
  await f.getByRole('button', { name: 'Restart Buyer demo', exact: true }).click();
  await expect(f.locator('#app')).toContainText('Property listings');
  assert.deepEqual(errors, []);
  console.log('PASS APK Buyer demo, tool navigation and restart.');
} finally {
  await browser.close();
}
