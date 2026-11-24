import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../../AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import ToolsView from '../../buyer-tools/ToolsView';
import { toolsDocument } from '../../buyer-tools/document';
import { storageKey } from '../../buyer-tools/bridge';
import { colors } from '../../theme';

export default function BuyerTools() {
  const { view } = useLocalSearchParams<{ view?: string }>();
  const destination = view === 'map' || view === 'legal' || view === 'crda' ? view : 'home';
  const heading = { map: 'Map', legal: 'Legal', crda: 'CRDA plots', home: 'Buyer tools' }[destination];
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
    <View style={s.intro}><Text style={s.title}>{heading}</Text><Text style={s.note}>{description}</Text></View>
    {!!error && <View style={s.error}><Text style={s.errorText}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setError('')} style={s.dismiss}><Text>Dismiss</Text></Pressable></View>}
    {html ? <ToolsView html={html} channel={channel} destination={destination} onError={showError} /> : !error && <ActivityIndicator color={colors.green} style={{ marginTop: 30 }} accessibilityLabel="Loading Buyer tools" />}
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: colors.background },
  intro: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.line, gap: 5 },
  title: { color: colors.green, fontSize: 22, fontWeight: '700' },
  note: { fontSize: 12, lineHeight: 18, color: colors.muted },
  error: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#fff0dc', alignItems: 'center' },
  errorText: { flex: 1, color: colors.ink, fontSize: 13 },
  dismiss: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' },
});
