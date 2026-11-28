import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { AppText as Text } from './AppText';
import type { BuyerListing } from './data/listings';
import { categoryInfo, distanceText, landmarksAround, plotBoundary, radii, type Place, type Radius } from './nearby';
import { colors, styles as s } from './theme';

// Property boundary drawn from the official plot outline (when the listing has a CRDA plot code).
function Boundary({ code }: { code: string }) {
  const [rings, setRings] = useState<[number, number][][] | null | undefined>(undefined), [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    plotBoundary(code).then(value => { if (live) setRings(value); }).catch(() => { if (live) { setFailed(true); setRings(null); } });
    return () => { live = false; };
  }, [code]);
  if (rings === undefined) return <Text style={s.location}>Looking up the plot boundary…</Text>;
  if (!rings) return <Text style={s.location}>{failed ? `Could not reach APCRDA to load the boundary of plot ${code}. Try again later.` : `No official APCRDA outline was found for plot code ${code}. Check the code with the seller.`}</Text>;
  const all = rings.flat(), lons = all.map(p => p[0]), lats = all.map(p => p[1]);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons), minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const scale = 1000 / Math.max(maxLon - minLon || 1e-9, (maxLat - minLat || 1e-9));
  const width = (maxLon - minLon) * scale, height = (maxLat - minLat) * scale, pad = 40;
  const points = (ring: [number, number][]) => ring.map(([lon, lat]) => `${pad + (lon - minLon) * scale},${pad + (maxLat - lat) * scale}`).join(' ');
  return <View style={st.boundary}>
    <Svg width="100%" height={190} viewBox={`0 0 ${width + pad * 2} ${height + pad * 2}`} accessibilityLabel={`Boundary of plot ${code}`}>
      {rings.map((ring, index) => <Polygon key={index} points={points(ring)} fill="#1e5aa826" stroke={colors.green} strokeWidth={6} strokeLinejoin="round" />)}
    </Svg>
    <Text style={s.location}>Official APCRDA outline of plot {code}. Verify exact boundaries with a licensed survey.</Text>
  </View>;
}

export default function NearbyLandmarks({ property: p }: { property: BuyerListing }) {
  const [radius, setRadius] = useState<Radius>(1000), [attempt, setAttempt] = useState(0);
  const located = p.latitude !== undefined && p.longitude !== undefined;
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return <View style={st.box}>
    <Text accessibilityRole="header" style={s.heading}>Boundary and nearby landmarks</Text>
    {p.plotCode ? <Boundary key={p.plotCode} code={p.plotCode} /> : null}
    {!located ? <Text style={s.subtitle}>This listing has no confirmed location, so nearby landmarks cannot be shown.</Text> : <>
      <Text style={s.filterLabel}>Show landmarks within</Text>
      <View style={st.row}>{radii.map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: radius === value }} onPress={() => setRadius(value)} style={[s.chip, radius === value && s.chipActive]}><Text style={[s.chipText, radius === value && s.chipTextActive]}>{value / 1000} km</Text></Pressable>)}</View>
      <NearbyResults key={`${p.id}:${p.latitude}:${p.longitude}:${radius}:${attempt}`} latitude={p.latitude!} longitude={p.longitude!} radius={radius} retry={retry} />
    </>}
  </View>;
}

// A different location, radius or retry creates a fresh search with initial loading state.
function NearbyResults({ latitude, longitude, radius, retry }: { latitude: number; longitude: number; radius: Radius; retry: () => void }) {
  const [places, setPlaces] = useState<Place[] | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  useEffect(() => {
    const controller = new AbortController();
    landmarksAround(latitude, longitude, radius, controller.signal)
      .then(result => { if (!controller.signal.aborted) setPlaces(result); })
      .catch(error => { if (!controller.signal.aborted) setError((error as Error).message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [latitude, longitude, radius]);

  const groups = new Map<string, number>();
  for (const place of places || []) { const label = categoryInfo(place.category).label; groups.set(label, (groups.get(label) || 0) + 1); }
  const shown = (places || []).filter(place => category === 'All' || categoryInfo(place.category).label === category);

  return <>
      {loading && <View style={st.center}><ActivityIndicator color={colors.green} /><Text style={s.location}>Finding landmarks within {radius / 1000} km…</Text></View>}
      {!!error && <View style={st.error}><Text accessibilityRole="alert" style={st.errorText}>{error}</Text><Pressable accessibilityRole="button" onPress={retry} style={[s.chip, { alignSelf: 'flex-start' }]}><Text style={s.chipText}>Try again</Text></Pressable></View>}
      {places && !loading && <>
        <Text style={s.subtitle}>{places.length ? `${places.length} landmark${places.length === 1 ? '' : 's'} within ${radius / 1000} km` : `No mapped landmarks found within ${radius / 1000} km. Try a larger distance.`}</Text>
        {places.length > 0 && <View style={st.row}>{['All', ...groups.keys()].map(label => <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected: category === label }} onPress={() => setCategory(label)} style={[s.chip, category === label && s.chipActive]}><Text style={[s.chipText, category === label && s.chipTextActive]}>{label === 'All' ? `All (${places.length})` : `${label} (${groups.get(label)})`}</Text></Pressable>)}</View>}
        {shown.slice(0, 150).map(place => <Pressable key={place.id} accessibilityRole="link" accessibilityLabel={`${place.name}, ${distanceText(place.distanceM)}. Open map`} onPress={() => { void Linking.openURL(`https://www.openstreetmap.org/${place.id}`); }} style={st.place}>
          <View style={st.icon}><Ionicons name={categoryInfo(place.category).icon as 'school-outline'} size={19} color={colors.green} /></View>
          <View style={{ flex: 1 }}><Text style={st.name}>{place.name}</Text><Text style={s.location}>{categoryInfo(place.category).label.replace(/s$/, '')}</Text></View>
          <Text style={st.distance}>{distanceText(place.distanceM)}</Text>
        </Pressable>)}
        {shown.length > 150 && <Text style={s.location}>Showing the nearest 150. Choose a category to narrow the list.</Text>}
        {places.length > 0 && <Text style={s.location}>Landmarks come from OpenStreetMap community data. Completeness and opening status are not verified.</Text>}
      </>}
  </>;
}

const st = StyleSheet.create({
  box: { gap: 12, backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  center: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  error: { gap: 10, backgroundColor: '#fdf0f0', borderRadius: 10, padding: 12 },
  errorText: { color: '#9b2c2c', fontSize: 14, lineHeight: 20 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.line },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  distance: { color: colors.green, fontSize: 14, fontWeight: '700' },
  boundary: { gap: 6, backgroundColor: colors.soft, borderRadius: 12, padding: 12 },
});
