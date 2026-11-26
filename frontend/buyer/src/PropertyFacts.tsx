import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from './AppText';
import type { BuyerListing } from './data/listings';
import { colors } from './theme';
import { propertyDetailGroups, propertyDetailLabels } from '../../shared/property-fields';

export default function PropertyFacts({ property: p }: { property: BuyerListing }) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [error, setError] = useState('');
  const show = (value: unknown) => value === '' || value === undefined || value === null ? 'Not supplied' : typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : String(value);
  const row = (label: string, value: unknown) => <View key={label} style={s.row}><Text style={s.label}>{label}</Text><Text style={s.value}>{show(value)}</Text></View>;
  return <View style={s.section}>
    <Text style={s.heading}>Property facts</Text>
    <Text style={s.note}>Seller-supplied information. References and certificate statements require independent review.</Text>
    <View style={s.card}>
      {row('Listed area', `${p.area.toLocaleString('en-IN')} ${p.unit}`)}
      {row(p.purpose === 'Rent' ? `Monthly rent per ${p.unit}` : `Asking price per ${p.unit}`, p.area > 0 ? `INR ${(p.price / p.area).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : undefined)}
      {row('Bedrooms', p.bedrooms)}{row('District', p.district)}{row('Mandal', p.mandal)}{row('Village / locality', p.locality)}{row('CRDA plot code', p.plotCode)}{row('Survey / subdivision', p.survey)}{row('Approval reference', p.approval)}{row('Road width (m)', p.road)}{row('Seller / business name', p.seller)}
      {row('Latitude', p.latitude?.toFixed(6))}{row('Longitude', p.longitude?.toFixed(6))}
      {p.latitude !== undefined && p.longitude !== undefined && <Pressable accessibilityRole="button" accessibilityLabel="Open property location" onPress={() => { void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`).catch(() => setError('Could not open the map.')); }} style={s.toggle}><Text style={s.action}>Open property location</Text></Pressable>}
    </View>
    {propertyDetailGroups.map(group => {
      const open = expanded.includes(group.title);
      return <View key={group.title} style={s.card}><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setExpanded(old => open ? old.filter(value => value !== group.title) : [...old, group.title])} style={s.toggle}><Text style={s.heading}>{group.title}</Text><Text style={s.action}>{open ? 'Hide' : 'Show'}</Text></Pressable>{open && group.keys.map(key => row(propertyDetailLabels[key], p.insights?.[key]))}</View>;
    })}
    <View style={s.card}><Text style={s.heading}>Amenities</Text><Text style={s.note}>{p.amenities?.length ? p.amenities.join(' · ') : 'Not supplied'}</Text></View>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </View>;
}

const s = StyleSheet.create({
  section: { gap: 12 }, card: { borderWidth: 1, borderColor: colors.line, backgroundColor: 'white', borderRadius: 12, padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' }, label: { flex: 1, fontSize: 13, color: colors.muted, lineHeight: 20 }, value: { flex: 1, fontSize: 13, color: colors.ink, lineHeight: 20 },
  heading: { fontSize: 16, color: colors.ink, fontWeight: '600', flexShrink: 1 }, note: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  toggle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, action: { color: colors.green, fontWeight: '600' }, error: { color: '#a43333' },
});
