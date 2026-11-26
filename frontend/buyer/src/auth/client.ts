import { Platform } from 'react-native';
import { sellerAddress } from '../seller/config';
import { authStorage } from './storage';

export type AccountUser = { id: string; name: string; email: string; role: 'BUYER' | 'SELLER' };
export type AccountSession = { accessToken: string; expiresAt: number; user: AccountUser; refreshToken?: string };
export class AuthError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
let current: AccountSession | null = null;
let refreshFlight: Promise<AccountSession | null> | null = null;
let epoch = 0;
const web = Platform.OS === 'web';

function address(path: string) {
  const configured = process.env.EXPO_PUBLIC_AUTH_API_URL;
  if (configured) return `${configured.replace(/\/$/, '')}/auth/${path}`;
  if (!__DEV__) throw new Error('The account service is not configured for this build.');
  const base = new URL(sellerAddress().url);
  base.port = '4000'; base.pathname = `/api/v1/auth/${path}`; base.search = ''; base.hash = '';
  return base.toString();
}

async function request<T>(path: string, options: { body?: unknown; token?: string; method?: string } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(address(path), {
      method: options.method || (options.body !== undefined ? 'POST' : 'GET'), signal: controller.signal,
      credentials: web ? 'include' : 'omit',
      headers: { 'X-Auth-Client': web ? 'web' : 'native', ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
    let data;
    try { data = await response.json(); } catch { throw new AuthError('The account service returned an unexpected response.', response.status); }
    if (!response.ok) throw new AuthError(Array.isArray(data.message) ? data.message.join('. ') : data.message || 'Account request failed.', response.status);
    return data as T;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new Error('Cannot reach the account service. Check your connection and keep the backend running.');
  } finally { clearTimeout(timer); }
}

async function remember(session: AccountSession, operation: number) {
  if (operation !== epoch) return null;
  if (!web && session.refreshToken) await authStorage.set(session.refreshToken);
  if (operation !== epoch) return null;
  current = session;
  return session;
}

async function refresh(): Promise<AccountSession | null> {
  if (refreshFlight) return refreshFlight;
  const operation = epoch;
  refreshFlight = (async () => {
    const refreshToken = web ? undefined : current?.refreshToken || await authStorage.get();
    if (!web && !refreshToken) return null;
    try {
      const session = await request<AccountSession>('refresh', { body: web ? {} : { refreshToken } });
      return await remember(session, operation);
    } catch (error) {
      if (error instanceof AuthError && error.status === 401 && operation === epoch) { current = null; await authStorage.remove(); return null; }
      throw error;
    }
  })().finally(() => { refreshFlight = null; });
  return refreshFlight;
}

async function authenticated<T>(path: string, method = 'GET'): Promise<T> {
  if (!current || current.expiresAt <= Date.now() + 5000) await refresh();
  if (!current) throw new AuthError('Sign in to continue.', 401);
  try { return await request<T>(path, { token: current.accessToken, method }); }
  catch (error) {
    if (!(error instanceof AuthError) || error.status !== 401) throw error;
    const next = await refresh();
    if (!next) throw new AuthError('Your session expired. Sign in again.', 401);
    return request<T>(path, { token: next.accessToken, method });
  }
}

export const authClient = {
  restore: refresh,
  async signIn(create: boolean, values: { name: string; email: string; password: string; role: AccountUser['role'] }) {
    const operation = ++epoch;
    const body = create ? values : { email: values.email, password: values.password, role: values.role };
    const session = await request<AccountSession>(create ? 'register' : 'login', { body });
    const saved = await remember(session, operation);
    if (!saved) throw new Error('Account request was replaced. Please try again.');
    return saved;
  },
  async me() {
    const response = await authenticated<{ user: AccountUser }>('me');
    return current ? { ...current, user: response.user } : null;
  },
  async signOut() {
    try { await authenticated('logout', 'POST'); }
    catch (error) { if (!(error instanceof AuthError) || error.status !== 401) throw error; }
    epoch++; current = null; await authStorage.remove();
  },
};
