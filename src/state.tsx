import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { listings } from './data/listings';

type Draft = { id: string; propertyId: string; message: string; created: string };
type Data = { saved: string[]; compared: string[]; drafts: Draft[] };
type Store = Data & { ready: boolean; notice: string; dismiss: () => void; save: (id: string) => void; compare: (id: string) => void; addDraft: (id: string, message: string) => void; deleteDraft: (id: string) => void };
const initial: Data = { saved: [], compared: [], drafts: [] };
const key = 'agentmart-buyer-expo-v1';
const Context = createContext<Store | null>(null);

export function BuyerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(initial);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const pendingWrite = useRef(Promise.resolve());
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(key).then(raw => {
      if (!raw || !mounted) return;
      const value = JSON.parse(raw);
      const valid = (id: unknown): id is string => typeof id === 'string' && listings.some(p => p.id === id);
      setData({ saved: Array.isArray(value.saved) ? value.saved.filter(valid) : [], compared: Array.isArray(value.compared) ? value.compared.filter(valid).slice(0, 3) : [], drafts: Array.isArray(value.drafts) ? value.drafts.filter((d: Draft) => d && typeof d.id === 'string' && valid(d.propertyId) && typeof d.message === 'string' && typeof d.created === 'string') : [] });
    }).catch(() => { if (mounted) setNotice('Saved data could not be loaded on this device.'); }).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    // Serialize writes so quick taps cannot overwrite a newer shortlist.
    pendingWrite.current = pendingWrite.current.then(() => AsyncStorage.setItem(key, JSON.stringify(data))).catch(() => { setNotice('Changes could not be saved on this device.'); });
  }, [data, ready]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6000); return () => clearTimeout(timer); }, [notice]);

  function save(id: string) { if (ready) setData(old => ({ ...old, saved: old.saved.includes(id) ? old.saved.filter(x => x !== id) : [...old.saved, id] })); }
  function compare(id: string) {
    if (!ready) return;
    if (!data.compared.includes(id) && data.compared.length >= 3) { setNotice('Compare up to three properties. Remove one to add another.'); return; }
    setData(old => ({ ...old, compared: old.compared.includes(id) ? old.compared.filter(x => x !== id) : [...old.compared, id].slice(0, 3) }));
  }
  function addDraft(propertyId: string, message: string) {
    if (!ready || !message.trim()) return;
    setData(old => ({ ...old, drafts: [{ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, propertyId, message: message.trim().slice(0, 2000), created: new Date().toISOString() }, ...old.drafts] }));
    setNotice('Draft saved on this device. It has not been sent.');
  }
  return <Context.Provider value={{ ...data, ready, notice, dismiss: () => setNotice(''), save, compare, addDraft, deleteDraft: id => setData(old => ({ ...old, drafts: old.drafts.filter(d => d.id !== id) })) }}>{children}</Context.Provider>;
}

export function useBuyer() { const store = useContext(Context); if (!store) throw Error('BuyerProvider is missing'); return store; }
