import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useBuyer } from '../../state';
import { AppText as Text } from '../../AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import ToolsView from '../../buyer-tools/ToolsView';
import { toolsDocument } from '../../buyer-tools/document';
import { storageKey } from '../../buyer-tools/bridge';
import { colors } from '../../theme';

const tools = [
  { title: 'Discover properties', text: 'Search plots, flats and houses by location and budget.', icon: 'search-outline', href: '/discover' },
  { title: 'Map', text: 'Explore property locations and CRDA parcel boundaries.', icon: 'map-outline', href: '/tools?view=map' },
  { title: 'Legal tools', text: 'Official record portals, private checklists and review notes.', icon: 'shield-checkmark-outline', href: '/tools?view=legal' },
  { title: 'CRDA plots', text: 'Search plot references, preview imports and view parcel details.', icon: 'grid-outline', href: '/tools?view=crda' },
  { title: 'CRDA master plan', text: 'Zoning and master plan layers for the capital region.', icon: 'layers-outline', href: '/master-plan' },
  { title: 'Saved', text: 'Properties you have saved to review later.', icon: 'heart-outline', href: '/saved', count: 'saved' },
  { title: 'Compare', text: 'Put shortlisted properties side by side.', icon: 'git-compare-outline', href: '/compare', count: 'compared' },
  { title: 'Enquiry drafts', text: 'Messages to sellers that you have started.', icon: 'chatbubble-ellipses-outline', href: '/drafts', count: 'drafts' },
  { title: 'Research and investment', text: 'Plot research, investment scenarios and account tools.', icon: 'stats-chart-outline', href: '/tools?view=more' },
] as const;

function ToolCards() {
  const store = useBuyer();
  return <ScrollView style={{ flex: 1 }} contentContainerStyle={s.gridContent}>
    <Text accessibilityRole="header" style={s.gridTitle}>Choose a tool</Text>
    <View style={s.grid}>{tools.map(tool => {
      const count = 'count' in tool ? (store as any)[tool.count]?.length || 0 : 0;
      return <Pressable key={tool.title} accessibilityRole="button" accessibilityLabel={tool.title} onPress={() => router.navigate(tool.href as any)} style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}>
        <View style={s.cardIcon}><Ionicons name={tool.icon} size={24} color={colors.green} /></View>
        <View style={s.cardBody}><Text style={s.cardTitle}>{tool.title}</Text><Text style={s.cardText}>{tool.text}</Text></View>
        {count > 0 ? <View style={s.badge}><Text style={s.badgeText}>{count}</Text></View> : <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
      </Pressable>;
    })}</View>
  </ScrollView>;
}

export default function BuyerTools() {
  const { view } = useLocalSearchParams<{ view?: string }>();
  const destination = view === 'map' || view === 'legal' || view === 'crda' ? view : 'home';
  const showCards = view !== 'map' && view !== 'legal' && view !== 'crda' && view !== 'more';
  const heading = { map: 'Map', legal: 'Legal', crda: 'CRDA plots', home: view === 'more' ? 'Research and investment' : 'Buyer tools' }[destination];
  const description = {
    map: 'Explore property locations and CRDA parcel boundaries. Sample listings and reference parcels are labelled separately.',
    legal: 'Search official record portals and keep private document checklists and review notes.',
    crda: 'Search CRDA plot references, preview imports and view parcel details. References do not establish ownership or sale availability.',
    home: 'Maps, property insights, legal notes, research and account tools from AgentMart Customer. Sample data is separate from your current workspace.',
  }[destination];
  const [channel] = useState(() => `buyer-tools-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const showError = useCallback((message: string) => setError(message), []);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then(raw => {
      const data = raw ? JSON.parse(raw) : {};
      if (!data || typeof data !== 'object' || Array.isArray(data) || Object.values(data).some(value => typeof value !== 'string')) throw Error('Invalid tools storage');
      if (active) setHtml(toolsDocument(data, channel));
    }).catch(() => { if (active) setError('Could not load Buyer tools data. Your existing Buyer workspace is unaffected.'); });
    return () => { active = false; };
  }, [channel]);
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={s.screen}>
    {showCards ? <ToolCards /> : <>
    <View style={s.intro}><Text style={s.title}>{heading}</Text><Text style={s.note}>{description}</Text>{destination === 'map' && <Pressable accessibilityRole="button" onPress={() => router.navigate('/master-plan')} style={s.dismiss}><Text style={{ color: colors.green, fontWeight: '600' }}>Tap plots to see CRDA numbers</Text></Pressable>}</View>
    {!!error && <View style={s.error}><Text style={s.errorText}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setError('')} style={s.dismiss}><Text>Dismiss</Text></Pressable></View>}
    {html ? <ToolsView html={html} channel={channel} destination={destination} onError={showError} /> : !error && <ActivityIndicator color={colors.green} style={{ marginTop: 30 }} accessibilityLabel="Loading Buyer tools" />}
    </>}
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: colors.background },
  intro: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.line, gap: 5 },
  title: { color: colors.green, fontSize: 22, fontWeight: '700' },
  note: { fontSize: 12, lineHeight: 18, color: colors.muted },
  gridContent: { padding: 20, paddingBottom: 36, gap: 18, width: '100%', maxWidth: 1100 },
  gridTitle: { color: colors.ink, fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: { flexGrow: 1, flexShrink: 1, flexBasis: 300, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, minHeight: 96, borderRadius: 14, backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, boxShadow: '0 1px 2px rgba(15, 42, 67, 0.05)' },
  cardIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  cardText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  badge: { minWidth: 24, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 9, backgroundColor: colors.green, alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
  error: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#fff0dc', alignItems: 'center' },
  errorText: { flex: 1, color: colors.ink, fontSize: 13 },
  dismiss: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' },
});
