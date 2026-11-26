import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { AppText as Text } from './AppText';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, type PropsWithChildren } from 'react';
import { listings, type BuyerListing } from './data/listings';
import { useBuyer } from './state';
import { colors, styles as s } from './theme';

export function money(value: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(value); }
export function Screen({ children }: PropsWithChildren) { return <SafeAreaView style={s.screen} edges={['left', 'right', 'bottom']}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>{children}</ScrollView></SafeAreaView>; }
export function Intro({ title, subtitle }: { title: string; subtitle: string }) {
  const store = useBuyer();
  return <><View style={s.brandRow}><Ionicons name="business-outline" size={30} color={colors.green} /><View><Text style={s.brand}>agentmart</Text><Text style={s.eyebrow}>BUYER STUDIO</Text></View></View>
    {!!store.connectionError && <Text accessibilityRole="alert" style={s.subtitle}>{store.connectionError}</Text>}
    <View style={{ gap: 9 }}><Text accessibilityRole="header" style={s.title}>{title}</Text><Text style={s.subtitle}>{subtitle}</Text></View></>;
}
export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityState={{ selected: !!active }} onPress={onPress} style={[s.chip, active && s.chipActive]}><Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text></Pressable>; }
export function Primary({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) { return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[s.primary, disabled && s.disabled]}><Text style={s.primaryText}>{label}</Text></Pressable>; }
export function Empty({ title, message }: { title: string; message: string }) { return <View style={s.empty}><Ionicons name="home-outline" size={36} color={colors.green} /><Text style={s.heading}>{title}</Text><Text style={[s.subtitle, { textAlign: 'center' }]}>{message}</Text><Primary label="Explore properties" onPress={() => router.navigate('/discover')} /></View>; }

export function PropertyArt({ property }: { property: BuyerListing }) {
  if (property.photo) return <Image source={{ uri: property.photo }} accessibilityLabel={property.title} style={{ width: '100%', height: '100%' }} resizeMode="cover" />;
  const variant = Math.max(0, listings.indexOf(property)) % 4;
  const palette = [['#d9e0e8', '#7d8a98'], ['#eae4d8', '#ab9578'], ['#dce7e8', '#7f9ca3'], ['#e9e2ed', '#a08aa8']][variant];
  const land = property.type === 'Plot' || property.type === 'Farm land';
  return <Svg width="100%" height="100%" viewBox="0 0 600 320" accessibilityLabel={`${property.type} illustration, not a property photograph`} role="img"><Rect width="600" height="320" fill={palette[0]} /><Circle cx="492" cy="60" r="30" fill="#ffffff88" /><Path d="M0 240Q150 155 320 220T600 195V320H0" fill={palette[1]} opacity={0.35} /><Path d="M0 290Q170 225 340 270T600 255V320H0" fill={palette[1]} opacity={0.45} />{land ? <><Path d="m95 222 212-105 199 104-204 103Z" fill="#e4ebf2" stroke="white" strokeWidth={5} /><Path d="m120 221 186-90 174 90-178 88Z" fill={palette[1]} stroke="white" strokeWidth={3} strokeDasharray="10 7" /><Path d="M302 170v-47" stroke={colors.green} strokeWidth={5} /><Circle cx="302" cy="118" r="14" fill={colors.peach} /><Circle cx="100" cy="143" r="28" fill={colors.green} /><Path d="M100 165v40" stroke={colors.green} strokeWidth={7} /></> : <><Path d="m180 235 0-137 128-47 140 65v145l-130 45Z" fill="#faf6eb" /><Path d="m308 51 140 65v145l-130 45Z" fill={palette[1]} /><Path d="m167 99 140-59 154 69-14 18-139-57-129 47Z" fill={colors.green} />{[0, 1, 2, 3].map(row => [0, 1, 2, 3].map(col => <Path key={`${row}-${col}`} d={`m${197 + col * 25} ${119 + row * 31 - col * 9} 14-5v21l-14 5Z`} fill="#a0abb7" />))}{[0, 1, 2].map(row => [0, 1, 2].map(col => <Path key={`r-${row}-${col}`} d={`m${334 + col * 32} ${100 + row * 43 + col * 14} 19 8v25l-19-8Z`} fill="#dae1e9" />))}<Path d="m263 232 25-9v60l-25-6Z" fill={colors.peach} /><Circle cx="490" cy="218" r="32" fill={colors.green} /></>}</Svg>;
}

export function PropertyCard({ property: p, style }: { property: BuyerListing; style?: ViewStyle }) {
  const store = useBuyer();
  const saved = store.saved.includes(p.id), compared = store.compared.includes(p.id);
  const open = () => router.push({ pathname: '/property/[id]', params: { id: p.id } });
  return <View style={[s.card, style]}><View style={s.art}><Pressable accessibilityRole="button" accessibilityLabel={`View ${p.title}`} onPress={open} style={{ flex: 1 }}><PropertyArt property={p} /></Pressable><View style={s.cardBadge}><Text style={s.badgeText}>{p.type} · For {p.purpose.toLowerCase()}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`${saved ? 'Unsave' : 'Save'} ${p.title}`} accessibilityState={{ selected: saved, disabled: !store.ready }} disabled={!store.ready} style={s.heart} onPress={() => store.save(p.id)}><Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? '#b46c50' : colors.green} /></Pressable></View><View style={s.cardBody}><View style={s.row}><Ionicons name="location-outline" size={15} color={colors.muted} /><Text style={s.location}>{p.locality}, {p.city}</Text></View><Pressable accessibilityRole="button" onPress={open}><Text style={s.cardTitle}>{p.title}</Text></Pressable><Text style={s.facts}>{p.area} {p.unit}   ·   {p.bedrooms ? `${p.bedrooms} BHK` : `${p.facing} facing`}</Text><View style={s.divider} /><View style={s.between}><View><Text style={s.price}>{money(p.price)}</Text>{p.purpose === 'Rent' && <Text style={s.location}>per month</Text>}</View><Pressable accessibilityRole="button" accessibilityLabel={`Compare ${p.title}`} accessibilityState={{ selected: compared, disabled: !store.ready }} disabled={!store.ready} style={s.textButton} onPress={() => store.compare(p.id)}><Text style={s.textButtonText}>{compared ? '✓ Comparing' : '+ Compare'}</Text></Pressable></View></View></View>;
}

export function PropertyGrid({ properties }: { properties: BuyerListing[] }) {
  const [width, setWidth] = useState(0);
  const columns = width > 1000 ? 3 : width > 650 ? 2 : 1;
  return <View style={s.grid} onLayout={event => setWidth(event.nativeEvent.layout.width)}>{properties.map(p => <PropertyCard key={p.id} property={p} style={{ width: columns === 1 ? '100%' : Math.floor((width - 18 * (columns - 1)) / columns) }} />)}</View>;
}
