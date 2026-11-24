import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText as Text } from '../AppText';
import { hostedSellerUrl, sellerPreviewAddress } from './config';
import { styles as s } from './theme';

export default function SellerWebView({ demo = false }: { demo?: boolean }) {
  const [address, setAddress] = useState(() => sellerPreviewAddress(demo));
  const [revision, setRevision] = useState(0);
  return <View style={s.screen}><View style={s.toolbar}><Text style={s.brand}>agentmart · Seller</Text><Pressable accessibilityRole="button" onPress={() => setRevision(old => old + 1)} style={s.button}><Text style={s.buttonText}>Reload</Text></Pressable><a href={address.url} target="_blank" rel="noopener noreferrer" style={{ color: '#254b3c', padding: 12, fontSize: 14 }}>Open in browser</a>{address.local && <Pressable accessibilityRole="button" onPress={() => setAddress({ url: hostedSellerUrl, local: false })} style={s.button}><Text style={s.buttonText}>Hosted workspace</Text></Pressable>}</View><View style={s.content}><iframe key={`${address.url}-${revision}`} title="AgentMart Seller Studio" src={address.url} allow="geolocation; clipboard-write" style={{ width: '100%', height: '100%', border: 0, display: 'block' }} /></View></View>;
}
