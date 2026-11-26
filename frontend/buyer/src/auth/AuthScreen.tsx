import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../AppText';
import { colors } from '../theme';
import { useBuyer } from '../state';
import { useAuth } from './AuthProvider';

export default function AuthScreen() {
  const params = useLocalSearchParams<{ workspace?: string; mode?: string }>();
  const create = params.mode === 'create', seller = params.workspace === 'seller';
  const auth = useAuth(), buyer = useBuyer();
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const label = seller ? 'seller' : 'buyer';
  const disabled = busy || auth.restoring || !email.trim() || !password || (create && (!name.trim() || password.length < 12 || confirm !== password));

  function openWorkspace(role: 'BUYER' | 'SELLER') {
    if (role === 'SELLER') router.replace('/seller');
    else { buyer.browse(true); router.replace('/discover'); }
  }

  async function submit() {
    if (disabled) return;
    setBusy(true); setError('');
    try {
      const session = await auth.signIn(create, { name, email, password, role: seller ? 'SELLER' : 'BUYER' });
      setPassword(''); setConfirm(''); openWorkspace(session.user.role);
    }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function signOut() {
    if (busy) return;
    setBusy(true); setError('');
    try { await auth.signOut(); router.replace('/'); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  const user = auth.session?.user;
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={s.screen}><KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.title}>{user ? 'Your AgentMart account' : create ? `Create ${label} account` : `${seller ? 'Seller' : 'Buyer'} login`}</Text>
      {user ? <>
        <Text style={s.text}>Signed in as {user.name}</Text><Text style={s.text}>{user.email}</Text><Text style={s.text}>{user.role === 'SELLER' ? 'Seller account' : 'Buyer account'}</Text>
        {user.role === (seller ? 'SELLER' : 'BUYER') ? <Pressable accessibilityRole="button" onPress={() => openWorkspace(user.role)} style={s.primary}><Text style={s.primaryText}>{user.role === 'SELLER' ? 'Open Seller workspace' : 'Browse published properties'}</Text></Pressable> : <Text style={s.error}>This is a {user.role === 'SELLER' ? 'Seller' : 'Buyer'} account. Sign out to use {seller ? 'Seller' : 'Buyer'} login.</Text>}
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void signOut()} style={s.secondary}><Text style={s.secondaryText}>{busy ? 'Signing out…' : 'Sign out'}</Text></Pressable>
      </> : <>
        <Text style={s.text}>{auth.restoring ? 'Checking your session…' : create ? 'Create an account using your name, email and a password of at least 12 characters.' : 'Sign in with your email and password.'}</Text>
        {create && <TextInput accessibilityLabel="Your name" placeholder="Your name" value={name} onChangeText={setName} autoComplete="name" maxLength={100} editable={!busy} style={s.field} />}
        <TextInput accessibilityLabel="Email" placeholder="Email" value={email} onChangeText={setEmail} autoComplete="email" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" maxLength={254} editable={!busy} style={s.field} />
        <TextInput accessibilityLabel="Password" placeholder={create ? 'Password (at least 12 characters)' : 'Password'} value={password} onChangeText={setPassword} autoComplete={create ? 'new-password' : 'current-password'} autoCapitalize="none" autoCorrect={false} secureTextEntry maxLength={128} editable={!busy} onSubmitEditing={() => { if (!create) void submit(); }} style={s.field} />
        {create && <TextInput accessibilityLabel="Confirm password" placeholder="Confirm password" value={confirm} onChangeText={setConfirm} autoComplete="new-password" autoCapitalize="none" autoCorrect={false} secureTextEntry maxLength={128} editable={!busy} style={s.field} />}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={() => void submit()} style={[s.primary, disabled && s.disabled]}><Text style={s.primaryText}>{busy ? 'Please wait…' : create ? 'Create account' : 'Sign in'}</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setPassword(''); setConfirm(''); setError(''); router.replace({ pathname: '/login', params: { workspace: label, mode: create ? 'login' : 'create' } }); }} style={s.secondary}><Text style={s.secondaryText}>{create ? 'Already have an account? Sign in' : 'Create a new account'}</Text></Pressable>
      </>}
      {!!(error || auth.connectionError) && <Text accessibilityRole="alert" style={s.error}>{error || auth.connectionError}</Text>}
    </View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 18, paddingTop: 32, alignItems: 'center' },
  card: { width: '100%', maxWidth: 520, padding: 24, gap: 18, borderWidth: 1, borderColor: colors.line, borderRadius: 17, backgroundColor: 'white' },
  title: { color: colors.ink, fontSize: 26, fontWeight: '700' }, text: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  field: { minHeight: 48, padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 10, color: colors.ink },
  primary: { minHeight: 48, padding: 12, backgroundColor: colors.green, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: 'white', fontWeight: '600', fontSize: 15 }, secondary: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.green, fontSize: 15, textAlign: 'center' },
  disabled: { opacity: 0.5 }, error: { color: '#a43333', fontSize: 14, lineHeight: 22 },
});
