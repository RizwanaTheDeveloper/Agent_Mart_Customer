import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.env.EXPO_BUYER_TEST_URL || 'http://localhost:8081';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.getByRole('button', { name: 'View buyer demo', exact: true }).click();
  await expect(page.getByRole('button', { name: /^View / })).toHaveCount(6);
  await expect(page.getByText(/Sample catalogue/)).toBeVisible();
  await page.getByRole('button', { name: 'Save A fresh start in Thullur', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Unsave A fresh start in Thullur', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Compare A fresh start in Thullur', exact: true }).click();
  await page.getByRole('button', { name: 'Buyer Compare', exact: true }).click();
  await expect(page.getByText('A fresh start in Thullur', { exact: true })).toBeVisible();
  await page.goto(`${base}/property/buyer-sample-1`);
  await page.getByLabel('Your questions').fill('Please share the property documents.');
  await page.getByRole('button', { name: 'Save enquiry draft', exact: true }).click();
  await expect(page).toHaveURL(`${base}/drafts`);
  await expect(page.getByText('Please share the property documents.', { exact: true })).toBeVisible();
  assert.deepEqual(errors, []);
  console.log('PASS Buyer preview, saves, comparison and enquiry drafts.');
} finally {
  await browser.close();
}
