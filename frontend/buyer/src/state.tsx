import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { listings as samples, type BuyerListing } from './data/listings';
import { ApiError, buyerApi, publishedListings, type BuyerEnquiry, type BuyerSession } from './api';
import { sessionStorage } from './session-storage';

type Draft = { id: string; propertyId: string; message: string; created: string };
type Data = { saved: string[]; compared: string[]; drafts: Draft[] };
type RemoteState = Data & { version: number };
type Store = Data & {
  ready: boolean; notice: string; dismiss: () => void; save: (id: string) => void; compare: (id: string) => void;
  addDraft: (id: string, message: string) => Promise<void>; deleteDraft: (id: string) => void;
  listings: BuyerListing[]; live: boolean; loading: boolean; connectionError: string; session: BuyerSession | null;
  enquiries: BuyerEnquiry[]; refresh: () => Promise<void>; browse: (live: boolean) => void;
  authenticate: (create: boolean, name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>; sendEnquiry: (propertyId: string, message: string, requestId: string) => Promise<void>;
};
const initial = (): Data => ({ saved: [], compared: [], drafts: [] });
const demoKey = 'agentmart-buyer-expo-v1';
const Context = createContext<Store | null>(null);

export function BuyerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(initial), [ready, setReady] = useState(false);
  const [notice, setNotice] = useState(''), [session, setSession] = useState<BuyerSession | null>(null);
  const [live, setLive] = useState(true), [catalogue, setCatalogue] = useState<BuyerListing[]>([]);
  const [loading, setLoading] = useState(false), [connectionError, setConnectionError] = useState('');
  const [enquiries, setEnquiries] = useState<BuyerEnquiry[]>([]), [hydrated, setHydrated] = useState(false);
  const dataRef = useRef(data), version = useRef(0), generation = useRef(0);
  const queue = useRef(Promise.resolve()), demoData = useRef<Data>(initial());
  const apply = useCallback((next: Data) => { dataRef.current = next; setData(next); }, []);
  const invalidate = useCallback(() => { generation.current++; }, []);

  useEffect(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem(demoKey), sessionStorage.get()]).then(([raw, savedSession]) => {
      if (!active) return;
      if (raw) {
        try {
          const d = JSON.parse(raw), valid = (id: unknown): id is string => typeof id === 'string' && samples.some(p => p.id === id);
          demoData.current = { saved: Array.isArray(d.saved) ? d.saved.filter(valid).slice(0, 200) : [], compared: Array.isArray(d.compared) ? d.compared.filter(valid).slice(0, 3) : [], drafts: Array.isArray(d.drafts) ? d.drafts.filter((x: Draft) => x && typeof x.id === 'string' && valid(x.propertyId) && typeof x.message === 'string' && typeof x.created === 'string').slice(0, 100) : [] };
        } catch { setNotice('Device demo data could not be read.'); }
      }
      if (savedSession) {
        try { const saved = JSON.parse(savedSession); if (typeof saved.token === 'string' && saved.user?.id && saved.expires > Date.now()) { setSession(saved); setLive(true); } } catch { /* Ignore invalid cached session. */ }
      }
    }).catch(() => { if (active) setNotice('Device storage could not be loaded.'); }).finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true); setConnectionError(''); setReady(false);
    try {
      if (!live) { apply(demoData.current); setReady(true); return; }
      const [properties, state, incoming] = await Promise.all([
        publishedListings(),
        session ? buyerApi<RemoteState>('state', { token: session.token }) : Promise.resolve({ ...initial(), version: 0 }),
        session ? buyerApi<{ enquiries: BuyerEnquiry[] }>('enquiries', { token: session.token }) : Promise.resolve({ enquiries: [] }),
      ]);
      if (current !== generation.current) return;
      setCatalogue(properties); apply(state); version.current = state.version; setEnquiries(incoming.enquiries); setReady(true);
    } catch (error) {
      if (current !== generation.current) return;
      setConnectionError((error as Error).message);
      if (error instanceof ApiError && error.status === 401) { setSession(null); await sessionStorage.remove(); }
    } finally { if (current === generation.current) setLoading(false); }
  }, [live, session, apply]);
  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      apply(initial()); setEnquiries([]); setCatalogue([]);
      void refresh();
    });
    return () => { active = false; invalidate(); };
  }, [hydrated, refresh, apply, invalidate]);

  function change(transform: (previous: Data) => Data) {
    if (!ready) return Promise.resolve();
    const current = generation.current;
    const result = queue.current.then(async () => {
      if (current !== generation.current) return;
      const next = transform(dataRef.current);
      if (next.saved.length > 200 || next.drafts.length > 100) throw Error('Your saved properties or drafts limit has been reached.');
      if (live && session) {
        const result = await buyerApi<RemoteState>('state', { method: 'PUT', token: session.token, body: { ...next, version: version.current } });
        if (current !== generation.current) return;
        version.current = result.version; apply(result);
      } else {
        if (!live) { await AsyncStorage.setItem(demoKey, JSON.stringify(next)); demoData.current = next; }
        if (current === generation.current) apply(next);
      }
    });
    queue.current = result.catch(error => { if (current === generation.current) { setNotice((error as Error).message); if (error instanceof ApiError && error.status === 409) void refresh(); } });
    return result;
  }
  async function authenticate(create: boolean, name: string, email: string, password: string) {
    const next = await buyerApi<BuyerSession>(create ? 'auth/register' : 'auth/login', { method: 'POST', body: { name, email, password } });
    try { await sessionStorage.set(JSON.stringify(next)); }
    catch { setNotice('Signed in for this session. Device storage could not remember your login.'); }
    generation.current++; setReady(false); setSession(next); setLive(true);
  }
  async function signOut() {
    if (session) {
      try { await buyerApi('auth/logout', { method: 'POST', token: session.token }); }
      catch { throw Error('Could not sign out on the server. Check your connection and try again.'); }
    }
    await sessionStorage.remove();
    generation.current++; setReady(false); setSession(null); apply(initial()); setEnquiries([]);
  }
  async function sendEnquiry(propertyId: string, message: string, requestId: string) {
    if (!session || !live) throw Error('Sign in to send an enquiry about a published property.');
    const current = generation.current;
    await buyerApi('enquiries', { method: 'POST', token: session.token, body: { propertyId, message, requestId } });
    const result = await buyerApi<{ enquiries: BuyerEnquiry[] }>('enquiries', { token: session.token });
    if (current === generation.current) { setEnquiries(result.enquiries); setNotice('Enquiry sent to the seller.'); }
  }
  function browse(_next: boolean) { /* The sample catalogue was removed: the Buyer app only shows seller-published listings. */ }
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 7000); return () => clearTimeout(timer); }, [notice]);
  return <Context.Provider value={{ ...data, ready, notice, dismiss: () => setNotice(''), session, live, listings: catalogue, loading, connectionError, enquiries, refresh, browse, authenticate, signOut, sendEnquiry,
    save: id => change(old => ({ ...old, saved: old.saved.includes(id) ? old.saved.filter(x => x !== id) : [...old.saved, id] })),
    compare: id => change(old => { if (!old.compared.includes(id) && old.compared.length >= 3) throw Error('Compare up to three properties. Remove one first.'); return { ...old, compared: old.compared.includes(id) ? old.compared.filter(x => x !== id) : [...old.compared, id] }; }),
    addDraft: (propertyId, message) => { if (!message.trim()) return Promise.resolve(); return change(old => ({ ...old, drafts: [{ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, propertyId, message: message.trim().slice(0, 2000), created: new Date().toISOString() }, ...old.drafts] })); },
    deleteDraft: id => change(old => ({ ...old, drafts: old.drafts.filter(d => d.id !== id) })),
  }}>{children}</Context.Provider>;
}
export function useBuyer() { const store = useContext(Context); if (!store) throw Error('BuyerProvider is missing'); return store; }
