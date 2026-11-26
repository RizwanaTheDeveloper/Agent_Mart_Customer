import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../../AppText';
import { Screen } from '../../components';
import { useAuth } from '../../auth/AuthProvider';
import { useBuyer } from '../../state';
import { colors } from '../../theme';
import BuyerPreferencesForm from '../../BuyerPreferencesForm';

export default function BuyerProfile() {
  const auth = useAuth(), buyer = useBuyer();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const user = auth.session?.user || buyer.session?.user;

  async function leave() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await buyer.signOut();
      await auth.signOut();
      buyer.browse(false);
      router.replace('/'); // back to the first screen: choose Buyer or Seller
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  return <Screen><View style={s.card}>
    <Text accessibilityRole="header" style={s.title}>Your profile</Text>
    {auth.restoring ? <ActivityIndicator color={colors.green} /> : user ? <>
      <View style={s.identity}><View style={s.avatar}><Text style={s.initial}>{user.name.slice(0, 1).toUpperCase()}</Text></View><View style={s.details}><Text style={s.name}>{user.name}</Text><Text style={s.email}>{user.email}</Text><Text style={s.caption}>{auth.session?.user.role === 'SELLER' ? 'Seller' : 'Buyer'} account</Text></View></View>
      {auth.session?.user.role !== 'SELLER' && <BuyerPreferencesForm key={user.id} accountId={user.id} />}
      <Pressable accessibilityRole="button" accessibilityLabel="Switch account" disabled={busy} onPress={() => void leave()} style={[s.action, busy && s.disabled]}><Ionicons name="swap-horizontal-outline" size={22} color={colors.green} /><View style={s.details}><Text style={s.actionText}>Switch account</Text><Text style={s.caption}>Sign out and choose another account.</Text></View><Ionicons name="chevron-forward" size={18} color={colors.green} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Sign out" disabled={busy} onPress={() => void leave()} style={[s.action, busy && s.disabled]}><Ionicons name="log-out-outline" size={22} color="#a43333" /><Text style={[s.actionText, s.signOut]}>{busy ? 'Please wait...' : 'Sign out'}</Text></Pressable>
    </> : <>
      <Text style={s.caption}>Sign in to view your account details.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.replace({ pathname: '/login', params: { workspace: 'buyer', mode: 'login' } })} style={s.action}><Ionicons name="log-in-outline" size={22} color={colors.green} /><Text style={s.actionText}>Buyer login</Text></Pressable>
    </>}
    {!!error && <Text accessibilityRole="alert" style={s.signOut}>{error}</Text>}
  </View></Screen>;
}

const s = StyleSheet.create({
  card: { width: '100%', maxWidth: 640, alignSelf: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderRadius: 17, padding: 22, gap: 22 },
  title: { fontSize: 25, fontWeight: '700', color: colors.ink },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e1e7ed', alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 24, fontWeight: '700', color: colors.green },
  details: { flex: 1, minWidth: 0, gap: 5 },
  name: { fontSize: 19, fontWeight: '600', color: colors.ink },
  email: { fontSize: 14, color: colors.muted },
  caption: { fontSize: 14, lineHeight: 21, color: colors.muted },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 15 },
  actionText: { fontSize: 16, fontWeight: '600', color: colors.green },
  signOut: { color: '#a43333' },
  disabled: { opacity: 0.5 },
});
