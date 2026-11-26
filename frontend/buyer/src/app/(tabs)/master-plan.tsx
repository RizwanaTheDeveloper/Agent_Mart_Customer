import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../../AppText';
import ToolsView from '../../buyer-tools/ToolsView';
import { masterPlanDocument } from '../../master-plan/document';
import { colors } from '../../theme';

export default function MasterPlan() {
  const [channel] = useState(() => `master-plan-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [html] = useState(() => masterPlanDocument(channel));
  const [error, setError] = useState('');
  const onError = useCallback((message: string) => setError(message), []);
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={s.screen}>
    <View style={s.intro}><Text accessibilityRole="header" style={s.title}>CRDA master plan</Text><Text style={s.note}>Explore public planning layers and look up plot land-use details from APCRDA.</Text>{!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}</View>
    <ToolsView html={html} channel={channel} destination="crda" onError={onError} />
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: colors.background },
  intro: { padding: 16, gap: 5, borderBottomWidth: 1, borderColor: colors.line },
  title: { fontSize: 22, fontWeight: '700', color: colors.green },
  note: { fontSize: 12, lineHeight: 18, color: colors.muted },
  error: { color: '#a43333', fontSize: 13 },
});
