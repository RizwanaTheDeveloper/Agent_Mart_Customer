import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../auth/AuthProvider';
import { readBuyerPreferences } from '../../buyer-preferences';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { AppText as Text } from '../../AppText';
import { Chip, Intro, PropertyGrid, Screen, money } from '../../components';
import { useBuyer } from '../../state';
import { colors, styles as s } from '../../theme';
import BuyerAdCarousel from '../../BuyerAdCarousel';

export default function Discover() {
  const { listings, session } = useBuyer();
  const auth = useAuth();
  const accountId = auth.session?.user.id || session?.user.id;
  const [search, setSearch] = useState(''), [purpose, setPurpose] = useState('Sale'), [type, setType] = useState('All types'), [city, setCity] = useState('All cities'), [budget, setBudget] = useState(0), [sort, setSort] = useState('Recommended');
  useFocusEffect(useCallback(() => {
    let active = true;
    if (accountId) void readBuyerPreferences(accountId).then(saved => { if (active && saved) { setCity(saved.city || 'All cities'); setType(saved.type || 'All types'); setBudget(Number(saved.maxPrice) || 0); } }).catch(() => { /* Keep the current filters when device storage is unavailable. */ });
    return () => { active = false; };
  }, [accountId]));
  function reset() { setSearch(''); setType('All types'); setCity('All cities'); setBudget(0); setSort('Recommended'); }
  const filtered = listings.filter(p => p.purpose === purpose && (type === 'All types' || p.type === type) && (city === 'All cities' || p.city.toLowerCase() === city.toLowerCase()) && (!budget || p.price <= budget) && `${p.title} ${p.city} ${p.locality}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => sort === 'Price: low' ? a.price - b.price : sort === 'Price: high' ? b.price - a.price : 0);
  return <Screen><Intro title="Find a place that feels like you." subtitle="Explore spaces and make room for what’s next." /><BuyerAdCarousel /><View style={s.hero}><Text style={s.eyebrow}>GOOD PLACES. NEW BEGINNINGS.</Text><Text style={s.heroTitle}>Your next chapter{ '\n' }starts with a place.</Text><Text style={s.subtitle}>From your first home to your next investment, find the space for what matters.</Text><View style={s.row}>{['Sale', 'Rent'].map(value => <Chip key={value} label={value === 'Sale' ? 'Buy a property' : 'Find a rental'} active={purpose === value} onPress={() => { setPurpose(value); setBudget(0); }} />)}</View></View><View style={s.search}><Ionicons name="search-outline" size={21} color={colors.muted} /><TextInput accessibilityLabel="Search properties" placeholder="City, locality or property" placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} style={s.input} returnKeyType="search" />{search ? <Pressable accessibilityLabel="Clear search" accessibilityRole="button" onPress={() => setSearch('')} style={{ padding: 10 }}><Ionicons name="close" size={20} color={colors.green} /></Pressable> : null}</View><Filter title="Property type" values={['All types', 'Plot', 'Apartment', 'House', 'Commercial', 'Farm land']} value={type} onChange={setType} /><Filter title="Location" values={[...new Set(['All cities', ...listings.map(p => p.city).filter(Boolean), city])]} value={city} onChange={setCity} /><View><Text style={s.filterLabel}>{purpose === 'Rent' ? 'Maximum monthly rent' : 'Maximum price'}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>{[...new Set([0, ...(purpose === 'Rent' ? [20000, 30000, 50000] : [5000000, 7500000, 10000000, 15000000]), budget])].map(value => <Chip key={value} label={value ? money(value) : 'Any budget'} active={budget === value} onPress={() => setBudget(value)} />)}</ScrollView></View><View style={s.between}><Text style={s.heading}>{filtered.length} {filtered.length === 1 ? 'property' : 'properties'}</Text><Pressable accessibilityRole="button" onPress={reset} style={s.textButton}><Text style={s.textButtonText}>Reset filters</Text></Pressable></View><Filter title="Sort by" values={['Recommended', 'Price: low', 'Price: high']} value={sort} onChange={setSort} />{filtered.length ? <PropertyGrid properties={filtered} /> : <View style={s.empty}><Text style={s.heading}>No properties match just yet.</Text><Text style={s.subtitle}>Try another location, type or budget.</Text><Pressable accessibilityRole="button" onPress={reset} style={s.primary}><Text style={s.primaryText}>Reset filters</Text></Pressable></View>}</Screen>;
}
function Filter({ title, values, value, onChange }: { title: string; values: string[]; value: string; onChange: (next: string) => void }) { return <View><Text style={s.filterLabel}>{title}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>{values.map(next => <Chip key={next} label={next} active={value === next} onPress={() => onChange(next)} />)}</ScrollView></View>; }
