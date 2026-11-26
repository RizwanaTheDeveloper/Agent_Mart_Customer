import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText as Text } from '../../AppText';
import { Empty, Intro, PropertyArt, Screen, money } from '../../components';
import { useBuyer } from '../../state';
import { styles as s } from '../../theme';

export default function Compare() {
  const store = useBuyer(), properties = store.listings.filter(p => store.compared.includes(p.id));
  return <Screen><Intro title="See the bigger picture." subtitle="Compare up to three properties side by side." />{properties.length ? <><ScrollView horizontal contentContainerStyle={{ gap: 14 }} showsHorizontalScrollIndicator>{properties.map(p => <View key={p.id} style={s.compareColumn}><View style={{ height: 140 }}><PropertyArt property={p} /></View><View style={{ padding: 15, minHeight: 125, gap: 8 }}><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/property/[id]', params: { id: p.id } })}><Text style={s.cardTitle}>{p.title}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${p.title} from comparison`} onPress={() => store.compare(p.id)} style={s.textButton}><Text style={s.textButtonText}>Remove</Text></Pressable></View>{[['Price', `${money(p.price)}${p.purpose === 'Rent' ? ' / month' : ''}`], ['Purpose', p.purpose], ['Location', `${p.locality}, ${p.city}`], ['Type', p.type], ['Area', `${p.area} ${p.unit}`], ['Bedrooms', p.bedrooms ? String(p.bedrooms) : 'Not applicable'], ['Facing', p.facing]].map(([label, value]) => <View key={label} style={s.comparisonValue}><Text style={s.location}>{label}</Text><Text style={s.facts}>{value}</Text></View>)}</View>)}</ScrollView><Text style={s.subtitle}>Sale prices and monthly rents use different time periods. Check the listing purpose when comparing.</Text></> : <Empty title="Find your best fit." message="Use Compare on a property card to add it here." />}</Screen>;
}
