import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { colors } from '../../theme/colors';
export default function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return <View style={{ alignItems: 'center', gap: 16, paddingVertical: 32 }}>
    <Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: '600', color: colors.text, textAlign: 'center' }}>{title}</Text>
    {message && <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center' }}>{message}</Text>}
    {action}
  </View>;
}
