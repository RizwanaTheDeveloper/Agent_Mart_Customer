import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Public site URL already used by the existing Capacitor seller application.
export const hostedSellerUrl = 'https://agentmart-seller-studio-kk.anil-kumar-7736.chatgpt.site';

export function sellerPreviewAddress(demo: boolean) {
  const address = sellerAddress();
  if (demo) { const url = new URL(address.url); url.searchParams.set('demo', '1'); return { ...address, url: url.toString() }; }
  return address;
}

export function sellerAddress() {
  const configured = process.env.EXPO_PUBLIC_SELLER_URL;
  if (configured) {
    const parsed = new URL(configured);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw Error('EXPO_PUBLIC_SELLER_URL must use HTTP or HTTPS.');
    return { url: parsed.toString(), local: false };
  }
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    const host = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.hostname : hostUri ? new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`).hostname : '';
    if (host) return { url: `http://${host}:${process.env.EXPO_PUBLIC_SELLER_PORT || '5173'}`, local: true };
  }
  return { url: hostedSellerUrl, local: false };
}
