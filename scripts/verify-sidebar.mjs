import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.EXPO_BUYER_TEST_URL || 'http://localhost:8081';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
await mkdir('outputs', { recursive: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/discover`);
  await expect(page.getByLabel('Search properties')).toBeVisible({ timeout: 60000 });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const menu = page.getByRole('button', { name: 'Open buyer navigation', exact: true });
    if (width < 1000) {
      await expect(menu).toBeVisible();
      await menu.click();
    } else {
      await expect(menu).toHaveCount(0);
    }
    await expect(page.getByRole('button', { name: 'Buyer Discover', exact: true })).toHaveAttribute('aria-pressed', 'true');
    for (const [label, path] of [['Saved', 'saved'], ['Compare', 'compare'], ['Drafts', 'drafts'], ['Discover', 'discover']]) {
      await page.getByRole('button', { name: `Buyer ${label}`, exact: true }).click();
      await expect(page).toHaveURL(`${base}/${path}`);
      if (width < 1000) {
        await expect(page.getByRole('button', { name: 'Close buyer navigation', exact: true })).toHaveCount(0);
        await menu.click();
      }
      await expect(page.getByRole('button', { name: `Buyer ${label}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    }
    await expect(page.getByRole('tab', { name: /Discover/ })).toHaveCount(0);
    await page.screenshot({ path: `outputs/buyer-sidebar-${width}.png`, animations: 'disabled' });
    if (width < 1000) {
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Close buyer navigation', exact: true })).toHaveCount(0);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const cards = await page.getByRole('button', { name: /^View / }).all();
    for (const card of cards) {
      const box = await card.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width, 'Property grid overflows beside navigation');
    }
    console.log(`PASS sidebar ${width}px`);
  }
  await page.getByRole('button', { name: 'Save A fresh start in Thullur', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Buyer Saved', exact: true })).toContainText('1');
  await page.getByRole('button', { name: 'View A fresh start in Thullur', exact: true }).click();
  await expect(page.getByLabel('Your questions')).toBeVisible();
  await page.getByRole('button', { name: 'Buyer Saved', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unsave A fresh start in Thullur', exact: true })).toBeVisible();
  assert.deepEqual(errors, []);
  console.log('PASS sidebar routes, mobile dismiss, desktop layout, badges and property details.');
} finally {
  await browser.close();
}
