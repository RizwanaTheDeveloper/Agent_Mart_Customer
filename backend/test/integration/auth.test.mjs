import 'reflect-metadata';
import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, openSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

const target = new URL(process.env.AUTH_TEST_DATABASE_URL || 'http://not-configured');
assert.equal(target.hostname, '127.0.0.1', 'Run through scripts/test-auth.ps1.');
assert.equal(target.pathname, '/agentmart_auth_test');
assert.notEqual(target.port, '5432');
process.env.DATABASE_URL = target.toString();
process.env.NODE_ENV = 'test';
process.env.DATABASE_REQUIRED = 'true';
process.env.API_PREFIX = 'api/v1';
process.env.SWAGGER_ENABLED = 'true';
const root = new URL('../../', import.meta.url);
const db = new PrismaClient({ datasources: { db: { url: target.toString() } } });
let app, base, frontendPort, buyer, seller;
const password = 'A test password with 123 spaces';
const credentials = { name: 'API Buyer', email: 'buyer@example.test', password };
async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function call(path, { method = 'GET', body, token, headers = {} } = {}) {
  const response = await fetch(`${base}/api/v1/auth/${path}`, { method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json(), headers: response.headers };
}
before(async () => {
  const identity = await db.$queryRaw`SELECT current_database() AS name`;
  assert.equal(identity[0].name, 'agentmart_auth_test');
  frontendPort = await freePort();
  process.env.CORS_ORIGINS = `http://127.0.0.1:${frontendPort}`;
  const { createApplication } = await import('../../dist/bootstrap.js');
  app = await createApplication();
  await app.listen(0, '127.0.0.1');
  base = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  buyer = await call('register', { method: 'POST', body: credentials });
  seller = await call('register', { method: 'POST', body: { ...credentials, name: 'API Seller', email: 'seller@example.test', role: 'SELLER' } });
  assert.equal(buyer.status, 201); assert.equal(seller.status, 201);
});
after(async () => { await app?.close(); await db.$disconnect(); });

test('registration stores Argon2 hashes and refresh hashes without exposing them', async () => {
  assert.equal(buyer.data.user.role, 'BUYER'); assert.equal(seller.data.user.role, 'SELLER');
  assert.equal(buyer.data.user.passwordHash, undefined);
  const user = await db.user.findUniqueOrThrow({ where: { id: buyer.data.user.id } });
  assert.ok(user.passwordHash.startsWith('$argon2id$'));
  assert.notEqual(user.passwordHash, password);
  const session = await db.refreshSession.findUniqueOrThrow({ where: { id: buyer.data.refreshToken.split('.')[0] } });
  assert.equal(session.tokenHash.length, 64); assert.notEqual(session.tokenHash, buyer.data.refreshToken);
});

test('registration rejects duplicate email, weak/oversized passwords and privilege injection', async () => {
  assert.equal((await call('register', { method: 'POST', body: { ...credentials, email: 'BUYER@EXAMPLE.TEST' } })).status, 409);
  for (const body of [{ ...credentials, email: 'short@example.test', password: 'short' }, { ...credentials, email: 'long@example.test', password: 'x'.repeat(129) }, { ...credentials, email: 'admin@example.test', role: 'OWNER' }, { ...credentials, email: 'extra@example.test', admin: true }]) {
    assert.equal((await call('register', { method: 'POST', body })).status, 400);
  }
  assert.equal(await db.user.count(), 2);
});

test('login normalizes email and uses the same error for unknown users and bad passwords', async () => {
  const unknown = await call('login', { method: 'POST', body: { email: 'missing@example.test', password } });
  const wrong = await call('login', { method: 'POST', body: { email: credentials.email, password: 'incorrect-password' } });
  assert.equal(unknown.status, 401); assert.equal(wrong.status, 401); assert.equal(unknown.data.message, wrong.data.message);
    const correct = await call('login', { method: 'POST', body: { email: ' BUYER@EXAMPLE.TEST ', password, role: 'BUYER' } });
  assert.equal(correct.status, 200); assert.equal(correct.data.user.id, buyer.data.user.id);
});

test('protected user data requires a valid access token and returns database identity', async () => {
  assert.equal((await call('me')).status, 401);
  assert.equal((await call('me', { token: 'invalid' })).status, 401);
  const result = await call('me', { token: buyer.data.accessToken });
  assert.equal(result.status, 200); assert.deepEqual(result.data.user, buyer.data.user);
  assert.equal(result.data.user.passwordHash, undefined);
});

test('JWT expiry, wrong signatures, wrong algorithms and cross-user session claims are rejected', async () => {
  const jwt = new JwtService();
  const payload = { sub: buyer.data.user.id, sid: buyer.data.refreshToken.split('.')[0], type: 'access' };
  const options = { secret: process.env.JWT_ACCESS_SECRET, issuer: 'agentmart-api', audience: 'agentmart-clients' };
  for (const token of [
    await jwt.signAsync(payload, { ...options, expiresIn: -1 }),
    await jwt.signAsync(payload, { ...options, secret: 'incorrect-signing-secret', expiresIn: 60 }),
    await jwt.signAsync(payload, { ...options, algorithm: 'HS384', expiresIn: 60 }),
    await jwt.signAsync({ ...payload, sub: seller.data.user.id }, { ...options, expiresIn: 60 }),
  ]) assert.equal((await call('me', { token })).status, 401);
  const untrustedRole = await jwt.signAsync({ ...payload, role: 'OWNER' }, { ...options, expiresIn: 60 });
  assert.equal((await call('me', { token: untrustedRole })).data.user.role, 'BUYER');
});

test('refresh tokens rotate once and concurrent refresh has only one winner', async () => {
  const rotated = await call('refresh', { method: 'POST', body: { refreshToken: buyer.data.refreshToken } });
  assert.equal(rotated.status, 200); assert.notEqual(rotated.data.refreshToken, buyer.data.refreshToken);
  assert.equal((await call('refresh', { method: 'POST', body: { refreshToken: buyer.data.refreshToken } })).status, 401);
  const results = await Promise.all([0, 1].map(() => call('refresh', { method: 'POST', body: { refreshToken: rotated.data.refreshToken } })));
  assert.deepEqual(results.map(x => x.status).sort(), [200, 401]);
  buyer.data = results.find(x => x.status === 200).data;
  assert.equal((await call('me', { token: buyer.data.accessToken })).status, 200);
  assert.equal((await call('refresh', { method: 'POST', body: { refreshToken: '-'.repeat(36) + '.' + 'a'.repeat(43) } })).status, 400);
});

test('logout revokes both access and refresh while leaving another device signed in', async () => {
  const login = await call('login', { method: 'POST', body: { email: credentials.email, password } });
  assert.equal((await call('logout', { method: 'POST', token: login.data.accessToken })).status, 200);
  assert.equal((await call('me', { token: login.data.accessToken })).status, 401);
  assert.equal((await call('refresh', { method: 'POST', body: { refreshToken: login.data.refreshToken } })).status, 401);
  assert.equal((await call('me', { token: buyer.data.accessToken })).status, 200);
});

test('database session expiry rejects otherwise valid JWTs', async () => {
  const login = await call('login', { method: 'POST', body: { email: credentials.email, password } });
  await db.refreshSession.update({ where: { id: login.data.refreshToken.split('.')[0] }, data: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await call('me', { token: login.data.accessToken })).status, 401);
  assert.equal((await call('refresh', { method: 'POST', body: { refreshToken: login.data.refreshToken } })).status, 401);
});

test('web sessions use HttpOnly cookies and require Origin for cookie refresh', async () => {
  const login = await call('login', { method: 'POST', body: { email: credentials.email, password }, headers: { 'X-Auth-Client': 'web', Origin: base } });
  assert.equal(login.status, 200); assert.equal(login.data.refreshToken, undefined);
  const cookie = login.headers.getSetCookie().find(x => x.startsWith('agentmart_refresh='));
  assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=Strict/i); assert.match(cookie, /Path=\/api\/v1\/auth/i);
  const cookieHeader = cookie.split(';')[0];
  assert.equal((await call('refresh', { method: 'POST', body: {}, headers: { 'X-Auth-Client': 'web', Cookie: cookieHeader } })).status, 403);
  const refreshed = await call('refresh', { method: 'POST', body: {}, headers: { 'X-Auth-Client': 'web', Cookie: cookieHeader, Origin: base } });
  assert.equal(refreshed.status, 200); assert.equal(refreshed.data.refreshToken, undefined);
  assert.equal((await call('logout', { method: 'POST', token: refreshed.data.accessToken })).status, 200);
});

test('the frontend registers, restores, logs out and logs in through real PostgreSQL auth', { skip: process.env.AUTH_TEST_BROWSER !== '1', timeout: 180000 }, async () => {
  const require = createRequire(new URL('../../../frontend/package.json', import.meta.url));
  const { chromium, expect } = require('@playwright/test');
  const frontend = fileURLToPath(new URL('../frontend/', root));
  const logs = fileURLToPath(new URL('outputs/', root)); mkdirSync(logs, { recursive: true });
  const fd = openSync(`${logs}/auth-expo.log`, 'w');
  const child = spawn(process.execPath, [fileURLToPath(new URL('../frontend/node_modules/expo/bin/cli', root)), 'start', '--web', '--localhost', '--port', String(frontendPort)], {
    cwd: frontend, env: { ...process.env, CI: '1', AGENTMART_SELLER_MANAGED: '1', EXPO_PUBLIC_AUTH_API_URL: `${base}/api/v1` }, stdio: ['ignore', fd, fd], windowsHide: true, detached: process.platform !== 'win32',
  });
  closeSync(fd);
  let browser;
  try {
    const frontendUrl = `http://127.0.0.1:${frontendPort}`;
    let ready = false;
    for (let attempt = 0; attempt < 90; attempt++) {
      if (child.exitCode !== null) throw Error('Test Expo server stopped; inspect outputs/auth-expo.log.');
      try { if ((await fetch(frontendUrl, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch { /* Wait for startup. */ }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    assert.ok(ready);
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
    await page.route('**/api/v1/auth/**', route => route.request().url().startsWith(`${base}/api/v1/auth/`) ? route.continue() : route.abort());
    page.setDefaultTimeout(60000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${frontendUrl}/login?workspace=buyer&mode=create`);
    const email = `browser-${randomUUID()}@example.test`;
    await page.getByLabel('Your name', { exact: true }).fill('Frontend Buyer');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(page).toHaveURL(/\/discover$/);
    await page.getByRole('button', { name: 'Buyer profile', exact: true }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByText('Frontend Buyer', { exact: true })).toBeVisible();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Switch account' })).toBeVisible();
    await page.getByLabel('Preferred city', { exact: true }).fill('Amaravati');
    await page.getByRole('button', { name: 'Prefer Plot', exact: true }).click();
    await page.getByLabel('Budget ceiling (INR)', { exact: true }).fill('6000000');
    await page.getByRole('button', { name: 'Save preferences', exact: true }).click();
    await expect(page.getByText('Preferences saved for this account on this device.', { exact: true })).toBeVisible();
    assert.ok(await db.user.findUnique({ where: { email } }));
    const cookies = await page.context().cookies();
    assert.ok(cookies.some(cookie => cookie.name === 'agentmart_refresh' && cookie.httpOnly));
    assert.equal(await page.evaluate(() => localStorage.getItem('agentmart-nest-refresh-v1') || sessionStorage.getItem('agentmart-nest-refresh-v1')), null);
    await page.reload();
    await expect(page.getByText('Frontend Buyer', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Preferred city', { exact: true })).toHaveValue('Amaravati');
    await expect(page.getByLabel('Budget ceiling (INR)', { exact: true })).toHaveValue('6000000');
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Buyer login', exact: true })).toBeVisible();
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    const profileLogin = page.waitForResponse(response => response.url() === `${base}/api/v1/auth/login`);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    const profileTokens = await (await profileLogin).json();
    await expect(page).toHaveURL(/\/discover$/);
    await page.getByRole('button', { name: 'Buyer profile', exact: true }).click();
    await page.getByRole('button', { name: 'Switch account' }).click();
    await expect(page.getByRole('button', { name: 'Buyer login', exact: true })).toBeVisible();
    assert.equal((await call('me', { token: profileTokens.accessToken })).status, 401);
    assert.ok(!(await page.context().cookies()).some(cookie => cookie.name === 'agentmart_refresh'));
    await page.goto(`${frontendUrl}/login?workspace=seller&mode=login`);
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    const beforeMismatch = await db.refreshSession.count({ where: { user: { email } } });
    const mismatch = page.waitForResponse(response => response.url() === `${base}/api/v1/auth/login`);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    assert.equal((await mismatch).status(), 403);
    await expect(page.getByText('This is a Buyer account. Use Buyer login.', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/workspace=seller/);
    assert.equal(await db.refreshSession.count({ where: { user: { email } } }), beforeMismatch);
    await page.getByLabel('Email', { exact: true }).fill('seller@example.test');
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/seller$/);
    await page.goto(`${frontendUrl}/login?workspace=seller&mode=login`);
    await expect(page.getByText('Signed in as API Seller', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.goto(`${frontendUrl}/login?workspace=buyer&mode=login`);
    await page.getByLabel('Email', { exact: true }).fill('seller@example.test');
    await page.getByLabel('Password', { exact: true }).fill(password);
    const sellerMismatch = page.waitForResponse(response => response.url() === `${base}/api/v1/auth/login`);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    assert.equal((await sellerMismatch).status(), 403);
    await expect(page.getByText('This is a Seller account. Use Seller login.', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/workspace=buyer/);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    if (child.pid && child.exitCode === null) {
      if (process.platform === 'win32') spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true, timeout: 5000 });
      else { try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Already stopped. */ } }
    }
  }
});

test('login attempts are rate limited', async () => {
  let limited = false;
  for (let i = 0; i < 12; i++) {
    const response = await call('login', { method: 'POST', body: { email: 'rate@example.test', password } });
    if (response.status === 429) { limited = true; break; }
  }
  assert.ok(limited);
});
