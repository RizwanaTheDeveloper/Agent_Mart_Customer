import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '../AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { hostedSellerUrl } from '../seller/config';

export default function Account() {
  const params = useLocalSearchParams<{ workspace?: string; mode?: string }>();
  const seller = params.workspace === 'seller';
  const create = params.mode === 'create';
  const [error, setError] = useState('');
  const compact = useWindowDimensions().width < 500;
  const title = create ? `Create ${seller ? 'seller' : 'buyer'} account` : seller ? 'Seller / owner login' : 'Buyer login';

  async function signIn() {
    setError('');
    try {
      await Linking.openURL(new URL('/signin-with-chatgpt?return_to=%2F', hostedSellerUrl).toString());
    } catch {
      setError('Could not open sign-in. Please try again.');
    }
  }

  return <SafeAreaView edges={['left', 'right', 'bottom']} style={s.screen}><ScrollView style={s.screen} contentInsetAdjustmentBehavior="never" contentContainerStyle={[s.content, compact && s.compactContent]}>
    <View style={[s.card, compact && s.compactCard]}>
      <Text accessibilityRole="header" style={s.title}>{title}</Text>
      <Text style={s.text}>{seller ? 'Seller Studio uses ChatGPT sign-in to access your property workspace. Continue in your browser to sign in with your account.' : 'Buyer login and account creation are not connected yet. You can explore the buyer demo, compare properties and save enquiry drafts on this device.'}</Text>
      {seller && <Pressable accessibilityRole="button" onPress={() => { void signIn(); }} style={s.primary}><Text style={s.primaryText}>Continue with ChatGPT</Text></Pressable>}
      {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => router.replace(seller ? { pathname: '/seller', params: { demo: '1' } } : '/discover')} style={s.secondary}><Text style={s.secondaryText}>{seller ? 'View seller / owner demo' : 'View buyer demo'}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={s.back}><Text style={s.secondaryText}>Back to workspace selection</Text></Pressable>
    </View>
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 48, alignItems: 'center' },
  compactContent: { padding: 16, paddingTop: 24 },
  compactCard: { padding: 20 },
  card: { width: '100%', maxWidth: 520, borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: 'white', padding: 28, gap: 22 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '600' },
  text: { color: colors.muted, fontSize: 16, lineHeight: 25 },
  primary: { backgroundColor: colors.green, borderRadius: 10, minHeight: 48, padding: 12, justifyContent: 'center', alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '600', fontSize: 15, textAlign: 'center', flexShrink: 1 },
  secondary: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, minHeight: 48, padding: 12, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { color: colors.green, fontSize: 15, fontWeight: '500', textAlign: 'center', flexShrink: 1 },
  back: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#a43333', fontSize: 14 },
});
