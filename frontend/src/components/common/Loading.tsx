import { ActivityIndicator, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
export default function Loading({ message = 'Loading…' }: { message?: string }) {
  return <View accessibilityLiveRegion="polite" style={{ alignItems: 'center', padding: 24, gap: 12 }}>
    <ActivityIndicator size="large" color={colors.primary} /><Text style={{ color: colors.muted }}>{message}</Text>
  </View>;
}
