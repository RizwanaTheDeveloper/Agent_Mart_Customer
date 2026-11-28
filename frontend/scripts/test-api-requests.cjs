const assert = require('node:assert/strict');
const { test } = require('node:test');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');

async function withProviders(run) {
  const requests = [], originalFetch = global.fetch;
  let active = 0, peak = 0, mode = 'success';
  let started; const firstRequest = new Promise(resolve => { started = resolve; });
  const server = http.createServer((request, response) => {
    requests.push(request.url); active++; peak = Math.max(peak, active); started();
    const currentMode = mode;
    setTimeout(() => {
      response.setHeader('Content-Type', 'application/json');
      const fail = currentMode === 'failure' || currentMode === 'fallback' && request.url.startsWith('/overpass-api.de/');
      response.statusCode = fail ? 503 : 200;
      if (fail) response.end(JSON.stringify({ error: 'Service unavailable' }));
      else if (request.url.includes('gis.apcrda.org')) response.end(JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[80.52, 16.52], [80.521, 16.52], [80.521, 16.521], [80.52, 16.52]]] }, properties: { plot_code: '13-535-2974-11-C18' } }] }));
      else response.end(JSON.stringify({ elements: currentMode === 'empty' ? [] : [{ type: 'node', id: 1, lat: 16.52, lon: 80.52, tags: { name: 'Test school', amenity: 'school' } }] }));
      active--;
    }, 60);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  global.fetch = (input, options) => {
    const url = new URL(String(input));
    if (!/overpass|photon|gis\.apcrda/.test(url.hostname) && url.hostname !== 'maps.mail.ru') throw Error('Unexpected test dependency: ' + url.hostname);
    return originalFetch(`${origin}/${url.hostname}${url.pathname}${url.search}`, options);
  };
  try {
    const base = path.resolve(__dirname, '../buyer/src');
    let source = fs.readFileSync(path.join(base, 'nearby.ts'), 'utf8');
    source = source.replace("'./master-plan/api'", JSON.stringify(pathToFileURL(path.join(base, 'master-plan/api.ts')).href));
    source = source.replace("'./request-cache'", JSON.stringify(pathToFileURL(path.join(base, 'request-cache.ts')).href));
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText + `\n// Instance ${Math.random()}`;
    const client = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
    await run({ client, requests, firstRequest, setMode: value => { mode = value; }, peak: () => peak });
  } finally {
    global.fetch = originalFetch; server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  }
}

test('identical concurrent landmark lookups share one HTTP request and reuse the successful result', async () => {
  await withProviders(async ({ client, requests }) => {
    const [a, b] = await Promise.all([client.landmarksAround(16.52, 80.52, 1000), client.landmarksAround(16.52, 80.52, 1000)]);
    assert.equal(requests.length, 1); assert.deepEqual(a, b); assert.equal(a[0].name, 'Test school');
    await client.landmarksAround(16.52, 80.52, 1000); assert.equal(requests.length, 1);
  });
});

test('a failed Overpass server falls back without parallel duplicate searches', async () => {
  await withProviders(async ({ client, requests, setMode, peak }) => {
    setMode('fallback'); const result = await client.landmarksAround(16.52, 80.52, 1000);
    assert.equal(result.length, 1); assert.equal(requests.length, 2); assert.equal(peak(), 1);
    assert.ok(requests[1].startsWith('/overpass.kumi.systems/'));
  });
});

test('cancelling one screen leaves another subscriber to the same search running', async () => {
  await withProviders(async ({ client, requests, firstRequest }) => {
    const controller = new AbortController();
    const a = client.landmarksAround(16.52, 80.52, 1000, controller.signal);
    const rejection = assert.rejects(a, { name: 'AbortError' });
    const b = client.landmarksAround(16.52, 80.52, 1000);
    await firstRequest; controller.abort(); await rejection;
    assert.equal((await b).length, 1); assert.equal(requests.length, 1);
  });
});

test('cancelled requests are not reused by a subsequent search', async () => {
  await withProviders(async ({ client, requests, firstRequest }) => {
    const controller = new AbortController();
    const pending = client.landmarksAround(16.52, 80.52, 1000, controller.signal);
    const rejection = assert.rejects(pending, { name: 'AbortError' });
    await firstRequest; controller.abort(); await rejection;
    assert.equal((await client.landmarksAround(16.52, 80.52, 1000)).length, 1);
    assert.equal(requests.length, 2);
  });
});

test('an empty successful source does not trigger unnecessary backup providers', async () => {
  await withProviders(async ({ client, requests, setMode }) => {
    setMode('empty'); assert.deepEqual(await client.landmarksAround(16.52, 80.52, 1000), []);
    assert.equal(requests.length, 1);
  });
});

test('source failures retain Photon fallback, are not cached, and recover on retry', async () => {
  await withProviders(async ({ client, requests, setMode }) => {
    setMode('failure'); await assert.rejects(client.landmarksAround(16.52, 80.52, 1000), /unavailable/);
    assert.ok(requests.some(url => url.startsWith('/photon.komoot.io/')));
    const count = requests.length; setMode('success');
    assert.equal((await client.landmarksAround(16.52, 80.52, 1000)).length, 1); assert.equal(requests.length, count + 1);
  });
});

test('different radii remain separate and repeated plot-boundary requests are coalesced', async () => {
  await withProviders(async ({ client, requests }) => {
    await Promise.all([client.landmarksAround(16.52, 80.52, 1000), client.landmarksAround(16.52, 80.52, 3000)]);
    assert.equal(requests.length, 2);
    const [a, b] = await Promise.all([client.plotBoundary('13/535/2974/11/C18'), client.plotBoundary('13-535-2974-11-C18')]);
    assert.deepEqual(a, b); assert.ok(a.length); assert.equal(requests.filter(url => url.startsWith('/gis.apcrda.org/')).length, 1);
  });
});

test('expired public data is refreshed instead of cached indefinitely', async () => {
  const { createReadCache } = await import(pathToFileURL(path.resolve(__dirname, '../buyer/src/request-cache.ts')).href);
  const read = createReadCache(10); let calls = 0;
  assert.equal(await read('key', async () => ++calls), 1);
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(await read('key', async () => ++calls), 2);
});

test('simultaneous published-listing loads share pagination and a later refresh fetches new data', async () => {
  let calls = 0, title = 'First version';
  const server = http.createServer((request, response) => {
    calls++;
    const offset = new URL(request.url, 'http://localhost').searchParams.get('offset');
    setTimeout(() => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ listings: [{ id: offset, title }], nextOffset: offset === '0' ? 1 : null })); }, 20);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const previous = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${server.address().port}`;
  try {
    const base = path.resolve(__dirname, '../buyer/src');
    let source = fs.readFileSync(path.join(base, 'api.ts'), 'utf8');
    source = source.replace("import { sellerAddress } from './seller/config';", 'const sellerAddress = () => ({ url: process.env.EXPO_PUBLIC_API_URL });');
    source = source.replace("'./request-cache'", JSON.stringify(pathToFileURL(path.join(base, 'request-cache.ts')).href));
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    const client = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
    const [a, b] = await Promise.all([client.publishedListings(), client.publishedListings()]);
    assert.equal(a.length, 2); assert.deepEqual(a, b); assert.equal(calls, 2);
    title = 'Updated version'; const refreshed = await client.publishedListings();
    assert.equal(refreshed[0].title, title); assert.equal(calls, 4);
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous;
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  }
});
