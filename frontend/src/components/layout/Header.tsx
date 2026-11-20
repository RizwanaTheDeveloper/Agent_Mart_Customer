import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { colors } from '../../theme/colors';
export default function Header({ title, actions }: { title: string; actions?: ReactNode }) {
  const { isMobile } = useResponsive();
  return <View style={{ flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', alignItems: isMobile ? 'stretch' : 'center', gap: 16 }}>
    <Text accessibilityRole="header" style={{ flexShrink: 1, flexGrow: 1, fontSize: isMobile ? 24 : 32, fontWeight: '700', color: colors.text }}>{title}</Text>
    {actions && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{actions}</View>}
  </View>;
}
