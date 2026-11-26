import { chromium, expect as baseExpect } from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.env.EXPO_BUYER_TEST_URL || 'http://127.0.0.1:8081';
const expect = baseExpect.configure({ timeout: 90000 });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(90000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'commit' });
  await page.getByRole('button', { name: 'View seller / owner demo', exact: true }).click();
  const iframe = page.locator('iframe[title="AgentMart Seller Studio"]');
  await expect(iframe).toBeVisible();
  const demoUrl = await iframe.getAttribute('src');
  assert.equal(new URL(demoUrl).searchParams.get('demo'), '1');
  await expect(page.frameLocator('iframe').getByText('Sample workspace · fictional properties and buyers · read-only', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reload', exact: true }).click();
  await expect(page.frameLocator('iframe').getByText('Sample workspace · fictional properties and buyers · read-only', { exact: true })).toBeVisible();
  await page.goto(`${base}/seller`, { waitUntil: 'commit' });
  await expect(iframe).toBeVisible();
  assert.equal(new URL(await iframe.getAttribute('src')).searchParams.has('demo'), false);
  await expect(page.frameLocator('iframe').getByRole('link', { name: 'Sign in to Seller Studio' })).toBeVisible();
  assert.equal(await page.evaluate(() => Array.from(document.fonts).find(font => font.family === 'ionicons')?.status), 'loaded');
  assert.deepEqual(errors, []);
  console.log('PASS Seller demo, reload, normal sign-in screen and icon font loading.');
} finally {
  await browser.close();
}
