const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const { mkdirSync, openSync, closeSync } = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { pathToFileURL } = require('node:url');
const { chromium, expect } = require('@playwright/test');

(async () => {
  const frontend = path.resolve(__dirname, '..');
  const outputs = path.join(frontend, 'outputs', 'master-plan');
  mkdirSync(outputs, { recursive: true });
  const { planningRequest } = await import(pathToFileURL(path.join(frontend, 'buyer/src/master-plan/api.ts')).href);
  await assert.rejects(() => planningRequest({ action: 'plot', layer: 'plots', code: "x' OR 1=1" }), /plot code/);
  await assert.rejects(() => planningRequest({ action: 'identify', layer: 'plots', lat: NaN, lon: 80 }), /valid map coordinates/);
  await assert.rejects(() => planningRequest({ action: 'plot', layer: 'private', code: '123' }), /supported planning layer/);
  const sampleUrl = 'https://gis.apcrda.org/server/rest/services/LSP19Aug2026/MapServer/0/query?' + new URLSearchParams({ f: 'json', where: 'plot_code IS NOT NULL', outFields: 'plot_code', returnGeometry: 'false', resultRecordCount: '1' });
  const sample = await (await fetch(sampleUrl, { signal: AbortSignal.timeout(20000) })).json();
  const code = sample.features?.[0]?.attributes.plot_code;
  assert.ok(code, 'Live APCRDA must return a public plot for the integration check.');
  const plot = await planningRequest({ action: 'plot', layer: 'plots', code }, AbortSignal.timeout(20000));
  assert.ok(plot.features.length);
  assert.equal(plot.features[0].properties.plot_code, code);
  for (const feature of plot.features) for (const field of ['aadhar_no', 'farmer_n', 'bb_mob_number', 'bb_address']) assert.equal(field in feature.properties, false);

  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const fd = openSync(path.join(outputs, 'expo.log'), 'w');
  const child = spawn(process.execPath, [path.join(frontend, 'node_modules/expo/bin/cli'), 'start', '--localhost', '--port', String(port)], {
    cwd: frontend, env: { ...process.env, CI: '1', AGENTMART_SELLER_MANAGED: '1' }, stdio: ['ignore', fd, fd], windowsHide: true,
  });
  closeSync(fd);
  let browser;
  try {
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let index = 0; index < 90; index++) {
      if (child.exitCode !== null) throw Error('Expo stopped. Inspect outputs/master-plan/expo.log.');
      try { if ((await fetch(base, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch { /* Startup only. */ }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    assert.ok(ready, 'Expo must start.');
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/master-plan`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const frame = page.frameLocator('iframe[title="Buyer tools workspace"]');
    await expect(frame.locator('.leaflet-container')).toBeVisible({ timeout: 45000 });
    await expect(frame.getByRole('checkbox')).toHaveCount(5);
    await expect(frame.locator('.leaflet-tile-loaded').first()).toBeVisible({ timeout: 30000 });
    await expect(frame.getByRole('status')).toContainText(/APCRDA layers loaded|Zoom in to see plot boundaries/, { timeout: 45000 });
    await frame.getByLabel('CRDA plot code').fill(code);
    await frame.getByRole('button', { name: 'Find plot', exact: true }).click();
    await expect(frame.locator('#results')).toContainText(code, { timeout: 30000 });
    await expect(frame.locator('#results')).toContainText('Land use');
    await expect(frame.locator('#results')).toContainText('Zoning');
    await expect(frame.locator('#results')).toContainText('Plot number');
    async function clickPlotCenter() {
      // fitBounds animates after search; wait for the short map transition.
      await page.waitForTimeout(400);
      const box = await frame.locator('#map').boundingBox();
      await frame.locator('#map').click({ position: { x: box.width / 2, y: box.height / 2 } });
    }
    await clickPlotCenter();
    await expect(frame.locator('.leaflet-popup-content').last()).toContainText(`CRDA plot code: ${code}`, { timeout: 30000 });
    await expect(frame.locator('.leaflet-popup-content').last()).toContainText('Plot number');
    await frame.getByRole('checkbox', { name: 'Plot boundaries and land use', exact: true }).uncheck();
    await frame.getByLabel('CRDA plot code').fill(code);
    await frame.getByRole('button', { name: 'Find plot', exact: true }).click();
    await expect(frame.locator('#results')).toContainText(code, { timeout: 30000 });
    await clickPlotCenter();
    await expect(frame.locator('.leaflet-popup-content').last()).toContainText(`CRDA plot code: ${code}`, { timeout: 30000 });
    await frame.getByRole('checkbox', { name: 'Industrial area', exact: true }).check();
    await expect(frame.locator('#legend')).toContainText('Industrial area');
    await page.screenshot({ path: path.join(outputs, 'desktop.png'), fullPage: true });

    // Exercise real browser HTTP error handling without relying on an outage.
    const routePattern = '**/LSP19Aug2026/MapServer/0/query?**';
    await page.route(routePattern, route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ type: 'FeatureCollection', features: [] }) }));
    await clickPlotCenter();
    await expect(frame.locator('.leaflet-popup-content').last()).toContainText('No CRDA plot number is mapped at this location.', { timeout: 30000 });
    await expect(frame.locator('.leaflet-popup-content').last()).not.toContainText(code);
    await page.unroute(routePattern);
    await page.route(routePattern, route => route.fulfill({ status: 503, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Unavailable' }) }));
    await frame.getByRole('button', { name: 'Find plot', exact: true }).click();
    await expect(frame.locator('#results')).toContainText('HTTP 503', { timeout: 30000 });
    await page.unroute(routePattern);
    await page.route(routePattern, route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: { code: 499, message: 'Token Required' } }) }));
    await frame.getByRole('button', { name: 'Find plot', exact: true }).click();
    await expect(frame.locator('#results')).toContainText('requires authorization', { timeout: 30000 });
    await page.unroute(routePattern);
    await frame.getByLabel('CRDA plot code').fill('AGENTMART-NO-SUCH-PLOT');
    await frame.getByRole('button', { name: 'Find plot', exact: true }).click();
    await expect(frame.locator('#results')).toContainText('No plot with that code was found', { timeout: 30000 });
    await frame.getByLabel('CRDA plot code').fill(code);
    await frame.getByRole('button', { name: 'Find plot', exact: true }).click();
    await expect(frame.locator('#results')).toContainText(code, { timeout: 30000 });
    await page.setViewportSize({ width: 393, height: 852 });
    await expect(frame.locator('#map')).toBeVisible();
    await frame.getByRole('button', { name: 'Find plot', exact: true }).click();
    await expect(frame.locator('#results')).toContainText(code, { timeout: 30000 });
    await clickPlotCenter();
    await expect(frame.locator('.leaflet-popup-content').last()).toContainText(`CRDA plot code: ${code}`, { timeout: 30000 });
    assert.ok(await frame.locator('body').evaluate(element => element.scrollWidth <= window.innerWidth + 1), 'Mobile map should fit the screen.');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outputs, 'mobile.png'), fullPage: true });

    // The standard Buyer map must perform the same point lookup as the planning map.
    await page.route('**/api/buyer/listings?**', route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ listings: [], nextOffset: null }) }));
    await page.goto(base+'/tools?view=map', { waitUntil: 'domcontentloaded' });
    const standard=page.frameLocator('iframe[title="Buyer tools workspace"]');
    await expect(standard.locator('#mainmap')).toBeVisible({ timeout: 30000 });
    const ring=plot.features[0].geometry.coordinates[0],xs=ring.map(point=>point[0]),ys=ring.map(point=>point[1]);
    const center={lat:(Math.min(...ys)+Math.max(...ys))/2,lon:(Math.min(...xs)+Math.max(...xs))/2};
    async function centerStandard(point){
      await standard.locator('#mainmap').evaluate((el,location)=>{const m=maps[el.id];m.lat=location.lat;m.lon=location.lon;m.z=18;drawMap(el.id)},point);
      const box=await standard.locator('#mainmap').boundingBox();
      await standard.locator('#mainmap').click({position:{x:box.width/2,y:box.height/2}});
    }
    await centerStandard(center);
    await expect(standard.locator('.crda-map-popup')).toContainText('CRDA plot code: '+code,{timeout:30000});
    await expect(standard.locator('.crda-map-popup')).toContainText('Plot number');
    await centerStandard({lat:12.9716,lon:77.5946});
    await expect(standard.locator('.crda-map-popup')).toContainText('No CRDA plot number is mapped at this location.',{timeout:30000});
    await expect(standard.locator('.crda-map-popup')).not.toContainText(code);
    await page.screenshot({path:path.join(outputs,'standard-map-no-record.png'),fullPage:true});

    assert.deepEqual(errors, []);
    console.log('PASS: live plot click popups, plot numbers with hidden overlays, no-plot messages, public-field projection, map layers, source errors, recovery, and mobile layout.');
  } finally {
    await browser?.close();
    if (child.pid && child.exitCode === null) spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore', timeout: 5000 });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
