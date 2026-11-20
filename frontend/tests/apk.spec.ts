import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

test('original APK assets retain their recorded hashes', () => {
  const manifest = JSON.parse(readFileSync('assets/apk/manifest.json', 'utf8'));
  for (const [name, hash] of Object.entries(manifest.sha256)) {
    expect(createHash('sha256').update(readFileSync(`assets/apk/${name}`)).digest('hex')).toBe(hash);
  }
});

test('buyer Today dashboard connects to the complete property catalogue', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/dashboard');
  const frame = page.frameLocator('iframe');
  await expect(frame.locator('html')).toHaveAttribute('data-agentmart-ready', 'true');
  await expect(frame.locator('h1')).toContainText('A clearer view, Ananya.');
  await expect(frame.getByRole('heading', { name: 'Your next steps' })).toBeVisible();
  await frame.locator('nav').getByRole('button', { name: 'Explore', exact: true }).click();
  await expect(frame.locator('.classiccard')).toHaveCount(3);
  const reference = await context.newPage();
  await reference.goto('/__apk/index.html');
  await reference.evaluate('startMarketDemo("buyer")');
  await expect(reference.locator('.classiccard')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('filter, save, reload, and open original property details', async ({ page }) => {
  await page.goto('/dashboard');
  const frame = page.frameLocator('iframe');
  await frame.locator('nav').getByRole('button', { name: 'Explore', exact: true }).click();
  await expect(frame.locator('.classiccard')).toHaveCount(3);
  await frame.getByRole('button', { name: 'Flats', exact: true }).click();
  await expect(frame.locator('.classiccard')).toHaveCount(1);
  await expect(frame.locator('.classiccard h3')).toHaveText('Family apartment in Mangalagiri');
  await frame.getByRole('button', { name: 'Save property', exact: true }).click();
  await frame.locator('nav').getByRole('button', { name: 'Shortlist', exact: true }).click();
  await expect(frame.locator('h1')).toHaveText('Saved properties');
  await expect(frame.locator('.classiccard')).toHaveCount(1);
  await page.reload();
  await frame.locator('nav').getByRole('button', { name: 'Shortlist', exact: true }).click();
  await expect(frame.locator('.classiccard')).toHaveCount(1);
  await frame.getByRole('button', { name: 'View details', exact: true }).click();
  await expect(frame.locator('h1')).toHaveText('Family apartment in Mangalagiri');
  await frame.getByRole('tab', { name: 'Evidence', exact: true }).click();
  await expect(frame.getByRole('button', { name: 'In-depth insights', exact: true })).toBeVisible();
});

test('workspace chooser retains both account paths in the new responsive layout', async ({ page, context }) => {
  await page.goto('/');
  const frame = page.frameLocator('iframe');
  await expect(frame.locator('html')).toHaveAttribute('data-agentmart-ready', 'true');
  await expect(frame.locator('.rolewelcome')).toBeVisible();
  await expect(frame.locator('.workspacechoices .rolechoice')).toHaveCount(2);
  await page.setViewportSize({ width: 768, height: 900 });
  const columns = await frame.locator('.workspacechoices').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(1);
  const reference = await context.newPage();
  await reference.goto('/__apk/index.html');
  await expect(reference.locator('.rolewelcome')).toBeVisible();
  await expect(reference.locator('.rolechoice')).toHaveCount(2);
});

test('seller dashboard opens original inventory form and workspace actions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/seller-dashboard');
  const frame = page.frameLocator('iframe');
  await expect(frame.getByText('Workspace actions', { exact: true })).toBeVisible();
  await frame.getByRole('button', { name: 'Team & access', exact: true }).click();
  await expect(frame.locator('h1')).toContainText('Team');
  await page.goto('/seller-dashboard');
  await frame.locator('header').getByRole('button', { name: 'Add property', exact: true }).click();
  await expect(frame.locator('#sellerStudio')).toBeVisible();
  await frame.locator('#parcel-editor-rail').getByRole('button', { name: 'Location', exact: false }).click();
  await expect(frame.getByText('Geotag this property', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('APK workspace selector and language picker are preserved', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/apk$/);
  const frame = page.frameLocator('iframe');
  await expect(frame.getByRole('button', { name: 'Buyer login', exact: true })).toBeVisible();
  await expect(frame.getByRole('button', { name: 'Seller / owner login', exact: true })).toBeVisible();
  await frame.locator('#languageButton43').click();
  await frame.locator('#languageSheet43 button').filter({ hasText: 'తెలుగు' }).click();
  await expect(frame.locator('html')).toHaveAttribute('lang', 'te');
  await frame.locator('#languageButton43').click();
  await frame.locator('#languageSheet43 button').filter({ hasText: 'हिन्दी' }).click();
  await expect(frame.locator('html')).toHaveAttribute('lang', 'hi');
});

for (const width of [320, 390, 768, 1366]) {
  test(`redesigned pages fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/dashboard');
    const frame = page.frameLocator('iframe');
    await expect(frame.locator('html')).toHaveAttribute('data-agentmart-ready', 'true');
    for (const label of ['Today', 'Explore', 'Shortlist', 'Activity', 'Workspace']) {
      await frame.locator('nav').getByRole('button', { name: label, exact: true }).click();
      const overflow = await frame.locator('html').evaluate(el => el.scrollWidth > el.clientWidth + 1);
      expect(overflow, `${label} overflows at ${width}px`).toBe(false);
      if ((width === 390 || width === 1366) && ['Today', 'Explore'].includes(label)) {
        await page.screenshot({ path: `test-results/parcel-${label.toLowerCase()}-${width}.png`, fullPage: true });
      }
    }
    await frame.getByRole('button', { name: 'Legal checklist', exact: false }).click();
    expect(await frame.locator('html').evaluate(el => el.scrollWidth > el.clientWidth + 1)).toBe(false);
  });
}

test('property file tabs retain enquiry forms and support keyboard navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/dashboard');
  const frame = page.frameLocator('iframe');
  await frame.locator('nav').getByRole('button', { name: 'Explore', exact: true }).click();
  await frame.getByRole('button', { name: 'View details', exact: true }).first().click();
  await expect(frame.getByRole('tab', { name: 'Overview', exact: true })).toHaveAttribute('aria-selected', 'true');
  await frame.getByRole('tab', { name: 'Location', exact: true }).click();
  await expect(frame.getByRole('heading', { name: 'Location & surroundings' })).toBeVisible();
  await frame.getByRole('tab', { name: 'Location', exact: true }).press('ArrowRight');
  await expect(frame.getByRole('tab', { name: 'Evidence', exact: true })).toHaveAttribute('aria-selected', 'true');
  await frame.getByRole('tab', { name: 'Activity', exact: true }).click();
  await expect(frame.getByRole('heading', { name: 'Ask the seller' })).toBeVisible();
  expect(await frame.locator('html').evaluate(el => el.scrollWidth > el.clientWidth + 1)).toBe(false);
  await page.screenshot({ path: 'test-results/parcel-property-file-390.png', fullPage: true });
  await frame.locator('input[name="phone"]').fill('9876543210');
  await frame.locator('textarea[name="message"]').fill('Please share the documents and arrange a site visit.');
  await frame.locator('#enquiryConsent').check();
  await frame.getByRole('button', { name: 'I am interested', exact: true }).click();
  await expect(frame.locator('.conversation')).toBeVisible();
  expect(errors).toEqual([]);
});

test('guided seller editor retains fields across steps and saves private inventory', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/seller-dashboard');
  const frame = page.frameLocator('iframe');
  await frame.locator('header').getByRole('button', { name: 'Add property', exact: true }).click();
  const form = frame.locator('#sellerStudio');
  await form.locator('[name="title"]').fill('Parcel test property');
  await form.locator('[name="price"]').fill('4500000');
  await form.locator('[name="area"]').fill('250');
  await frame.getByRole('button', { name: 'Continue', exact: true }).click();
  await form.locator('[name="district"]').fill('Guntur');
  await form.locator('[name="village"]').fill('Tulluru');
  await form.locator('[name="x_address"]').fill('Demo property, Tulluru main road');
  await form.locator('[name="x_pincode"]').fill('522237');
  await frame.getByRole('button', { name: 'Previous step', exact: true }).click();
  await expect(form.locator('[name="title"]')).toHaveValue('Parcel test property');
  await frame.getByRole('button', { name: 'Continue', exact: true }).click();
  await frame.getByRole('button', { name: 'Continue', exact: true }).click();
  await frame.getByRole('button', { name: 'Continue', exact: true }).click();
  await form.locator('[name="phone"]').fill('9876543210');
  await frame.getByRole('button', { name: 'Save private property inventory', exact: true }).click();
  await expect(frame.locator('h1')).toHaveText('Parcel test property');
  await frame.getByRole('tab', { name: 'Activity', exact: true }).click();
  await expect(frame.getByRole('heading', { name: 'Seller controls', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('catalogue supports list view, comparison and empty search results', async ({ page }) => {
  await page.goto('/dashboard');
  const frame = page.frameLocator('iframe');
  await frame.locator('nav').getByRole('button', { name: 'Explore', exact: true }).click();
  await frame.getByRole('button', { name: 'List view', exact: true }).click();
  await expect(frame.locator('.parcel-listview .classiccard')).toHaveCount(3);
  await frame.locator('.classiccard').first().getByRole('button', { name: 'Compare', exact: true }).click({ timeout: 5000 });
  await frame.locator('.classiccard').nth(1).getByRole('button', { name: 'Compare', exact: true }).click({ timeout: 5000 });
  await frame.getByRole('button', { name: 'Compare properties', exact: true }).click();
  await expect(frame.locator('.comparetable thead th')).toHaveCount(3);
  await frame.locator('nav').getByRole('button', { name: 'Explore', exact: true }).click();
  await frame.getByRole('textbox', { name: 'Search properties', exact: true }).fill('unfindable property');
  await frame.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(frame.getByRole('heading', { name: 'No matching properties', exact: true })).toBeVisible();
  await frame.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(frame.locator('.classiccard')).toHaveCount(3);
});
