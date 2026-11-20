import { ScrollView } from 'react-native';
import type { ReactNode } from 'react';
import { colors } from '../../theme/colors';
export default function Sidebar({ children }: { children: ReactNode }) {
  return <ScrollView style={{ width: 240, flexGrow: 0, backgroundColor: colors.surface }} contentContainerStyle={{ padding: 16, gap: 12 }}>{children}</ScrollView>;
}
