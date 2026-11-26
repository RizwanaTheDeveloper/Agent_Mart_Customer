import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.BUYER_TEST_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [], privateRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('/api/workspace')) privateRequests.push(request.url()); });
  assert.equal((await page.goto(base + '/buyer')).status(), 200);
  await page.getByRole('heading', { name: 'Find a place that feels like you.' }).waitFor();
  await expect(page.getByRole('button', { name: 'Save A fresh start in Thullur', exact: true })).toBeEnabled({ timeout: 30000 });
  const cards = page.locator('.buyer-card');
  await expect(cards).toHaveCount(4);
  await page.getByLabel('Search properties').fill('Thullur');
  await expect(cards).toHaveCount(1);
  await page.getByLabel('Search properties').fill('');
  await page.getByLabel('Location', { exact: true }).selectOption('Guntur');
  await expect(cards).toHaveCount(1);
  await page.getByLabel('Maximum price').selectOption('5000000');
  await expect(cards).toHaveCount(1);
  await page.getByLabel('Property type').selectOption('Apartment');
  await page.getByRole('heading', { name: 'No properties match just yet.' }).waitFor();
  await page.getByRole('button', { name: 'Reset filters', exact: true }).first().click();
  await page.getByRole('button', { name: 'Find a rental', exact: true }).click();
  await expect(cards).toHaveCount(2);
  await page.getByRole('button', { name: 'Buy a property', exact: true }).click();
  await page.getByRole('button', { name: 'Save A fresh start in Thullur', exact: true }).click();
  for (const title of ['A fresh start in Thullur', 'Room for your next chapter', 'Space for your big idea', 'A little closer to nature']) {
    await page.getByRole('button', { name: `Compare ${title}`, exact: true }).click();
  }
  await page.getByRole('status').filter({ hasText: 'Compare up to three' }).waitFor();
  await page.getByRole('navigation', { name: 'Buyer navigation' }).getByRole('button', { name: /^Compare/ }).click();
  await expect(page.locator('.buyer-comparison thead th')).toHaveCount(4);
  await page.getByRole('navigation', { name: 'Buyer navigation' }).getByRole('button', { name: /^Saved properties/ }).click();
  await expect(cards).toHaveCount(1);
  await page.getByRole('button', { name: 'A fresh start in Thullur', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await page.getByLabel('Your questions').fill('Which documents should I review before planning a visit?');
  await page.getByRole('button', { name: 'Save enquiry draft', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await page.getByRole('navigation', { name: 'Buyer navigation' }).getByRole('button', { name: /^Saved properties/ }).click();
  await page.getByRole('button', { name: 'Unsave A fresh start in Thullur', exact: true }).waitFor();
  await page.getByRole('navigation', { name: 'Buyer navigation' }).getByRole('button', { name: 'Enquiry drafts', exact: true }).click();
  await page.getByText('Which documents should I review before planning a visit?', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Delete draft for A fresh start in Thullur', exact: true }).click();
  await page.getByRole('heading', { name: 'Make a note for your next move.' }).waitFor();
  await page.getByRole('button', { name: 'Explore properties', exact: true }).click();
  await mkdir('outputs', { recursive: true });
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `Overflow at ${width}`);
    await page.screenshot({ path: `outputs/buyer-${width}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('navigation', { name: 'Buyer navigation' }).getByRole('button', { name: /^Saved properties/ }).click();
  await expect(page.locator('.buyer-scrim')).toHaveCount(0);
  await expect(cards).toHaveCount(1);
  await page.getByRole('button', { name: 'A fresh start in Thullur', exact: true }).click();
  assert.equal(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth), true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  assert.deepEqual(privateRequests, []);
  assert.deepEqual(errors, []);
  console.log('PASS: buyer filters, rentals, shortlist persistence, comparison limit, local enquiry drafts, desktop/tablet/phone layout, mobile navigation, dialog dismissal and no private seller API requests.');
} finally { await browser.close(); }
