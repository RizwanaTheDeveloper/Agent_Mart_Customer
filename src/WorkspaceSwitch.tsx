import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from './AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './theme';

export default function WorkspaceSwitch() {
  const pathname = usePathname();
  const home = pathname === '/' || pathname === '/account';
  const { width, fontScale } = useWindowDimensions();
  const compact = width / Math.max(fontScale, 1) < 700;
  const seller = pathname === '/seller';
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
    <View style={[styles.bar, home && styles.welcomeBar, compact && styles.compactBar]}>
      {home && <View style={styles.logo}><Ionicons name="business-outline" size={23} color="white" /></View>}
      <Pressable accessibilityRole="button" accessibilityLabel="Choose workspace" onPress={() => router.replace('/')} style={styles.home}>
        <Text style={[styles.brand, home && styles.welcomeBrand]}>AgentMart</Text>
        {home && <Text style={styles.tagline}>PROPERTY, IN PERSPECTIVE</Text>}
      </Pressable>
      {home ? <><Text style={[styles.breadcrumb, compact && styles.hidden]}>Your workspace  /  {pathname === '/account' ? 'Account' : 'Welcome'}</Text><Text style={styles.language}>EN</Text></> : <View accessibilityRole="tablist" style={styles.switch}>
        <Pressable accessibilityRole="tab" accessibilityLabel="Switch to Seller" aria-selected={seller} onPress={() => { if (!seller) router.replace('/seller'); }} style={[styles.button, seller && styles.active]}>
          <Text style={[styles.label, seller && styles.activeLabel]}>Seller</Text>
        </Pressable>
        <Pressable accessibilityRole="tab" accessibilityLabel="Switch to Buyer" aria-selected={!seller} onPress={() => { if (seller) router.replace('/discover'); }} style={[styles.button, !seller && styles.active]}>
          <Text style={[styles.label, !seller && styles.activeLabel]}>Buyer</Text>
        </Pressable>
      </View>}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.line },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  compactBar: { minHeight: 64, flexWrap: 'wrap', paddingHorizontal: 14, gap: 8 },
  brand: { fontSize: 25, fontWeight: '800', color: colors.green },
  home: { minHeight: 44, justifyContent: 'center', flexShrink: 1, minWidth: 0 },
  welcomeBrand: { color: colors.green },
  welcomeBar: { minHeight: 80, justifyContent: 'flex-start', gap: 12, paddingHorizontal: 18, backgroundColor: 'white' },
  logo: { width: 42, height: 44, flexShrink: 0, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  language: { marginLeft: 'auto', color: colors.muted, fontSize: 13, fontWeight: '700' },
  hidden: { display: 'none' },
  tagline: { color: colors.muted, fontSize: 8, letterSpacing: 1.6, marginTop: 3 },
  breadcrumb: { color: colors.muted, fontSize: 12, flexShrink: 1, marginLeft: 18 },
  switch: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 10, padding: 3 },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 8 },
  active: { backgroundColor: colors.green },
  label: { fontSize: 14, fontWeight: '600', color: colors.green },
  activeLabel: { color: 'white' },
});
