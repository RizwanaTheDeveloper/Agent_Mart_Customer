import { listings } from '../data/listings';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '../AppText';
import { colors } from '../theme';
import { PropertyArt } from '../components';
import { SafeAreaView } from 'react-native-safe-area-context';

const workspaces = [
  {
    title: 'Buyer', subtitle: 'Find the right plot, flat or property', icon: 'search-outline' as const,
    accent: colors.green, iconBackground: '#e7eee0', route: '/discover' as const,
    features: ['Browse properties by location and budget', 'Save and compare your favourite properties', 'Keep your enquiry drafts in one place'],
    workspace: 'buyer' as const, login: 'Buyer login', create: 'Create buyer account', demo: 'View buyer demo →',
  },
  {
    title: 'Seller / Property owner', subtitle: 'Individual owners and real estate firms', icon: 'home-outline' as const,
    accent: '#b97e5c', iconBackground: '#f7e6d8', route: '/seller' as const,
    features: ['Create, edit and publish your listings', 'Manage buyer enquiries and follow-ups', 'Organise site visits, documents and your team'],
    workspace: 'seller' as const, login: 'Seller / owner login', create: 'Create seller account', demo: 'View seller / owner demo →',
  },
];

export default function WorkspaceHome() {
  const { width, height, fontScale } = useWindowDimensions();
  const availableWidth = width / Math.max(fontScale, 1);
  const compact = availableWidth < 760;
  const compactHero = availableWidth < 1000;
  const narrow = availableWidth < 380;
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={s.screen}>
    <ScrollView style={s.screen} contentInsetAdjustmentBehavior="never" contentContainerStyle={[s.content, compact && s.compactContent, narrow && s.narrowContent]}>
    <View style={[s.hero, compactHero && s.heroCompact, narrow && s.narrowHero]}>
      <View style={[s.heroCopy, compactHero && s.naturalHeight]}>
        <View style={s.eyebrowRow}><Ionicons name="leaf-outline" size={17} color={colors.green} /><Text style={s.eyebrow}>A SPACE FOR YOUR NEXT CHAPTER</Text></View>
        <Text accessibilityRole="header" style={[s.heroTitle, compact && s.heroTitleCompact]}>Great places.{ '\n' }Even better possibilities.</Text>
        <Text style={s.heroText}>Find a place to call your own, or bring your property business together. Your next move starts with AgentMart.</Text>
        <View style={s.heroFooter}><View style={s.dot} /><Text style={s.heroFooterText}>One place. Two ways to move forward.</Text></View>
      </View>
      {height >= 500 && <View style={[s.heroArt, compactHero && s.heroArtCompact]}>
        <PropertyArt property={listings[1]} />
        <View style={s.artLabel}><Ionicons name="home-outline" size={18} color={colors.green} /><Text style={s.artLabelText}>Room for what comes next.</Text></View>
      </View>}
    </View>
    <View style={s.sectionHeader}><View>
    <Text accessibilityRole="header" style={[s.title, compact && s.compactTitle]}>Choose your workspace</Text>
    <Text style={s.sectionText}>A little more personal. A lot more possible.</Text>
    </View></View>
    <View style={[s.cards, compact && s.stacked]}>
      {workspaces.map(workspace => <View key={workspace.route} style={[s.card, compact && s.naturalHeight, narrow && s.narrowCard, { borderTopColor: workspace.accent }]}>
        <View style={s.cardHeader}>
          <View style={[s.icon, { backgroundColor: workspace.iconBackground }]}><Ionicons name={workspace.icon} size={25} color={colors.green} /></View>
          <View style={s.headingGroup}><Text accessibilityRole="header" style={s.cardTitle}>{workspace.title}</Text><Text style={s.cardSubtitle}>{workspace.subtitle}</Text></View>
        </View>
        <View style={[s.features, compact && s.naturalHeight]}>{workspace.features.map(feature => <View key={feature} style={s.feature}><Ionicons name="checkmark-outline" size={20} color={workspace.accent} /><Text style={s.featureText}>{feature}</Text></View>)}</View>
        <Pressable accessibilityRole="button" accessibilityLabel={workspace.login} onPress={() => router.push({ pathname: '/account', params: { workspace: workspace.workspace, mode: 'login' } })} style={({ pressed }) => [s.primary, pressed && s.pressed]}><Text style={s.primaryText}>{workspace.login}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={workspace.create} onPress={() => router.push({ pathname: '/account', params: { workspace: workspace.workspace, mode: 'create' } })} style={({ pressed }) => [s.secondary, pressed && s.pressed]}><Text style={s.secondaryText}>{workspace.create}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={workspace.demo.replace(' →', '')} onPress={() => router.push(workspace.workspace === 'seller' ? { pathname: '/seller', params: { demo: '1' } } : '/discover')} style={s.demo}><Text style={s.demoText}>{workspace.demo}</Text></Pressable>
      </View>)}
    </View>
    <View style={s.footer}><Ionicons name="leaf-outline" size={16} color={colors.muted} /><Text style={s.footerText}>Thoughtfully organised. Ready for your next move.</Text></View>
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 1160, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 28, paddingBottom: 32 },
  compactContent: { paddingHorizontal: 18, paddingTop: 18 },
  narrowContent: { paddingHorizontal: 14, paddingTop: 14 },
  naturalHeight: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  narrowHero: { padding: 18 },
  narrowCard: { padding: 20 },
  hero: { flexDirection: 'row', backgroundColor: '#e3ebda', borderRadius: 22, overflow: 'hidden', padding: 32, gap: 24, alignItems: 'center' },
  heroCompact: { flexDirection: 'column', padding: 22, alignItems: 'stretch' },
  heroCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, gap: 18 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: colors.green, flexShrink: 1 },
  heroTitle: { fontSize: 40, lineHeight: 47, fontWeight: '800', letterSpacing: -1.5, color: colors.deep },
  heroTitleCompact: { fontSize: 30, lineHeight: 37, letterSpacing: -1 },
  heroText: { maxWidth: 480, color: '#526b55', fontSize: 15, lineHeight: 24 },
  heroFooter: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  heroFooterText: { color: colors.green, fontSize: 12, flexShrink: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6c8c62' },
  heroArt: { width: 300, height: 230, backgroundColor: '#f1d6bd', borderRadius: 18, overflow: 'hidden', position: 'relative' },
  heroArtCompact: { width: '100%', height: 170 },
  artLabel: { position: 'absolute', bottom: 14, left: 12, right: 12, borderRadius: 10, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#fffdf5f0' },
  artLabelText: { color: colors.green, fontSize: 12, fontWeight: '600', flexShrink: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32, marginBottom: 20 },
  title: { color: colors.ink, fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
  compactTitle: { fontSize: 24 },
  sectionText: { color: colors.muted, fontSize: 14, marginTop: 7, lineHeight: 21 },
  cards: { flexDirection: 'row', gap: 24, alignItems: 'stretch' },
  stacked: { flexDirection: 'column' },
  card: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, padding: 26, borderRadius: 17, backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderTopWidth: 3, boxShadow: '0 5px 18px rgba(24, 60, 48, 0.04)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
  icon: { width: 49, height: 49, flexShrink: 0, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  headingGroup: { flex: 1, gap: 5 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.ink },
  cardSubtitle: { fontSize: 13, lineHeight: 20, color: colors.muted },
  features: { gap: 12, marginBottom: 32, flexGrow: 1, flexShrink: 0, flexBasis: 'auto' },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.muted },
  primary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, backgroundColor: colors.green },
  pressed: { opacity: 0.82 },
  primaryText: { color: 'white', fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'center' },
  secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fcfdfb', marginTop: 10 },
  secondaryText: { color: colors.green, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  demo: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  demoText: { color: colors.green, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 25 },
  footerText: { color: colors.muted, fontSize: 12, flexShrink: 1 },
});
