import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { authClient, AuthError, type AccountSession, type AccountUser } from './client';

type AuthStore = {
  session: AccountSession | null; restoring: boolean; connectionError: string;
  signIn: (create: boolean, values: { name: string; email: string; password: string; role: AccountUser['role'] }) => Promise<AccountSession>;
  signOut: () => Promise<void>; refresh: () => Promise<void>;
};
const Context = createContext<AuthStore | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AccountSession | null>(null);
  const [restoring, setRestoring] = useState(true), [connectionError, setConnectionError] = useState('');
  const generation = useRef(0);
  useEffect(() => {
    let active = true;
    const operation = ++generation.current;
    void authClient.restore().then(next => { if (active && operation === generation.current) setSession(next); })
      .catch(error => { if (active) setConnectionError((error as Error).message); })
      .finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => {
      const operation = generation.current;
      void authClient.restore().then(next => { if (operation === generation.current) setSession(next); })
        .catch(error => { if (operation === generation.current) setConnectionError((error as Error).message); });
    }, Math.max(0, session.expiresAt - Date.now() - 30000));
    return () => clearTimeout(timer);
  }, [session]);

  async function refresh() {
    try { setSession(await authClient.me()); setConnectionError(''); }
    catch (error) { if (error instanceof AuthError && error.status === 401) setSession(null); throw error; }
  }
  return <Context.Provider value={{ session, restoring, connectionError, refresh,
    signIn: async (create, values) => { generation.current++; const next = await authClient.signIn(create, values); setSession(next); setConnectionError(''); return next; },
    signOut: async () => { await authClient.signOut(); generation.current++; setSession(null); setConnectionError(''); },
  }}>{children}</Context.Provider>;
}
export function useAuth() { const store = useContext(Context); if (!store) throw Error('AuthProvider is missing.'); return store; }
