import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Pressable, View } from 'react-native';
import { AppText as Text } from '../AppText';
import { WebView } from 'react-native-webview';
import { hostedSellerUrl, sellerPreviewAddress } from './config';
import { styles as s } from './theme';

export default function SellerView({ demo = false }: { demo?: boolean }) {
  const initial = sellerPreviewAddress(demo);
  const [address, setAddress] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const browser = useRef<WebView<object>>(null);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) { browser.current?.goBack(); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [canGoBack]);
  function reload() { setError(''); setLoading(true); browser.current?.reload(); }
  return <View style={s.screen}><View style={s.toolbar}><Text style={s.brand}>agentmart · Seller</Text>{canGoBack && <Pressable accessibilityRole="button" onPress={() => browser.current?.goBack()} style={s.button}><Text style={s.buttonText}>Back</Text></Pressable>}</View>{address.local && <View style={s.preview}><Text style={s.previewText}>Phone preview: choose Explore sample workspace. For real sign-in, use the hosted workspace.</Text><Pressable accessibilityRole="button" onPress={() => { setError(''); setLoading(true); setAddress({ url: hostedSellerUrl, local: false }); }} style={s.button}><Text style={s.buttonText}>Use hosted workspace</Text></Pressable></View>}<View style={s.content}><WebView<object> ref={browser} source={{ uri: address.url }} style={{ flex: 1 }} originWhitelist={['http://*', 'https://*']} sharedCookiesEnabled geolocationEnabled onNavigationStateChange={state => setCanGoBack(state.canGoBack)} onLoadStart={() => { setLoading(true); setError(''); }} onLoadEnd={() => setLoading(false)} onError={event => { setLoading(false); setError(event.nativeEvent.description || 'Could not load Seller Studio.'); }} onHttpError={event => { if (event.nativeEvent.statusCode >= 400) { setLoading(false); setError(`Seller Studio returned HTTP ${event.nativeEvent.statusCode}. Check the connection or sign-in.`); } }} onShouldStartLoadWithRequest={request => {
      if (/^https?:\/\//i.test(request.url) || request.url === 'about:blank') return true;
      if (/^(tel:|mailto:)/i.test(request.url)) void Linking.openURL(request.url).catch(() => setError('No application could open this link.'));
      return false;
    }} />{loading && !error && <View style={s.loading}><ActivityIndicator color="#254b3c" size="large" /><Text style={s.text}>Opening Seller Studio…</Text></View>}{error && <View style={[s.loading, s.error]}><Text style={s.title}>Seller Studio couldn’t load</Text><Text style={s.text}>{error}</Text><Text style={s.text}>Keep your phone and computer on the same Wi-Fi, or use the hosted workspace.</Text><Pressable accessibilityRole="button" onPress={reload} style={s.button}><Text style={s.buttonText}>Try again</Text></Pressable><Pressable accessibilityRole="button" onPress={() => { setError(''); setLoading(true); setAddress({ url: hostedSellerUrl, local: false }); }} style={s.button}><Text style={s.buttonText}>Use hosted workspace</Text></Pressable></View>}</View></View>;
}
