import { expect, test } from '@playwright/test';

test('navigation and dashboard work with the upgraded Expo Router', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  // Exercise the migrated header context and asynchronous route loading.
  await page.goto('/responsive-preview');
  await expect(page.getByText('AgentMart layout preview', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open buyer navigation', exact: true }).click();
  const frame = page.frameLocator('iframe');
  await expect(frame.getByRole('heading', { name: 'A clearer view, Ananya.', exact: true })).toBeVisible();
  await frame.locator('nav').getByRole('button', { name: 'Explore', exact: true }).click();
  await expect(frame.getByRole('textbox', { name: 'Search properties', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
