import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform, Share } from 'react-native';
import { mapProvider } from './maps';
import { router } from 'expo-router';
import { planningRequest } from '../master-plan/api';
import { publishedListings } from '../api';

export const storageKey = 'agentmart-apk-buyer-tools-v45';
type Message = { type: string; data: Record<string, unknown> };
type Reply = (id: string, result: unknown) => void;

const sources: Record<string, string> = {
  '/crda-query': 'https://gis.apcrda.org/server/rest/services/LSP19Aug2026/MapServer/0/query',
  '/development-query': 'https://gis.apcrda.org/server/rest/services/LPS_Portal/MapServer/13/query',
  '/nearby-query': 'https://overpass-api.de/api/interpreter',
};

export function createToolsBridge(reply: Reply, onError: (message: string) => void) {
  let writes = Promise.resolve();
  const controllers = new Set<AbortController>();
  let disposed = false;
  async function receive(message: Message) {
    if (disposed || !message || typeof message.type !== 'string' || !message.data) return;
    const d = message.data;
    if (message.type === 'storage') {
      // A separate namespace preserves existing Buyer saved/compare/drafts data.
      const entries = Object.entries(d);
      if (entries.length > 500 || entries.some(([k, v]) => k.length > 200 || typeof v !== 'string')) return;
      const json = JSON.stringify(d);
      if (json.length > 8_000_000) { onError('Buyer tools storage is full. Export unused reference records.'); return; }
      writes = writes.then(() => AsyncStorage.setItem(storageKey, json)).catch(() => onError('Could not save Buyer tools data on this device.'));
      return;
    }
    if (message.type === 'error') { onError(String(d.message)); return; }
    if (message.type === 'share') {
      if (Platform.OS === 'web') {
        // Web Share requires a transient click, which postMessage does not retain.
        // An explicit text download preserves exports in desktop browsers.
        const text = String(d.text || '');
        let extension = 'txt';
        try { JSON.parse(text); extension = 'json'; } catch { if (String(d.title).includes('CSV')) extension = 'csv'; }
        const mime = extension === 'json' ? 'application/json' : extension === 'csv' ? 'text/csv' : 'text/plain';
        const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${String(d.title || 'buyer-tools').replace(/[^a-zA-Z0-9 -]/g, '').slice(0,80)}.${extension}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
      try { await Share.share({ title: String(d.title || 'Buyer tools'), message: String(d.text || '') }); }
      catch { onError('Sharing was unavailable. Please try again.'); }
      return;
    }
    if (message.type === 'link') {
      const url = String(d.url || '');
      if (!/^(https:\/\/|tel:\+?[\d -]+$|mailto:)/i.test(url)) return;
      try { await Linking.openURL(url); } catch { onError('Could not open this link.'); }
      return;
    }
    if (message.type === 'open-property') {
      // Opens a published property in the Buyer app from a map pin.
      if (typeof d.id === 'string' && d.id.length < 100) router.push({ pathname: '/property/[id]', params: { id: d.id } });
      return;
    }
    if (!['api', 'source', 'tile', 'planning', 'published'].includes(message.type) || typeof d.id !== 'string') return;
    const controller = new AbortController();
    controllers.add(controller);
    const timer = setTimeout(() => controller.abort(), ['tile', 'planning'].includes(message.type) ? 20000 : 100000);
    try {
      if (message.type === 'published') {
        // Only listings the sellers have published (Available + Published) reach the Buyer map.
        const listings = (await publishedListings()).map(p => ({ id: p.id, title: p.title, type: p.type, price: p.price, city: p.city, village: p.locality, lat: p.latitude, lon: p.longitude }));
        if (!disposed) reply(d.id, { listings });
        return;
      }
      if (message.type === 'planning') {
        const data = await planningRequest(d, controller.signal);
        if (!disposed) reply(d.id, { status: 200, data });
        return;
      }
      if (message.type === 'tile') {
        const { z, x, y } = d;
        if (Platform.OS !== 'web' || typeof z !== 'number' || typeof x !== 'number' || typeof y !== 'number' || ![z,x,y].every(Number.isInteger) || z < 0 || z > 19 || x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) throw Error('Invalid map tile.');
        const response = await fetch(`${mapProvider.origin}/${z}/${x}/${y}.png`, { signal: controller.signal, cache: 'default', credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin' });
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/png')) throw Error('Map tiles are temporarily unavailable.');
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length > 512000) throw Error('Invalid map tile response.');
        let binary = '';
        for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        if (!disposed) reply(d.id, { image: `data:image/png;base64,${btoa(binary)}` });
        return;
      }
      let url: string;
      let options: RequestInit = { signal: controller.signal };
      if (message.type === 'source') {
        const path = String(d.path || '');
        const index = path.indexOf('?');
        const endpoint = sources[path.slice(0, index)];
        if (!endpoint || path.length > 20000) throw Error('Unsupported public source request.');
        url = endpoint + path.slice(index);
      } else {
        const origin = new URL(String(d.origin));
        const path = String(d.path);
        if (origin.protocol !== 'https:' || origin.origin !== d.origin || !/^\/api\/[a-zA-Z0-9/?&=._%+-]+$/.test(path) || path.includes('..')) throw Error('Use a compatible HTTPS backend origin.');
        const method = String(d.method);
        if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) throw Error('Unsupported request method.');
        url = origin.origin + path;
        options = { ...options, method, headers: { 'Content-Type': 'application/json', ...(d.token ? { Authorization: `Bearer ${String(d.token)}` } : {}), ...(d.key ? { 'Idempotency-Key': String(d.key) } : {}) }, body: method === 'GET' ? undefined : JSON.stringify(d.body || {}), redirect: 'error', credentials: 'omit' };
      }
      const response = await fetch(url, options);
      const text = await response.text();
      if (text.length > 8_000_000) throw Error('Source response is too large. Narrow your search.');
      const data = JSON.parse(text);
      if (!disposed) reply(d.id, { status: response.status, data });
    } catch (error) {
      if (!disposed) reply(d.id, { error: message.type === 'planning' && controller.signal.aborted ? 'APCRDA source timed out. Try again.' : error instanceof Error ? error.message : 'Connection failed. Check your server and network.' });
    } finally { clearTimeout(timer); controllers.delete(controller); }
  }
  return { receive, dispose: () => { disposed = true; controllers.forEach(controller => controller.abort()); } };
}
