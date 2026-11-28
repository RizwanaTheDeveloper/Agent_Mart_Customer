import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from './AppText';
import { colors } from './theme';

const banners = [
  { image: require('../assets/ads/apartments-banner.jpg'), title: 'Find your next home', label: 'apartments', type: 'Apartment' },
  { image: require('../assets/ads/homes-banner.jpg'), title: 'Space to live more', label: 'homes', type: 'House' },
  { image: require('../assets/ads/plots-banner.jpg'), title: 'Land for your plans', label: 'plots', type: 'Plot' },
  { image: require('../assets/ads/commercial-banner.jpg'), title: 'Room for your business', label: 'commercial spaces', type: 'Commercial' },
] as const;
const advertiserUrl = 'https://1acre.in/buy-land';

export default function BuyerAdCarousel() {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const selected = useRef(0);
  const [active, setActive] = useState(0), [width, setWidth] = useState(0);
  const [linkError, setLinkError] = useState('');
  useEffect(() => { scroll.current?.scrollTo({ x: selected.current * width, animated: false }); }, [width]);

  function show(index: number) {
    const next = (index + banners.length) % banners.length;
    selected.current = next; setActive(next);
    scroll.current?.scrollTo({ x: next * width, animated: false });
  }

  return <View style={styles.section}>
    <View style={styles.heading}>
      <Text style={styles.label}>ADVERTISEMENT · AGENTMART</Text>
      <Text style={styles.counter} accessibilityLiveRegion="polite">{active + 1} / {banners.length}</Text>
    </View>
    <View style={styles.frame} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <ScrollView ref={scroll} horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEventThrottle={32}
        onScroll={event => {
          if (!width) return;
          const index = Math.max(0, Math.min(banners.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
          selected.current = index; setActive(index);
        }}>
        {banners.map((banner, index) => <Pressable key={banner.type} accessibilityRole="link"
          accessibilityLabel={`Explore ${banner.label}: ${banner.title}`}
          accessibilityHint="Open the 1acre buy-land website in your browser"
          accessibilityElementsHidden={index !== active} importantForAccessibility={index === active ? 'auto' : 'no-hide-descendants'}
          {...(Platform.OS === 'web'
            ? { href: advertiserUrl, hrefAttrs: { target: '_blank', rel: 'noopener noreferrer' } }
            : { onPress: () => {
              setLinkError('');
              void Linking.openURL(advertiserUrl).catch(() => setLinkError('Could not open 1acre.in. Please try again.'));
            } })}
          style={({ pressed }) => [{ width: width || 1, aspectRatio: 2 }, pressed && styles.pressed]}>
          <Image source={banner.image} accessible={false} resizeMode="contain" style={styles.image} />
        </Pressable>)}
      </ScrollView>
    </View>
    <View style={styles.controls}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous advertisement" onPress={() => show(selected.current - 1)} style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={20} color={colors.green} />
      </Pressable>
      <View style={styles.dots}>{banners.map((banner, index) => <Pressable key={banner.type}
        accessibilityRole="button" accessibilityLabel={`Show ${banner.label} advertisement`} accessibilityState={{ selected: index === active }} aria-pressed={index === active}
        onPress={() => show(index)} style={styles.dotTarget}>
        <View style={[styles.dot, index === active && styles.dotActive]} />
      </Pressable>)}</View>
      <Pressable accessibilityRole="button" accessibilityLabel="Next advertisement" onPress={() => show(selected.current + 1)} style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
        <Ionicons name="chevron-forward" size={20} color={colors.green} />
      </Pressable>
    </View>
    <Text style={styles.note}>Promotional imagery. Explore opens 1acre.in in your browser.</Text>
    {!!linkError && <Text accessibilityRole="alert" style={styles.note}>{linkError}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 8, width: '100%' },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  label: { fontSize: 10, letterSpacing: 1.2, color: colors.muted, flexShrink: 1 },
  counter: { fontSize: 12, color: colors.muted },
  frame: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#061e56', width: '100%' },
  image: { width: '100%', height: '100%' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  dots: { flexDirection: 'row', alignItems: 'center' },
  dotTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#bcc9da' },
  dotActive: { width: 22, backgroundColor: colors.green },
  note: { fontSize: 11, lineHeight: 16, color: colors.muted },
  pressed: { opacity: 0.8 },
});
