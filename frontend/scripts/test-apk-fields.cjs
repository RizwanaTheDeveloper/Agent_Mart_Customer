const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { mkdirSync, openSync, closeSync } = require('node:fs');
const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const { chromium, expect } = require('@playwright/test');

async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

(async () => {
  const frontend = path.resolve(__dirname, '..'), seller = path.join(frontend, 'seller');
  const outputs = path.join(frontend, 'outputs/apk-fields'); mkdirSync(outputs, { recursive: true });
  const { calculateScenarios } = await import(pathToFileURL(path.join(seller, 'lib/investment.ts')).href);
  const inputs = { price: 1000, acquisition: 10, holding: 100, selling: 5, inflation: 10, rates: [0, 0, 0], years: 10, monthlyRent: 0 };
  const result = calculateScenarios(inputs)[0];
  assert.equal(result.upfront, 1100); assert.equal(result.holdingCosts, 1000); assert.equal(result.netSale, 950); assert.equal(result.profit, -1150);
  assert.ok(Math.abs(result.realNetSale - 950 / 1.1 ** 10) < 1e-8);
  assert.throws(() => calculateScenarios({ ...inputs, years: 1.5 }), /assumptions/);
  assert.throws(() => calculateScenarios({ ...inputs, rates: [NaN, 0, 0] }), /assumptions/);
  const buyerPort = await freePort(), sellerPort = await freePort();
  const children = [];
  function launch(cwd, args, name, env = {}) {
    const fd = openSync(path.join(outputs, name + '.log'), 'w');
    const child = spawn(process.execPath, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', fd, fd], windowsHide: true });
    closeSync(fd); children.push(child); return child;
  }
  launch(frontend, ['node_modules/expo/bin/cli', 'start', '--localhost', '--port', String(buyerPort)], 'expo', { CI: '1', AGENTMART_SELLER_MANAGED: '1' });
  launch(seller, ['node_modules/vinext/dist/cli.js', 'dev', '--hostname', '127.0.0.1', '--port', String(sellerPort)], 'seller');
  let browser;
  try {
    for (const port of [buyerPort, sellerPort]) {
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        if (children.some(child => child.exitCode !== null)) throw Error('A frontend stopped. Inspect outputs/apk-fields/*.log.');
        try { if ((await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(1500) })).ok) { ready = true; break; } } catch { /* Startup. */ }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      assert.ok(ready, 'Frontend must start.');
    }
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(30000);
    await page.goto(`http://127.0.0.1:${sellerPort}/?demo=1`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Properties', exact: true }).click();
    await page.getByRole('button', { name: 'Add property', exact: true }).first().click();
    await page.getByRole('button', { name: 'Property details', exact: true }).click();
    await expect(page.getByLabel('Carpet area (sq ft)', { exact: true })).toHaveAttribute('type', 'number');
    await expect(page.getByLabel('Seller-stated possession date', { exact: true })).toHaveAttribute('type', 'date');
    await page.getByLabel('Project name', { exact: true }).fill('APK field comparison');
    await page.getByLabel('Plot length (m)', { exact: true }).fill('20');
    await page.screenshot({ path: path.join(outputs, 'seller-property-fields.png'), fullPage: true });

    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
    await page.getByRole('button', { name: 'Research', exact: true }).click();
    await page.getByRole('button', { name: 'Investment scenarios', exact: true }).click();
    for (const label of ['Acquisition costs (%)', 'Annual holding cost (INR)', 'Inflation assumption (%)', 'Downside rate (%)', 'Moderate rate (%)', 'Higher-growth rate (%)']) await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    await page.getByLabel('Acquisition costs (%)', { exact: true }).fill('8');
    await page.getByLabel('Inflation assumption (%)', { exact: true }).fill('5');
    await expect(page.getByText("Net sale proceeds in today's money", { exact: true })).toHaveCount(3);
    await page.screenshot({ path: path.join(outputs, 'seller-scenarios.png'), fullPage: true });
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`http://127.0.0.1:${buyerPort}/property/buyer-sample-1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.getByText('Property facts', { exact: true })).toBeVisible();
    await expect(page.getByText('CRDA plot code', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Project and building/ }).click();
    await expect(page.getByText('Carpet area (sq ft)', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Plot and utilities/ }).click();
    await expect(page.getByText('Plot length (m)', { exact: true })).toBeVisible();
    assert.ok(await page.locator('body').evaluate(element => element.scrollWidth <= window.innerWidth + 1));
    await page.screenshot({ path: path.join(outputs, 'buyer-property-facts.png'), fullPage: true });
    console.log('PASS: Seller property field types and groups, APK scenario inputs and cost calculations, Buyer field visibility and mobile layout. Demo screens only; no records saved.');
  } finally {
    await browser?.close();
    for (const child of children) if (child.pid && child.exitCode === null) spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore', timeout: 5000 });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
