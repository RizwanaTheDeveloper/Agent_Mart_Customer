import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const base = process.env.EXPO_BUYER_TEST_URL || 'http://localhost:8083';
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/discover`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const content = page.frameLocator('iframe[title="Buyer tools workspace"]');
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    for (const [label, view, expected] of [
      ['Map', 'map', 'Map'],
      ['Legal', 'legal', 'Official search portals'],
      ['CRDA plots', 'crda', 'Imported plot references'],
      ['Buyer tools', 'home', 'Property listings'],
    ]) {
      if (width < 1000) await page.getByRole('button', { name: 'Open buyer navigation', exact: true }).click();
      await page.getByRole('button', { name: `Buyer ${label}`, exact: true }).click();
      await expect(page).toHaveURL(`${base}/tools?view=${view}`);
      await expect(content.locator('#app')).toContainText(expected);
      if (width >= 1000) await expect(page.getByRole('button', { name: `Buyer ${label}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
      else await expect(page.getByRole('button', { name: 'Close buyer navigation', exact: true })).toHaveCount(0);
      const frame = page.frames().find(frame => frame !== page.mainFrame());
      // Navigation must retain the document and its memory-only account session.
      if (view === 'map' && width === 390) await frame.evaluate(() => { window.sessionMarker = 'preserved'; });
      assert.equal(await frame.evaluate(() => window.sessionMarker), 'preserved');
      assert.equal(await frame.evaluate(() => route), view);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    console.log(`PASS direct Map, Legal, CRDA plots and Buyer tools navigation at ${width}px`);
  }
  for (const [view, heading] of [['map', 'Map'], ['legal', 'Official search portals'], ['crda', 'Imported plot references']]) {
    await page.goto(`${base}/tools?view=${view}`, { waitUntil: 'domcontentloaded' });
    await expect(content.locator('#app')).toContainText(heading);
    assert.equal(await page.frames().find(frame => frame !== page.mainFrame()).evaluate(() => route), view);
  }
  assert.deepEqual(errors, []);
  console.log('PASS direct links, correct screens, active menu state and retained tools session');
} finally { await browser.close(); }
