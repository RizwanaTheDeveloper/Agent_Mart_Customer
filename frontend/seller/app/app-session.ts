// Lets a seller who signed in with the AgentMart app (email + password) open Seller Studio
// without a second sign-in. The app's access token is verified against the account service,
// then exchanged for a short signed cookie that Seller Studio's API accepts.
export const APP_COOKIE = 'am_seller';
const MAX_AGE = 60 * 60 * 24 * 7;
const LOCAL = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

type Env = Record<string, any> | undefined;
export type AppUser = { userId: string; email: string; displayName: string; fullName: string | null };

// Development hosts: loopback, plus private network addresses so a phone on the same Wi-Fi (Expo Go) can sign in.
// A hosted deployment uses a public domain, so it must set SESSION_SECRET and AUTH_API_URL.
const PRIVATE_NETWORK = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/;
export const isLocal = (host: string) => { const name = host.split(':')[0].toLowerCase(); return LOCAL.has(name) || PRIVATE_NETWORK.test(name) || host.startsWith('[::1]'); };
const secretFor = (env: Env, host: string) => env?.SESSION_SECRET || (isLocal(host) ? 'agentmart-local-dev-session-secret' : '');
export const authApiFor = (env: Env, host: string) => String(env?.AUTH_API_URL || (isLocal(host) ? 'http://localhost:4000/api/v1' : '')).replace(/\/$/, '');

const enc = new TextEncoder();
const b64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes as ArrayBuffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function key(secret: string) { return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']); }

export async function signSession(user: AppUser, env: Env, host: string) {
  const secret = secretFor(env, host);
  if (!secret) throw new Error('Seller sign-in is not configured on this server.');
  const body = b64(enc.encode(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + MAX_AGE })));
  return `${body}.${b64(await crypto.subtle.sign('HMAC', await key(secret), enc.encode(body)))}`;
}

export async function readSession(cookieHeader: string | null, env: Env, host: string): Promise<AppUser | null> {
  const secret = secretFor(env, host);
  const raw = cookieHeader?.split(/;\s*/).find(c => c.startsWith(APP_COOKIE + '='))?.slice(APP_COOKIE.length + 1);
  if (!secret || !raw) return null;
  const [body, sig] = raw.split('.');
  if (!body || !sig) return null;
  try {
    if (!(await crypto.subtle.verify('HMAC', await key(secret), unb64(sig), enc.encode(body)))) return null;
    const data = JSON.parse(new TextDecoder().decode(unb64(body)));
    if (!data.exp || data.exp < Date.now() / 1000 || !data.userId || !data.email) return null;
    return { userId: data.userId, email: data.email, displayName: data.displayName, fullName: data.fullName ?? null };
  } catch { return null; }
}

export function cookieHeader(value: string, host: string, secure: boolean, clear = false) {
  // Cross-site embedding (hosted app inside another origin) needs SameSite=None, which requires Secure.
  const attrs = [`${APP_COOKIE}=${clear ? '' : value}`, 'Path=/', 'HttpOnly', `Max-Age=${clear ? 0 : MAX_AGE}`, secure ? 'SameSite=None' : 'SameSite=Lax'];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}
