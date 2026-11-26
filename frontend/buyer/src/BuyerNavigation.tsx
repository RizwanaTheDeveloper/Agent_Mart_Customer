import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useGlobalSearchParams, usePathname } from 'expo-router';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from './AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBuyer } from './state';
import { colors } from './theme';

const destinations = [
  { path: '/discover', label: 'Discover', icon: 'search-outline' },
  { path: '/tools?view=map', label: 'Map', icon: 'map-outline' },
  { path: '/tools?view=legal', label: 'Legal', icon: 'shield-checkmark-outline' },
  { path: '/master-plan', label: 'CRDA master plan', icon: 'layers-outline' },
  { path: '/saved', label: 'Saved', icon: 'heart-outline' },
  { path: '/compare', label: 'Compare', icon: 'git-compare-outline' },
  { path: '/drafts', label: 'Drafts', icon: 'chatbubble-ellipses-outline' },
  { path: '/tools?view=home', label: 'Buyer tools', icon: 'grid-outline' },
  { path: '/profile', label: 'Profile', icon: 'person-circle-outline' },
] as const;

export default function BuyerNavigation({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { view } = useGlobalSearchParams<{ view?: string }>();
  const activePath = pathname === '/tools' ? `/tools?view=${['map', 'legal', 'crda'].includes(view || '') ? view : 'home'}` : pathname;
  const { width, fontScale } = useWindowDimensions();
  const desktop = width / Math.max(fontScale, 1) >= 1000;
  const [open, setOpen] = useState(false);
  const store = useBuyer();
  const current = destinations.find(item => item.path === activePath)?.label || 'Property details';
  useEffect(() => {
    if (Platform.OS !== 'web' || !open || desktop) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
    };
    document.addEventListener('keydown', closeOnEscape, true);
    return () => document.removeEventListener('keydown', closeOnEscape, true);
  }, [open, desktop]);

  function navigation(drawer: boolean) {
    return <SafeAreaView edges={drawer ? ['top', 'left', 'bottom'] : ['left', 'bottom']} style={[s.sidebar, drawer && { width: Math.min(300, width - 40) }]}>
      <View style={s.sidebarHeader}><View><Text style={s.brand}>agentmart</Text><Text style={s.eyebrow}>BUYER STUDIO</Text></View>
        {drawer && <Pressable accessibilityRole="button" accessibilityLabel="Close buyer navigation" onPress={() => setOpen(false)} style={s.iconButton}><Ionicons name="close-outline" color="white" size={26} /></Pressable>}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={s.sidebarScroll} contentContainerStyle={s.sidebarContent}>
        <Text style={s.section}>YOUR WORKSPACE</Text>
        {destinations.map(item => {
          const selected = item.path === activePath || (item.path === '/discover' && pathname.startsWith('/property/'));
          const count = item.path === '/saved' ? store.saved.length : item.path === '/compare' ? store.compared.length : item.path === '/drafts' ? store.drafts.length : 0;
          return <Pressable key={item.path} accessibilityRole="button" accessibilityLabel={`Buyer ${item.label}`} accessibilityState={{ selected }} aria-pressed={selected} onPress={() => { setOpen(false); router.navigate(item.path); }} style={({ pressed }) => [s.item, selected && s.selected, pressed && s.pressed]}>
            <Ionicons name={item.icon} size={21} color={selected ? colors.peach : '#c6cdd5'} />
            <Text style={[s.itemText, selected && s.selectedText]}>{item.label}</Text>
            {count > 0 && <View style={s.badge}><Text style={s.badgeText}>{count}</Text></View>}
          </Pressable>;
        })}
      </ScrollView>
      <View style={s.sidebarFooter}></View>
    </SafeAreaView>;
  }

  return <View style={s.layout}>
    {desktop && navigation(false)}
    <View style={s.main}>
      {!desktop && <SafeAreaView edges={['left', 'right']} style={s.mobileBar}><Pressable accessibilityRole="button" accessibilityLabel="Open buyer navigation" aria-expanded={open} onPress={() => setOpen(true)} style={s.menuButton}><Ionicons name="menu-outline" size={26} color={colors.green} /><Text style={s.menuText}>Menu</Text></Pressable><Text style={s.current}>{current}</Text><Pressable accessibilityRole="button" accessibilityLabel="Buyer profile" onPress={() => router.navigate('/profile')} style={s.iconButton}><Ionicons name="person-circle-outline" size={29} color={colors.green} /></Pressable></SafeAreaView>}
      {children}
    </View>
    <Modal visible={!desktop && open} transparent animationType="fade" onRequestClose={() => setOpen(false)} supportedOrientations={['portrait', 'landscape']}>
      <View style={s.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss buyer navigation" onPress={() => setOpen(false)} style={StyleSheet.absoluteFill} />
        {navigation(true)}
      </View>
    </Modal>
  </View>;
}

const s = StyleSheet.create({
  layout: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  main: { flex: 1, minWidth: 0 },
  sidebar: { width: 244, backgroundColor: colors.deep, flexShrink: 0, height: '100%' },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, gap: 10 },
  brand: { color: 'white', fontSize: 27, fontWeight: '800', letterSpacing: -1 },
  eyebrow: { color: '#c6cdd5', fontSize: 9, letterSpacing: 2, marginTop: 7 },
  sidebarContent: { paddingHorizontal: 14, paddingBottom: 20, gap: 8 },
  sidebarScroll: { ...({ scrollbarWidth: 'none' } as object) },
  section: { color: '#a8b2be', fontSize: 10, fontWeight: '600', letterSpacing: 1.5, padding: 12, marginTop: 16, marginBottom: 6 },
  item: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  selected: { backgroundColor: '#2f3e4f', borderLeftColor: colors.peach },
  pressed: { opacity: 0.75 },
  itemText: { color: '#d5dae0', fontSize: 15, flex: 1 },
  selectedText: { color: 'white', fontWeight: '600' },
  badge: { borderRadius: 8, backgroundColor: colors.peach, minWidth: 23, paddingHorizontal: 6, paddingVertical: 3, alignItems: 'center' },
  badgeText: { color: colors.deep, fontWeight: '700', fontSize: 12 },
  sidebarFooter: { padding: 24, flexDirection: 'row', gap: 10, alignItems: 'center' },
  footerText: { color: '#bac2cc', fontSize: 12, lineHeight: 19, flex: 1 },
  mobileBar: { minHeight: 56, paddingHorizontal: 14, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderColor: colors.line, backgroundColor: 'white' },
  menuButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  menuText: { color: colors.green, fontSize: 14, fontWeight: '600' },
  current: { color: colors.muted, fontSize: 14, flexShrink: 1 },
  iconButton: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: '#0c1723b3', flexDirection: 'row' },
});
