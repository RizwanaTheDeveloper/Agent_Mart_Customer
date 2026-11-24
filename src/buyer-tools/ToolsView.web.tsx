import { useEffect, useRef, useState } from 'react';
import { createToolsBridge } from './bridge';

export type ToolsViewProps = { html: string; channel: string; destination: 'home' | 'map' | 'legal' | 'crda'; onError: (message: string) => void };

export default function ToolsView({ html, channel, destination, onError }: ToolsViewProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage({ channel, type: 'navigate', destination }, '*');
  }, [channel, destination, ready]);
  useEffect(() => {
    const bridge = createToolsBridge((id, result) => frame.current?.contentWindow?.postMessage({ channel, type: 'reply', id, result }, '*'), onError);
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.channel !== channel) return;
      if (event.data.type === 'ready') setReady(true);
      void bridge.receive(event.data);
    };
    window.addEventListener('message', receive);
    return () => { window.removeEventListener('message', receive); bridge.dispose(); };
  }, [channel, onError]);
  return <iframe ref={frame} title="Buyer tools workspace" srcDoc={html} sandbox="allow-scripts allow-forms allow-downloads" style={{ border: 0, width: '100%', height: '100%', flex: 1, minHeight: 0, background: '#f6f7f5' }} />;
}
