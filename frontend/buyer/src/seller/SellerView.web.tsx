import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { View } from 'react-native';
import { sellerPreviewAddress } from './config';
import { styles as s } from './theme';

export default function SellerWebView({ demo = false }: { demo?: boolean }) {
  const address = sellerPreviewAddress(demo);
  const auth = useAuth();
  const frame = useRef<HTMLIFrameElement>(null);
  const token = auth.session?.user.role === 'SELLER' ? auth.session.accessToken : '';
  useEffect(() => {
    const origin = new URL(address.url).origin;
    const send = () => { if (token) frame.current?.contentWindow?.postMessage({ type: 'agentmart:token', token }, origin); };
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== origin) return;
      if (event.data === 'agentmart:ready') send();
      if (event.data === 'agentmart:signout') router.replace('/');
    };
    send();
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [token, address.url]);
  return <View style={s.screen}><View style={s.content}><iframe ref={frame} key={address.url} title="AgentMart Seller Studio" src={address.url} allow="geolocation; clipboard-write" style={{ width: '100%', height: '100%', border: 0, display: 'block' }} /></View></View>;
}
