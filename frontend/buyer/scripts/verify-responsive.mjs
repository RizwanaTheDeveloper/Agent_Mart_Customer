import { chromium, devices, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.EXPO_BUYER_TEST_URL || 'http://localhost:8081';
const actions = ['Buyer login', 'Create buyer account', 'View buyer demo', 'Seller / owner login', 'Create seller account', 'View seller / owner demo'];
const profiles = [
  { name: 'web', options: {}, sizes: [[280, 653], [320, 568], [360, 800], [768, 1024], [820, 1180], [1024, 768], [1440, 900], [1920, 1080]] },
  { name: 'android', options: devices['Pixel 7'], sizes: [[393, 851], [851, 393]] },
  { name: 'ios', options: devices['iPhone 13'], sizes: [[390, 844], [844, 390]] },
];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
await mkdir('outputs', { recursive: true });
try {
  for (const profile of profiles) {
    const context = await browser.newContext(profile.options);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await expect(page.getByRole('heading', { name: 'Choose your workspace', exact: true })).toBeVisible({ timeout: 60000 });
    for (const [width, height] of profile.sizes) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const buyer = page.getByRole('button', { name: 'Buyer login', exact: true });
      const seller = page.getByRole('button', { name: 'Seller / owner login', exact: true });
      for (const [login, demo] of [[buyer, 'View buyer demo'], [seller, 'View seller / owner demo']]) {
        const card = await login.locator('..').boundingBox();
        const end = await page.getByRole('button', { name: demo, exact: true }).boundingBox();
        assert.ok(end.y >= card.y && end.y + end.height <= card.y + card.height + 1, `${profile.name} ${width}: card content overflows vertically`);
      }
      if (width < 760) {
        const first = await buyer.locator('..').boundingBox();
        const second = await seller.locator('..').boundingBox();
        assert.ok(first.y + first.height <= second.y, `${profile.name} ${width}: stacked cards overlap`);
      }
      if (width < 1000 && height >= 500) {
        const copy = await page.getByText('One place. Two ways to move forward.', { exact: true }).boundingBox();
        const art = await page.getByText('Room for what comes next.', { exact: true }).boundingBox();
        assert.ok(art.y >= copy.y + copy.height, `${profile.name} ${width}: hero artwork overlaps text`);
      }
      for (const name of actions) {
        const button = page.getByRole('button', { name, exact: true });
        await button.scrollIntoViewIfNeeded();
        await expect(button).toBeVisible();
        const box = await button.boundingBox();
        assert.ok(box.x >= -1 && box.x + box.width <= width + 1, `${profile.name} ${width}: ${name} outside screen`);
        assert.ok(box.height >= 44, `${name}: touch target too small`);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${profile.name} ${width}: horizontal overflow`);
      await page.evaluate(() => document.querySelectorAll('*').forEach(element => { if (element.scrollHeight > element.clientHeight) element.scrollTop = 0; }));
      await page.screenshot({ path: `outputs/responsive-${profile.name}-${width}x${height}.png` });
      console.log(`PASS ${profile.name} ${width}x${height}`);
    }
    await buyerNavigation(page);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('PASS: responsive layout, non-overlapping content, reachable actions, touch targets, rotation and navigation. Browser profiles do not replace native device testing.');
} finally {
  await browser.close();
}

async function buyerNavigation(page) {
  await page.getByRole('button', { name: 'Buyer login', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Buyer login', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to workspace selection', exact: true }).click();
  await page.getByRole('button', { name: 'View buyer demo', exact: true }).click();
  await expect(page.getByLabel('Search properties')).toBeVisible();
}
