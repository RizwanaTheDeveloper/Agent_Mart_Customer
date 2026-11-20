import { Children, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

/** Breakpoints: phone < 600, tablet 600-1023, desktop/web >= 1024. Re-renders on rotation or window resize. */
export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  const size: 'phone' | 'tablet' | 'wide' = width >= 1024 ? 'wide' : width >= 600 ? 'tablet' : 'phone';
  return {
    width, height, size,
    isPhone: size === 'phone',
    isLandscape: width > height,
    columns: size === 'wide' ? 3 : size === 'tablet' ? 2 : 1,
    gutter: size === 'phone' ? spacing.md : spacing.lg,
    maxWidth: size === 'wide' ? 1100 : size === 'tablet' ? 860 : 560,
  };
}

/** Lays children out in 1/2/3 columns depending on screen width. Pass `columns` to cap the count. */
export function Grid({ children, columns }: { children: ReactNode; columns?: number }) {
  const bp = useBreakpoint();
  const cols = Math.min(columns ?? bp.columns, bp.columns);
  const gap = spacing.sm;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -gap / 2 }}>
      {Children.toArray(children).map((c, i) => (
        <View key={i} style={{ width: `${100 / cols}%`, paddingHorizontal: gap / 2 }}>{c}</View>
      ))}
    </View>
  );
}

/** Scrollable page with title, optional eyebrow/subtitle. Handles safe areas, keyboard and screen size. */
export function Screen({ title, eyebrow, subtitle, children }: { title: string; eyebrow?: string; subtitle?: string; children: ReactNode }) {
  const bp = useBreakpoint();
  return (
    <SafeAreaView style={u.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[u.content, { padding: bp.gutter, maxWidth: bp.maxWidth }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentInsetAdjustmentBehavior="automatic"
        >
          {eyebrow ? <Text style={u.eyebrow}>{eyebrow}</Text> : null}
          <Text style={[u.h1, bp.isPhone && { fontSize: 24 }]} accessibilityRole="header">{title}</Text>
          {subtitle ? <Text style={[u.muted, { marginBottom: spacing.md }]}>{subtitle}</Text> : null}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Card({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  if (!onPress) return <View style={u.card}>{children}</View>;
  return (
    <Pressable style={({ pressed }) => [u.card, Platform.OS === 'ios' && pressed && { opacity: 0.7 }]} android_ripple={{ color: '#deddf6' }} onPress={onPress}>
      {children}
    </Pressable>
  );
}

export const H2 = ({ children }: { children: ReactNode }) => <Text style={u.h2} accessibilityRole="header">{children}</Text>;
export const Muted = ({ children }: { children: ReactNode }) => <Text style={u.muted}>{children}</Text>;
export const Label = ({ children }: { children: ReactNode }) => <Text style={u.label}>{children}</Text>;
export const Tag = ({ children }: { children: ReactNode }) => <Text style={u.tag}>{children}</Text>;

export function Row({ label, value }: { label: string; value: ReactNode }) {
  return <View style={u.kv}><Text style={[u.muted, { flexShrink: 1 }]}>{label}</Text><Text style={u.value}>{value}</Text></View>;
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return <View style={u.stat}><Text style={u.statNum} adjustsFontSizeToFit numberOfLines={1}>{value}</Text><Text style={u.muted} numberOfLines={1}>{label}</Text></View>;
}
export const Stats = ({ children }: { children: ReactNode }) => <View style={u.stats}>{children}</View>;

export function Btn({ title, onPress, variant = 'primary' }: { title: string; onPress?: () => void; variant?: 'primary' | 'outline' | 'danger' }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
      style={({ pressed }) => [u.btn, variant === 'outline' && u.btnOutline, variant === 'danger' && u.btnDanger, Platform.OS === 'ios' && pressed && { opacity: 0.7 }]}
    >
      <Text style={[u.btnText, variant === 'outline' && { color: colors.primary }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={u.label}>{label}</Text>
      <TextInput
        style={[u.input, props.multiline && { minHeight: 96, textAlignVertical: 'top' }]}
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        {...props}
      />
    </View>
  );
}

export function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm, flexGrow: 0 }}>
      {options.map(o => (
        <Pressable key={o} onPress={() => onChange(o)} accessibilityRole="button" accessibilityState={{ selected: value === o }} style={[u.chip, value === o && u.chipOn]}>
          <Text style={{ color: value === o ? colors.onPrimary : colors.text }}>{o}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export const Empty = ({ title, hint }: { title: string; hint?: string }) => (
  <View style={[u.card, { alignItems: 'center' }]}><Text style={u.h2}>{title}</Text>{hint ? <Text style={u.muted}>{hint}</Text> : null}</View>
);

export const money = (n: number) => '₹' + n.toLocaleString('en-IN');

const shadow = Platform.select({
  ios: { shadowColor: '#0d0b2e', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  android: { elevation: 1 },
  default: {},
});

export const u = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl, width: '100%', alignSelf: 'center' },
  eyebrow: { fontSize: 12, letterSpacing: 1.2, fontWeight: '700', color: colors.primary },
  h1: { fontSize: 26, fontWeight: '800', color: colors.text, marginVertical: spacing.sm },
  h2: { fontSize: 18, fontWeight: '700', color: colors.text, marginVertical: spacing.sm },
  muted: { color: colors.muted },
  label: { color: colors.text, fontWeight: '600', marginBottom: 6 },
  value: { color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  tag: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.primary, marginBottom: 2 },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm, ...shadow },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 6 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  stat: { flexGrow: 1, flexBasis: '45%', minWidth: 120, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center', ...shadow },
  statNum: { fontSize: 24, fontWeight: '800', color: colors.text },
  btn: { backgroundColor: colors.primary, borderRadius: 10, minHeight: 48, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginVertical: 4, overflow: 'hidden' },
  btnOutline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  btnDanger: { backgroundColor: colors.danger },
  btnText: { color: colors.onPrimary, fontWeight: '700', fontSize: 16 },
  // 16px font stops iOS from zooming the page when an input is focused.
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 14 : 10, minHeight: 48, fontSize: 16, color: colors.text },
  chip: { paddingHorizontal: 14, minHeight: 40, justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginRight: spacing.sm },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
