import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.env.EXPO_BUYER_TEST_URL || 'http://127.0.0.1:8083';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/account?workspace=buyer&mode=create`);
  await expect(page.getByLabel('Your name', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Buyer account', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Already have an account? Sign in', exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill(`missing-${Date.now()}@example.test`);
  await page.getByLabel('Password', { exact: true }).fill('intentionally-wrong-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.');
  await page.getByRole('button', { name: 'Browse published properties', exact: true }).click();
  await expect(page.getByText('Published properties. Sign in to sync saves and send enquiries.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View demo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'View A fresh start in Thullur', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View A fresh start in Thullur', exact: true }).click();
  await page.getByLabel('Your questions', { exact: true }).fill('A private demo draft');
  await page.getByRole('button', { name: 'Save enquiry draft', exact: true }).click();
  await expect(page.getByText('A private demo draft', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('A private demo draft', { exact: true })).toBeVisible();
  assert.deepEqual(errors, []);
  console.log('Buyer backend UI smoke check passed (mobile viewport, actual local API).');
} finally { await browser.close(); }
