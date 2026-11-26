import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText as Text } from './AppText';
import { preferredTypes, readBuyerPreferences, saveBuyerPreferences, type BuyerPreferences } from './buyer-preferences';
import { colors } from './theme';

export default function BuyerPreferencesForm({ accountId }: { accountId: string }) {
  const [value, setValue] = useState<BuyerPreferences>({ city: '', type: '', maxPrice: '' });
  const [busy, setBusy] = useState(true), [message, setMessage] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    readBuyerPreferences(accountId).then(saved => { if (active && saved) setValue(saved); }).catch(() => { if (active) setError('Preferences could not be loaded.'); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [accountId]);
  async function save() {
    setBusy(true); setError(''); setMessage('');
    try { setValue(await saveBuyerPreferences(accountId, value)); setMessage('Preferences saved for this account on this device.'); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  return <View style={s.form}>
    <Text style={s.heading}>My search preferences</Text>
    <Text style={s.note}>Defaults for Discover. Stored on this device for your account.</Text>
    <Text style={s.label}>Preferred city</Text><TextInput accessibilityLabel="Preferred city" value={value.city} maxLength={100} onChangeText={city => setValue({ ...value, city })} editable={!busy} style={s.input} placeholder="Any city" />
    <Text style={s.label}>Preferred property type</Text><View style={s.types}>{preferredTypes.map(type => <Pressable key={type} accessibilityRole="button" accessibilityLabel={`Prefer ${type || 'any property type'}`} accessibilityState={{ selected: value.type === type }} disabled={busy} onPress={() => setValue({ ...value, type })} style={[s.type, value.type === type && s.active]}><Text style={value.type === type ? s.selected : s.label}>{type || 'Any type'}</Text></Pressable>)}</View>
    <Text style={s.label}>Budget ceiling (INR)</Text><TextInput accessibilityLabel="Budget ceiling (INR)" keyboardType="decimal-pad" value={value.maxPrice} maxLength={16} onChangeText={maxPrice => setValue({ ...value, maxPrice })} editable={!busy} style={s.input} placeholder="No budget limit" />
    <Pressable accessibilityRole="button" accessibilityLabel="Save preferences" disabled={busy} onPress={() => void save()} style={s.save}><Text style={s.selected}>{busy ? 'Please wait...' : 'Save preferences'}</Text></Pressable>
    {!!message && <Text accessibilityRole="status" style={s.note}>{message}</Text>}{!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </View>;
}

const s = StyleSheet.create({
  form: { gap: 12, borderTopWidth: 1, borderColor: colors.line, paddingTop: 20 }, heading: { fontSize: 18, fontWeight: '600', color: colors.ink }, note: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  label: { color: colors.ink, fontSize: 14 }, input: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 8, color: colors.ink },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, type: { minHeight: 44, padding: 12, borderRadius: 8, backgroundColor: colors.background }, active: { backgroundColor: colors.green },
  save: { backgroundColor: colors.green, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }, selected: { color: 'white', fontWeight: '600' }, error: { color: '#a43333' },
});
