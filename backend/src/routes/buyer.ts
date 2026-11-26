// Request/Response handler shared by the Worker route and the HTTP integration tests.
// Only the explicit public listing projection below may leave the seller workspace.
import { propertyDetailLabels } from '../../../frontend/shared/property-fields';
type Database = Pick<D1Database, 'prepare' | 'batch'>;
type User = { id: string; email: string; name: string };
type UserRow = User & { password_hash: string; salt: string };
type PropertyRow = { id: string; workspace_id: string; payload: string };
type State = { saved: string[]; compared: string[]; drafts: { id: string; propertyId: string; message: string; created: string }[] };
const emptyState = (): State => ({ saved: [], compared: [], drafts: [] });
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const digest = async (text: string) => hex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
const fail = (message: string, status = 400): never => { throw Object.assign(new Error(message), { status }); };
const publicWhere = "kind='property' AND json_extract(payload,'$.published')=1 AND json_extract(payload,'$.status')='Available'";

async function passwordHash(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 100000 }, key, 256));
}
function equal(a: string, b: string) {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return difference === 0;
}
function text(value: unknown, label: string, max: number, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) fail(`${label} must contain ${min}–${max} characters.`);
  return (value as string).trim();
}
async function body(req: Request): Promise<Record<string, unknown>> {
  if (!req.headers.get('content-type')?.startsWith('application/json')) fail('Use application/json.', 415);
  const reader = req.body?.getReader();
  if (!reader) fail('A JSON body is required.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader!.read();
    if (done) break;
    length += value.length;
    if (length > 65536) { await reader!.cancel(); fail('Request exceeds 64 KiB.', 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let result;
  try { result = JSON.parse(new TextDecoder().decode(bytes)); } catch { fail('Invalid JSON.'); }
  if (!result || typeof result !== 'object' || Array.isArray(result)) fail('Expected a JSON object.');
  return result;
}
function validateState(value: Record<string, unknown>): State {
  function ids(input: unknown, max: number): string[] {
    if (!Array.isArray(input) || input.length > max || input.some(id => typeof id !== 'string' || !id || id.length > 100)) fail(`Expected up to ${max} property IDs.`);
    return [...new Set(input as string[])];
  }
  if (!Array.isArray(value.drafts) || value.drafts.length > 100) fail('Expected up to 100 drafts.');
  const drafts = (value.drafts as Record<string, unknown>[]).map(d => {
    if (!d || typeof d !== 'object') fail('Invalid draft.');
    const created = text(d.created, 'Draft date', 40);
    if (!Number.isFinite(Date.parse(created))) fail('Invalid draft date.');
    return { id: text(d.id, 'Draft ID', 100), propertyId: text(d.propertyId, 'Property ID', 100), message: text(d.message, 'Message', 2000), created };
  });
  if (new Set(drafts.map(d => d.id)).size !== drafts.length) fail('Draft IDs must be unique.');
  return { saved: ids(value.saved, 200), compared: ids(value.compared, 3), drafts };
}
function listing(row: PropertyRow) {
  const p = JSON.parse(row.payload);
  const string = (value: unknown, max = 250) => typeof value === 'string' ? value.slice(0, max) : '';
  const number = (value: unknown) => value !== null && value !== '' && value !== undefined && Number.isFinite(Number(value)) ? Number(value) : undefined;
  const insights = Object.fromEntries(Object.keys(propertyDetailLabels).map(key => [key, typeof p.insights?.[key] === 'number' && Number.isFinite(p.insights[key]) ? p.insights[key] : string(p.insights?.[key])]));
  const amenities = Array.isArray(p.insights?.amenities) ? p.insights.amenities : typeof p.amenities === 'string' ? p.amenities.split(',') : Array.isArray(p.amenities) ? p.amenities : [];
  const coordinates = p.geoConfirmed === true && number(p.lat) !== undefined && number(p.lon) !== undefined && Math.abs(Number(p.lat)) <= 85 && Math.abs(Number(p.lon)) <= 180;
  return { id: row.id, title: p.title, type: p.type, purpose: p.purpose, price: Number(p.price), area: Number(p.area), unit: p.unit,
    city: p.city, locality: p.village, facing: p.facing || 'Not specified', bedrooms: number(p.bhk ?? p.bedrooms),
    district: string(p.district), mandal: string(p.mandal), plotCode: string(p.plotCode), survey: string(p.survey), approval: string(p.approval), seller: string(p.seller), road: number(p.road),
    latitude: coordinates ? Number(p.lat) : undefined, longitude: coordinates ? Number(p.lon) : undefined,
    photo: typeof p.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,[a-z\d+/=]+$/i.test(p.photo) && p.photo.length <= 700000 ? p.photo : undefined,
    insights, amenities: amenities.filter((value: unknown) => typeof value === 'string').slice(0, 20).map((value: string) => value.trim().slice(0, 100)).filter(Boolean),
    description: typeof p.description === 'string' ? p.description : '',
    highlights: Array.isArray(p.highlights) ? p.highlights.filter((x: unknown) => typeof x === 'string').slice(0, 20) : [] };
}

export function createBuyerHandler(db: Database | undefined, options: { origins?: string[] } = {}) {
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url), origin = req.headers.get('origin');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname);
    let allowed = !origin || origin === url.origin || (options.origins || []).includes(origin);
    try { if (local && url.protocol === 'http:' && origin && new URL(origin).hostname === url.hostname && new URL(origin).protocol === 'http:') allowed = true; } catch { /* Invalid origin is rejected. */ }
    const headers: Record<string, string> = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };
    if (allowed && origin) headers['Access-Control-Allow-Origin'] = origin;
    const json = (data: unknown, status = 200) => Response.json(data, { status, headers });
    try {
      if (!allowed) fail('Origin is not allowed.', 403);
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '600' } });
      if (!db) fail('Database is not configured.', 503);
      const database = db!;
      const path = url.pathname.replace(/^\/api\/buyer\//, '').replace(/\/$/, '');
      const now = Date.now();
      async function limit(key: string, maximum: number) {
        const hashed = await digest(key);
        const row = await database.prepare('INSERT INTO buyer_rate_limits(key,attempts,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires<=? THEN 1 ELSE attempts+1 END, expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING attempts').bind(hashed, now + 900000, now, now).first<{ attempts: number }>();
        if ((row?.attempts || 0) > maximum) { headers['Retry-After'] = '900'; fail('Too many attempts. Try again in 15 minutes.', 429); }
      }
      async function session() {
        const token = req.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
        if (!token) fail('Sign in to your Buyer account.', 401);
        const hash = await digest(token!);
        const user = await database.prepare('SELECT u.id,u.email,u.name FROM buyer_sessions s JOIN buyer_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?').bind(hash, now).first<User>();
        if (!user) fail('Your session expired. Sign in again.', 401);
        return { user: user!, hash };
      }
      async function issue(user: User) {
        const token = random(), expires = now + 7 * 86400000;
        await database.batch([
          database.prepare('DELETE FROM buyer_sessions WHERE expires<=?').bind(now),
          database.prepare('DELETE FROM buyer_rate_limits WHERE expires<=?').bind(now),
          database.prepare('INSERT INTO buyer_sessions(token_hash,user_id,expires) VALUES(?,?,?)').bind(await digest(token), user.id, expires),
          database.prepare('INSERT OR IGNORE INTO buyer_state(user_id,payload,version) VALUES(?,?,0)').bind(user.id, JSON.stringify(emptyState())),
        ]);
        return { token, expires, user: { id: user.id, email: user.email, name: user.name } };
      }
      if (path === 'health' && req.method === 'GET') {
        await database.prepare('SELECT id FROM buyer_users LIMIT 1').first();
        return json({ ok: true });
      }
      if (['auth/register', 'auth/login'].includes(path) && req.method === 'POST') {
        // CF supplies this header in production; no caller-controlled X-Forwarded-For.
        await limit(`auth-ip:${req.headers.get('cf-connecting-ip') || 'local'}`, 50);
        const b = await body(req), email = text(b.email, 'Email', 254).toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Enter a valid email.');
        if (typeof b.password !== 'string' || b.password.length < 12 || b.password.length > 128) fail('Password must contain 12–128 characters.');
        await limit(`auth-email:${email}`, 10);
        if (path === 'auth/register') {
          const name = text(b.name, 'Name', 100), id = crypto.randomUUID(), salt = random();
          const password = await passwordHash(b.password as string, salt);
          const result = await database.prepare('INSERT OR IGNORE INTO buyer_users(id,email,name,password_hash,salt,created) VALUES(?,?,?,?,?,?)').bind(id, email, name, password, salt, new Date(now).toISOString()).run();
          if (!result.meta.changes) fail('An account with this email already exists.', 409);
          return json(await issue({ id, name, email }), 201);
        }
        const user = await database.prepare('SELECT * FROM buyer_users WHERE email=?').bind(email).first<UserRow>();
        const candidate = await passwordHash(b.password as string, user?.salt || 'unknown-user-fixed-salt');
        if (!user || !equal(candidate, user.password_hash)) fail('Email or password is incorrect.', 401);
        return json(await issue(user!));
      }
      if (path === 'listings' && req.method === 'GET') {
        const limitValue = Number(url.searchParams.get('limit') || 50), offset = Number(url.searchParams.get('offset') || 0);
        if (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > 100 || !Number.isInteger(offset) || offset < 0 || offset > 100000) fail('Invalid pagination.');
        const rows = await database.prepare(`SELECT id,workspace_id,payload FROM seller_records WHERE ${publicWhere} ORDER BY updated DESC,id LIMIT ? OFFSET ?`).bind(limitValue + 1, offset).all<PropertyRow>();
        return json({ listings: rows.results.slice(0, limitValue).map(listing), nextOffset: rows.results.length > limitValue ? offset + limitValue : null });
      }
      const { user, hash } = await session();
      if (path === 'auth/me' && req.method === 'GET') return json({ user });
      if (path === 'auth/logout' && req.method === 'POST') {
        await database.prepare('DELETE FROM buyer_sessions WHERE token_hash=?').bind(hash).run();
        return json({ ok: true });
      }
      if (path === 'state' && req.method === 'GET') {
        const row = await database.prepare('SELECT payload,version FROM buyer_state WHERE user_id=?').bind(user.id).first<{ payload: string; version: number }>();
        return json({ ...JSON.parse(row?.payload || JSON.stringify(emptyState())), version: row?.version || 0 });
      }
      if (path === 'state' && req.method === 'PUT') {
        const b = await body(req), state = validateState(b);
        if (!Number.isInteger(b.version) || Number(b.version) < 0) fail('State version is required.');
        const result = await database.prepare('UPDATE buyer_state SET payload=?,version=version+1 WHERE user_id=? AND version=?').bind(JSON.stringify(state), user.id, b.version).run();
        if (!result.meta.changes) fail('Your account changed on another device. Refresh before saving.', 409);
        return json({ ...state, version: Number(b.version) + 1 });
      }
      if (path === 'enquiries' && req.method === 'GET') {
        const rows = await database.prepare("SELECT b.id,b.property_id,b.created,r.payload FROM buyer_enquiries b LEFT JOIN seller_records r ON r.id=b.id AND r.kind='enquiry' WHERE b.buyer_id=? ORDER BY b.created DESC LIMIT 100").bind(user.id).all<{ id: string; property_id: string; created: string; payload: string | null }>();
        return json({ enquiries: rows.results.map(row => { const p = JSON.parse(row.payload || '{}'); return { id: row.id, propertyId: row.property_id, created: row.created, message: p.buyerMessage || '', status: p.status || 'Closed', stage: p.stage || '' }; }) });
      }
      if (path === 'enquiries' && req.method === 'POST') {
        const b = await body(req), requestId = text(b.requestId, 'Request ID', 100), propertyId = text(b.propertyId, 'Property ID', 100), message = text(b.message, 'Message', 2000);
        const previous = await database.prepare('SELECT id,property_id FROM buyer_enquiries WHERE buyer_id=? AND request_id=?').bind(user.id, requestId).first<{ id: string; property_id: string }>();
        if (previous) { if (previous.property_id !== propertyId) fail('Request ID already used for another property.', 409); return json({ id: previous.id }, 200); }
        await limit(`enquiry:${user.id}`, 20);
        const property = await database.prepare(`SELECT id,workspace_id,payload FROM seller_records WHERE id=? AND ${publicWhere}`).bind(propertyId).first<PropertyRow>();
        if (!property) fail('This property is no longer available.', 404);
        const p = JSON.parse(property!.payload), id = crypto.randomUUID(), created = new Date(now).toISOString();
        const payload = { name: user.name, email: user.email, buyerId: user.id, buyerMessage: message, propertyId, status: 'Pending', stage: 'New interest', source: 'AgentMart Buyer', assignedTo: p.assignedTo || '', phone: '', note: '', nextAt: '', history: [], messages: [{ body: message, sender: user.id, at: created }] };
        await database.batch([
          database.prepare(`INSERT INTO seller_records(id,workspace_id,kind,payload,version,created,updated) SELECT ?,workspace_id,'enquiry',?,1,?,? FROM seller_records WHERE id=? AND ${publicWhere}`).bind(id, JSON.stringify(payload), created, created, propertyId),
          database.prepare('INSERT INTO buyer_enquiries(id,buyer_id,request_id,property_id,created) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM seller_records WHERE id=?)').bind(id, user.id, requestId, propertyId, created, id),
        ]);
        const inserted = await database.prepare('SELECT id FROM buyer_enquiries WHERE id=?').bind(id).first();
        if (!inserted) fail('This property is no longer available.', 404);
        return json({ id }, 201);
      }
      return fail('Endpoint not found.', 404);
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (!status) console.error('Buyer API failed:', error);
      return json({ error: status ? (error as Error).message : 'Backend unavailable. Check database migrations and try again.' }, status || 503);
    }
  };
}
