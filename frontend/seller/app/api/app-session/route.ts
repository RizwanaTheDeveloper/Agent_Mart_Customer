import { env } from 'cloudflare:workers';
import { authApiFor, cookieHeader, signSession } from '../../app-session';

export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra } });

// Exchange an AgentMart app access token (seller role) for a Seller Studio session cookie.
export async function POST(request: Request) {
  const url = new URL(request.url), host = request.headers.get('host') || url.host;
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== host && !(env as any)?.ALLOWED_ORIGINS?.split(',').includes(origin)) return json({ error: 'Origin not allowed.' }, 403);
  let token = '';
  try { token = String(((await request.json()) as any).token || ""); } catch { /* handled below */ }
  if (!token) return json({ error: 'Missing token.' }, 400);
  const api = authApiFor(env as any, host);
  if (!api) return json({ error: 'Seller sign-in is not configured on this server.' }, 503);
  let me: any;
  try {
    const r = await fetch(`${api}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return json({ error: 'Your session has expired. Sign in again.' }, 401);
    me = ((await r.json()) as any).user;
  } catch { return json({ error: 'Cannot reach the account service.' }, 502); }
  if (!me?.id || !me?.email) return json({ error: 'Invalid account.' }, 401);
  if (me.role !== 'SELLER') return json({ error: 'This account is not a seller account.' }, 403);
  try {
    const value = await signSession({ userId: 'app_' + me.id, email: me.email, displayName: me.name || me.email, fullName: me.name || null }, env as any, host);
    return json({ ok: true }, 200, { 'set-cookie': cookieHeader(value, host, url.protocol === 'https:') });
  } catch (e: any) { return json({ error: e.message }, 503); }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url), host = request.headers.get('host') || url.host;
  return json({ ok: true }, 200, { 'set-cookie': cookieHeader('', host, url.protocol === 'https:', true) });
}
