import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '../AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { hostedSellerUrl } from '../seller/config';
import { useBuyer } from '../state';
import AuthScreen from '../auth/AuthScreen';

export default function Account() {
  const params = useLocalSearchParams<{ legacy?: string }>();
  return params.legacy === '1' ? <LegacyAccount /> : <AuthScreen />;
}

function LegacyAccount() {
  const params = useLocalSearchParams<{ workspace?: string; mode?: string }>();
  const seller = params.workspace === 'seller';
  const create = params.mode === 'create';
  const [error, setError] = useState('');
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [busy, setBusy] = useState(false);
  const store = useBuyer();
  const compact = useWindowDimensions().width < 500;
  const title = create ? 'Create existing Buyer workspace account' : seller ? 'Existing Seller workspace login' : 'Existing Buyer workspace login';

  async function signIn() {
    setError('');
    try {
      await Linking.openURL(new URL('/signin-with-chatgpt?return_to=%2F', hostedSellerUrl).toString());
    } catch {
      setError('Could not open sign-in. Please try again.');
    }
  }
  async function authenticate() {
    if (busy) return;
    setBusy(true); setError('');
    try { await store.authenticate(create, name, email, password); setPassword(''); router.replace('/discover'); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return <SafeAreaView edges={['left', 'right', 'bottom']} style={s.screen}><ScrollView style={s.screen} contentInsetAdjustmentBehavior="never" contentContainerStyle={[s.content, compact && s.compactContent]}>
    <View style={[s.card, compact && s.compactCard]}>
      <Text accessibilityRole="header" style={s.title}>{title}</Text>
      <Text style={s.text}>{seller ? 'Seller Studio uses ChatGPT sign-in to access your property workspace. Continue in your browser to sign in with your account.' : store.session ? `Signed in as ${store.session.user.name} (${store.session.user.email}). Your saved properties and drafts sync to this account.` : 'Sign in to save properties across devices and send enquiries to sellers.'}</Text>
      {!seller && !store.session && <View style={{ gap: 12 }}>
        {create && <TextInput accessibilityLabel="Your name" placeholder="Your name" value={name} onChangeText={setName} maxLength={100} autoComplete="name" style={s.field} />}
        <TextInput accessibilityLabel="Email" placeholder="Email" value={email} onChangeText={setEmail} maxLength={254} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" style={s.field} />
        <TextInput accessibilityLabel="Password" placeholder="Password (at least 12 characters)" value={password} onChangeText={setPassword} maxLength={128} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={create ? 'new-password' : 'current-password'} style={s.field} />
        <Pressable accessibilityRole="button" disabled={busy || !email.trim() || password.length < 12 || (create && !name.trim())} onPress={() => void authenticate()} style={[s.primary, (busy || !email.trim() || password.length < 12 || (create && !name.trim())) && { opacity: 0.5 }]}><Text style={s.primaryText}>{busy ? 'Please wait…' : create ? 'Create Buyer account' : 'Sign in'}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.replace({ pathname: '/account', params: { workspace: 'buyer', legacy: '1', mode: create ? 'login' : 'create' } })} style={s.back}><Text style={s.secondaryText}>{create ? 'Already have an account? Sign in' : 'Create a Buyer account'}</Text></Pressable>
      </View>}
      {!seller && store.session && <Pressable accessibilityRole="button" disabled={busy} onPress={async () => { setBusy(true); setError(''); try { await store.signOut(); router.replace('/'); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }} style={s.secondary}><Text style={s.secondaryText}>{busy ? 'Signing out…' : 'Sign out'}</Text></Pressable>}
      {!seller && <Pressable accessibilityRole="button" onPress={() => { store.browse(true); router.replace('/discover'); }} style={s.secondary}><Text style={s.secondaryText}>Browse published properties</Text></Pressable>}
      {seller && <Pressable accessibilityRole="button" onPress={() => { void signIn(); }} style={s.primary}><Text style={s.primaryText}>Continue with ChatGPT</Text></Pressable>}
      {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
      <Text style={s.text}>This workspace uses a separate account. For your AgentMart email and password, use AgentMart account login.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.replace({ pathname: '/login', params: { workspace: seller ? 'seller' : 'buyer', mode: 'login' } })} style={s.secondary}><Text style={s.secondaryText}>AgentMart account login</Text></Pressable>
    </View>
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({
  field: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 14, minHeight: 48, color: colors.ink, backgroundColor: '#fbfcfd' },
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
