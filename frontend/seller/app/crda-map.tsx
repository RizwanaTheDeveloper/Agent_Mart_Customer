'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { masterPlanDocument } from '../../buyer/src/master-plan/document';
import { planningRequest } from '../../buyer/src/master-plan/api';

export default function CrdaMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [channel] = useState(() => `seller-crda-${Math.random().toString(36).slice(2)}`);
  const html = useMemo(() => masterPlanDocument(channel, { lat: latitude, lon: longitude }), [channel, latitude, longitude]);
  useEffect(() => {
    let active = true;
    const controllers = new Set<AbortController>();
    const receive = async (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.channel !== channel) return;
      const { type, data } = event.data;
      if (!['planning', 'tile'].includes(type) || typeof data?.id !== 'string') return;
      const controller = new AbortController(); controllers.add(controller);
      const timer = setTimeout(() => controller.abort(), 20000);
      let result;
      try {
        if (type === 'planning') result = { status: 200, data: await planningRequest(data, controller.signal) };
        else {
          const { z, x, y } = data;
          if (![z, x, y].every(value => typeof value === 'number' && Number.isInteger(value)) || z < 0 || z > 19 || x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) throw Error('Invalid map tile.');
          const response = await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, { signal: controller.signal, credentials: 'omit', cache: 'default' });
          if (!response.ok || !response.headers.get('content-type')?.startsWith('image/png')) throw Error('Map tile unavailable.');
          const bytes = new Uint8Array(await response.arrayBuffer());
          if (bytes.length > 512000) throw Error('Invalid map tile response.');
          let binary = '';
          for (let index = 0; index < bytes.length; index += 8192) binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
          result = { image: `data:image/png;base64,${btoa(binary)}` };
        }
      } catch { result = { error: 'The map source is unavailable. Try again.' }; }
      finally { clearTimeout(timer); controllers.delete(controller); }
      if (active) frame.current?.contentWindow?.postMessage({ channel, type: 'reply', id: data.id, result }, '*');
    };
    window.addEventListener('message', receive);
    return () => { active = false; window.removeEventListener('message', receive); controllers.forEach(controller => controller.abort()); };
  }, [channel]);
  return <iframe ref={frame} title="Interactive CRDA property map" srcDoc={html} sandbox="allow-scripts" style={{ display: 'block', width: '100%', height: 500, border: '1px solid #e7e9eb', borderRadius: 10 }} />;
}
