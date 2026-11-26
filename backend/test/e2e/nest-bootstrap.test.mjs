import 'reflect-metadata';
import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';

Object.assign(process.env, { NODE_ENV: 'test', APP_NAME: 'AgentMart API', DATABASE_REQUIRED: 'false', DATABASE_URL: '', CORS_ORIGINS: 'http://localhost:8083', API_PREFIX: 'api/v1', SWAGGER_ENABLED: 'true' });
process.env.JWT_ACCESS_SECRET = 'test-access-only-'.repeat(4);
process.env.JWT_REFRESH_SECRET = 'test-refresh-only-'.repeat(4);
let app, base;
before(async () => {
  const { createApplication } = await import('../../dist/bootstrap.js');
  app = await createApplication();
  await app.listen(0, '127.0.0.1');
  base = `http://127.0.0.1:${app.getHttpServer().address().port}`;
});
after(async () => { await app?.close(); });

test('the actual Nest/Express server serves liveness with security headers', async () => {
  const response = await fetch(`${base}/api/v1/health`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'AgentMart API');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-powered-by'), null);
});

test('unconfigured PostgreSQL returns honest readiness failure', async () => {
  const response = await fetch(`${base}/api/v1/health/ready`);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).database, 'unconfigured');
});

test('Swagger documents the implemented endpoints', async () => {
  const response = await fetch(`${base}/api/v1/docs-json`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.paths['/api/v1/health']);
  assert.ok(data.paths['/api/v1/health/ready']);
  assert.equal(data.paths['/api/buyer/auth/login'], undefined);
});

test('allowed origins receive CORS headers and unlisted websites are rejected', async () => {
  const allowed = await fetch(`${base}/api/v1/health`, { headers: { Origin: 'http://localhost:8083' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:8083');
  const denied = await fetch(`${base}/api/v1/health`, { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).message, 'Origin is not allowed.');
});

test('404 errors use a stable shape without echoing query secrets', async () => {
  const response = await fetch(`${base}/missing?token=do-not-echo`);
  const data = await response.json();
  assert.equal(response.status, 404);
  assert.equal(data.message, 'Route not found.');
  assert.equal(data.path, '/missing');
  assert.ok(!JSON.stringify(data).includes('do-not-echo'));
});

test('malformed and oversized JSON bodies are rejected before routing', async () => {
  const malformed = await fetch(`${base}/api/v1/health`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' });
  assert.equal(malformed.status, 400);
  const oversized = await fetch(`${base}/api/v1/health`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload: 'x'.repeat(70000) }) });
  assert.equal(oversized.status, 413);
});

test('the global request limiter rejects bursts', async () => {
  let limited = false;
  for (let attempt = 0; attempt < 125; attempt++) {
    const response = await fetch(`${base}/api/v1/health`);
    await response.text();
    if (response.status === 429) { limited = true; break; }
  }
  assert.ok(limited, 'Expected HTTP 429 after the configured request allowance.');
});
