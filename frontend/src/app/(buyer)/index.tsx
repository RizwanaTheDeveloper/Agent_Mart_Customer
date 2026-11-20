import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Grid, useBreakpoint } from '../../components/ui';

type Property = { id: string; title: string; type: string; purpose: 'Sale' | 'Rent'; city: string; price: number; area: number; unit: string };

// Sample listings (fictional). Replace with api.get('/market/properties') when the backend is running.
const SAMPLE: Property[] = [
  { id: 'dp0', title: 'Demo Corner Plot', type: 'Plot', purpose: 'Sale', city: 'Vijayawada', price: 4500000, area: 200, unit: 'sq yd' },
  { id: 'dp1', title: 'Demo Garden Residences 3BHK', type: 'Apartment', purpose: 'Sale', city: 'Guntur', price: 6200000, area: 1450, unit: 'sq ft' },
  { id: 'dp2', title: 'Demo Farm Land', type: 'Farm land', purpose: 'Sale', city: 'Amaravati', price: 9800000, area: 2, unit: 'acre' },
  { id: 'dp3', title: 'Demo Independent House', type: 'House', purpose: 'Rent', city: 'Vijayawada', price: 22000, area: 1800, unit: 'sq ft' },
];
const TYPES = ['All', 'Plot', 'Apartment', 'House', 'Commercial', 'Farm land'];
const money = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function BuyerHome() {
  const router = useRouter();
  const bp = useBreakpoint();
  const [q, setQ] = useState('');
  const [type, setType] = useState('All');
  const [saved, setSaved] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);

  const rows = useMemo(() => SAMPLE.filter(p =>
    (type === 'All' || p.type === type) &&
    (!q || `${p.title} ${p.city}`.toLowerCase().includes(q.toLowerCase()))), [q, type]);
  const toggle = (list: string[], set: (v: string[]) => void, id: string, max = 99) =>
    set(list.includes(id) ? list.filter(x => x !== id) : list.length < max ? [...list, id] : list);

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={[s.content, { padding: bp.gutter, maxWidth: bp.maxWidth }]} keyboardShouldPersistTaps="handled">
        <View style={s.hero}>
          <Text style={s.eyebrow}>BUYER DASHBOARD</Text>
          <Text style={s.h1}>A home for your next big decision.</Text>
          <Text style={s.heroText}>Discover the property. Understand the evidence.</Text>
        </View>

        <View style={s.metrics}>
          <Metric label="Saved" value={saved.length} onPress={() => router.push('/(buyer)/(tabs)/saved')} />
          <Metric label="Enquiries" value={0} onPress={() => router.push('/(buyer)/enquiries')} />
          <Metric label="Compare" value={compare.length} onPress={() => router.push('/(buyer)/properties/compare')} />
        </View>

        <TextInput style={s.input} value={q} onChangeText={setQ} placeholder="Village, city, project or plot code" placeholderTextColor={colors.muted} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: spacing.sm }}>
          {TYPES.map(t => (
            <Pressable key={t} onPress={() => setType(t)} style={[s.chip, type === t && s.chipOn]}>
              <Text style={[s.chipText, type === t && { color: colors.onPrimary }]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={s.h2}>Explore your options <Text style={s.muted}>({rows.length})</Text></Text>
        <Grid>        {rows.map(p => (
          <Pressable key={p.id} style={s.card} onPress={() => router.push({ pathname: '/(buyer)/properties/[id]', params: { id: p.id } })}>
            <Text style={s.cat}>{p.type.toUpperCase()} · {p.purpose.toUpperCase()}</Text>
            <Text style={s.title}>{p.title}</Text>
            <Text style={s.muted}>{p.city} · {p.area.toLocaleString('en-IN')} {p.unit}</Text>
            <Text style={s.price}>{money(p.price)}{p.purpose === 'Rent' ? ' / month' : ''}</Text>
            <View style={s.row}>
              <Pressable onPress={() => toggle(saved, setSaved, p.id)}><Text style={s.link}>{saved.includes(p.id) ? '♥ Saved' : '♡ Save'}</Text></Pressable>
              <Pressable onPress={() => toggle(compare, setCompare, p.id, 3)}><Text style={s.link}>{compare.includes(p.id) ? '✓ Comparing' : 'Compare'}</Text></Pressable>
            </View>
          </Pressable>
        ))}
        </Grid>
        {!rows.length && <Text style={s.muted}>No matching properties. Change your filters.</Text>}
        <Text style={s.foot}>Sample listings are fictional. Seller-published claims are not independently verified.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value, onPress }: { label: string; value: number; onPress: () => void }) {
  return <Pressable style={s.metric} onPress={onPress}><Text style={s.metricNum}>{value}</Text><Text style={s.muted}>{label}</Text></Pressable>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, maxWidth: 800, width: '100%', alignSelf: 'center' },
  hero: { backgroundColor: colors.primary, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md },
  eyebrow: { color: '#c9c7f1', fontSize: 12, letterSpacing: 1.2, fontWeight: '700' },
  h1: { color: colors.onPrimary, fontSize: 26, fontWeight: '800', marginVertical: spacing.sm },
  heroText: { color: '#e4e3f8' },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  metric: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center' },
  metricNum: { fontSize: 24, fontWeight: '800', color: colors.text },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginRight: spacing.sm },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  h2: { fontSize: 20, fontWeight: '700', color: colors.text, marginVertical: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  cat: { fontSize: 11, letterSpacing: 1, color: colors.primary, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, marginVertical: 4 },
  price: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  link: { color: colors.primary, fontWeight: '600' },
  muted: { color: colors.muted },
  foot: { color: colors.muted, fontSize: 12, marginTop: spacing.md },
});
