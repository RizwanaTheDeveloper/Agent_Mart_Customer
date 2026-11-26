import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Miniflare } from 'miniflare';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const source = ['src/lib/access.ts', 'src/lib/constants.ts', '../frontend/shared/property-fields.ts', 'src/routes/buyer.ts', 'src/routes/workspace.ts', 'src/routes/research.ts'].map(file => readFileSync(new URL(file, root), 'utf8').replace(/^import .*\r?\n/gm, '')).join('\n');
const script = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText + '\nexport default {fetch(request,env){const path=new URL(request.url).pathname;if(path==="/api/workspace"){const auth=async()=>request.headers.get("x-test-seller")?{userId:request.headers.get("x-test-seller"),email:"seller@example.test",displayName:"Test Seller"}:null;const handlers=createWorkspaceHandler(env,auth);return handlers[request.method](request);}if(path==="/api/research")return createResearchHandler(async()=>null)(request);return createBuyerHandler(env.DB)(request)}};';
const persist = fileURLToPath(new URL(`outputs/buyer-tests-${crypto.randomUUID()}/`, root));
mkdirSync(persist, { recursive: true });
const options = { modules: true, script, compatibilityDate: '2026-05-15', d1Databases: { DB: 'buyer-test-db' }, d1Persist: persist };
let mf, db, account, second;
async function call(path, { method = 'GET', token, body, headers = {} } = {}) {
  const response = await mf.dispatchFetch(`http://localhost:5173/api/buyer/${path}`, { method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, headers: response.headers, data: response.status === 204 ? null : await response.json() };
}
const credentials = { name: 'Buyer One', email: 'one@example.test', password: 'a-long-test-password-123' };
before(async () => {
  mf = new Miniflare(options);
  db = await mf.getD1Database('DB');
  for (const file of ['scripts/sql/bootstrap-seller.sql', 'migrations/0001_buyer_backend.sql']) {
    const sql = readFileSync(new URL(file, root), 'utf8').replaceAll('--> statement-breakpoint', '');
    await db.batch(sql.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  }
  const property = { title: 'Public plot', type: 'Plot', purpose: 'Sale', price: 1000000, area: 200, unit: 'sq yd', city: 'Guntur', village: 'Test village', published: true, status: 'Available', assignedTo: 'agent-one', phone: '9999999999', confidential: 'PRIVATE', description: 'Public description', bhk: 3, district: 'Guntur', mandal: 'Test mandal', plotCode: 'TEST-PLOT', road: 12, lat: 16.52, lon: 80.46, geoConfirmed: true, insights: { projectName: 'Public project', carpetArea: 850, landUse: 'Residential', amenities: ['Water', 'Power'], phone: '9999999999', privateNotes: 'PRIVATE' }, privateNotes: 'PRIVATE', checkStatus: { title: 'Private review' } };
  const insert = (id, kind, payload) => db.prepare('INSERT INTO seller_records(id,workspace_id,kind,payload,version,created,updated) VALUES(?,?,?,?,1,?,?)').bind(id, 'seller-one', kind, JSON.stringify(payload), '2026-11-24T00:00:00Z', '2026-11-24T00:00:00Z');
  await db.batch([insert('public-one', 'property', property), insert('public-two', 'property', { ...property, title: 'Second listing', geoConfirmed: false }), insert('private-one', 'property', { ...property, published: false }), insert('sold-one', 'property', { ...property, status: 'Sold' }), insert('private-document', 'document', { objectKey: 'secret', filename: 'deed.pdf' })]);
  account = (await call('auth/register', { method: 'POST', body: credentials })).data;
  second = (await call('auth/register', { method: 'POST', body: { ...credentials, name: 'Buyer Two', email: 'two@example.test' } })).data;
  assert.ok(account.token); assert.ok(second.token);
});
after(async () => { await mf?.dispose(); });

test('health confirms the buyer migration exists', async () => {
  assert.equal((await call('health')).status, 200);
});
test('only available, published listings and public fields are exposed', async () => {
  const result = await call('listings');
  assert.equal(result.status, 200);
  assert.deepEqual(result.data.listings.map(p => p.id), ['public-one', 'public-two']);
  assert.equal(result.data.listings[0].locality, 'Test village');
  for (const field of ['phone', 'workspace_id', 'assignedTo', 'confidential', 'objectKey']) assert.equal(result.data.listings[0][field], undefined);
  const details = result.data.listings[0];
  assert.equal(details.bedrooms, 3); assert.equal(details.plotCode, 'TEST-PLOT'); assert.equal(details.insights.projectName, 'Public project'); assert.equal(details.insights.carpetArea, 850);
  assert.equal(details.insights.phone, undefined); assert.equal(details.insights.privateNotes, undefined); assert.equal(details.privateNotes, undefined); assert.equal(details.checkStatus, undefined);
  assert.deepEqual(details.amenities, ['Water', 'Power']); assert.equal(details.latitude, 16.52); assert.equal(result.data.listings[1].latitude, undefined);
  assert.equal((await call('listings?limit=1')).data.nextOffset, 1);
  assert.equal((await call('listings?limit=1&offset=1')).data.nextOffset, null);
  assert.equal((await call('listings?limit=-1')).status, 400);
});
test('registration validates credentials and normalizes email', async () => {
  assert.equal((await call('auth/register', { method: 'POST', body: { ...credentials, email: 'ONE@EXAMPLE.TEST' } })).status, 409);
  assert.equal((await call('auth/register', { method: 'POST', body: { ...credentials, email: 'invalid' } })).status, 400);
  assert.equal((await call('auth/register', { method: 'POST', body: { ...credentials, password: 'short' } })).status, 400);
  const row = await db.prepare('SELECT * FROM buyer_users WHERE id=?').bind(account.user.id).first();
  assert.notEqual(row.password_hash, credentials.password);
  assert.equal(row.password_hash.length, 64);
  const stored = await db.prepare('SELECT token_hash FROM buyer_sessions WHERE user_id=?').bind(account.user.id).first();
  assert.notEqual(stored.token_hash, account.token);
});
test('login rejects wrong passwords and authenticates valid credentials', async () => {
  assert.equal((await call('auth/login', { method: 'POST', body: { ...credentials, password: 'wrong-password-long' } })).status, 401);
  const result = await call('auth/login', { method: 'POST', body: credentials });
  assert.equal(result.status, 200); assert.equal(result.data.user.id, account.user.id);
  assert.equal((await call('auth/me', { token: result.data.token })).data.user.email, credentials.email);
});
test('account endpoints require a valid session', async () => {
  assert.equal((await call('state')).status, 401);
  assert.equal((await call('state', { token: 'a'.repeat(64) })).status, 401);
  assert.equal((await call('auth/me', { token: account.token })).data.user.id, account.user.id);
});
test('state persists, rejects stale writes, and is isolated between accounts', async () => {
  const state = { saved: ['public-one'], compared: ['public-one'], drafts: [{ id: 'draft-one', propertyId: 'public-one', message: 'Questions', created: new Date().toISOString() }], version: 0 };
  assert.equal((await call('state', { method: 'PUT', token: account.token, body: state })).data.version, 1);
  assert.equal((await call('state', { method: 'PUT', token: account.token, body: state })).status, 409);
  assert.deepEqual((await call('state', { token: account.token })).data.saved, ['public-one']);
  assert.deepEqual((await call('state', { token: second.token })).data.saved, []);
  assert.equal((await call('state', { method: 'PUT', token: account.token, body: { ...state, compared: ['1','2','3','4'], version: 1 } })).status, 400);
});
test('enquiries arrive in the correct seller workspace without exposing private seller fields', async () => {
  const payload = { propertyId: 'public-one', message: 'Can I arrange a visit?', requestId: 'request-one' };
  const result = await call('enquiries', { method: 'POST', token: account.token, body: payload });
  assert.equal(result.status, 201);
  const seller = await db.prepare('SELECT * FROM seller_records WHERE id=?').bind(result.data.id).first();
  const enquiry = JSON.parse(seller.payload);
  assert.equal(seller.workspace_id, 'seller-one'); assert.equal(seller.kind, 'enquiry');
  assert.equal(enquiry.assignedTo, 'agent-one'); assert.equal(enquiry.name, credentials.name);
  assert.equal(enquiry.messages[0].body, payload.message);
  assert.equal((await call('enquiries', { method: 'POST', token: account.token, body: payload })).data.id, result.data.id);
  const inbox = (await call('enquiries', { token: account.token })).data.enquiries;
  assert.equal(inbox.length, 1); assert.equal(inbox[0].message, payload.message); assert.equal(inbox[0].note, undefined);
  assert.equal((await call('enquiries', { token: second.token })).data.enquiries.length, 0);
  assert.equal((await call('enquiries', { method: 'POST', token: account.token, body: { ...payload, propertyId: 'public-two' } })).status, 409);
});
test('enquiries reject unavailable properties and invalid messages', async () => {
  for (const id of ['private-one', 'sold-one', 'missing', 'private-document']) assert.equal((await call('enquiries', { method: 'POST', token: account.token, body: { propertyId: id, message: 'Question', requestId: id } })).status, 404);
  assert.equal((await call('enquiries', { method: 'POST', token: account.token, body: { propertyId: 'public-one', message: ' ', requestId: 'empty' } })).status, 400);
});
test('origin checks and preflight allow the local Expo app and reject other websites', async () => {
  const allowed = await call('state', { token: account.token, headers: { Origin: 'http://localhost:8083' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:8083');
  assert.equal((await call('listings', { headers: { Origin: 'https://evil.example' } })).status, 403);
  assert.equal((await call('state', { method: 'OPTIONS', headers: { Origin: 'http://localhost:8083' } })).status, 204);
});
test('oversized and malformed payloads are rejected', async () => {
  assert.equal((await call('state', { method: 'PUT', token: account.token, body: { padding: 'x'.repeat(66000) } })).status, 413);
  const response = await mf.dispatchFetch('http://localhost:5173/api/buyer/state', { method: 'PUT', headers: { Authorization: `Bearer ${account.token}`, 'Content-Type': 'application/json' }, body: '{invalid' });
  assert.equal(response.status, 400);
});
test('database state survives a worker restart', async () => {
  await mf.dispose(); mf = new Miniflare(options); db = await mf.getD1Database('DB');
  assert.deepEqual((await call('state', { token: account.token })).data.saved, ['public-one']);
  assert.equal((await call('enquiries', { token: account.token })).data.enquiries.length, 1);
});
test('moved Seller handlers retain auth, publication and Buyer delivery', async () => {
  const request = async (body, seller = 'test-seller') => {
    const result = await mf.dispatchFetch('http://localhost:5173/api/workspace', { method: body ? 'POST' : 'GET', headers: { ...(seller ? { 'x-test-seller': seller } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: result.status, data: await result.json() };
  };
  assert.equal((await request(null, '')).status, 401);
  assert.equal((await mf.dispatchFetch('http://localhost:5173/api/research')).status, 401);
  const workspace = await request();
  assert.equal(workspace.status, 200);
  assert.equal(workspace.data.user.role, 'owner');
  const property = { title: 'Moved backend property', type: 'Plot', purpose: 'Sale', price: 1000000, area: 200, unit: 'sq yd', city: 'Guntur', village: 'Test village', status: 'Available', assignedTo: 'test-seller' };
  const made = await request({ action: 'save', kind: 'property', data: property });
  assert.equal(made.status, 200);
  assert.equal((await request({ action: 'publish', id: made.data.id, version: 1, published: true, authorized: true })).status, 200);
  assert.ok((await call('listings')).data.listings.some(p => p.id === made.data.id));
  const sent = await call('enquiries', { method: 'POST', token: account.token, body: { propertyId: made.data.id, requestId: 'moved-backend-request', message: 'Does the moved backend work?' } });
  assert.equal(sent.status, 201);
  const records = (await request()).data.records;
  assert.ok(records.some(record => record.id === sent.data.id && record.kind === 'enquiry'));
  assert.equal((await request({ action: 'publish', id: made.data.id, version: 2, published: false }, 'another-seller')).status, 404);
});
test('expired sessions and logged-out tokens cannot be reused', async () => {
  await db.prepare('UPDATE buyer_sessions SET expires=0 WHERE user_id=?').bind(second.user.id).run();
  assert.equal((await call('state', { token: second.token })).status, 401);
  assert.equal((await call('auth/logout', { method: 'POST', token: account.token })).status, 200);
  assert.equal((await call('state', { token: account.token })).status, 401);
});
test('repeated login attempts are rate limited', async () => {
  let result;
  for (let i = 0; i < 11; i++) result = await call('auth/login', { method: 'POST', body: { email: 'rate@example.test', password: credentials.password } });
  assert.equal(result.status, 429); assert.equal(result.headers.get('retry-after'), '900');
});
