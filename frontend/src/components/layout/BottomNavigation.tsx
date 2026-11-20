import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { colors } from '../../theme/colors';
export default function BottomNavigation({ children }: { children: ReactNode }) {
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={{ backgroundColor: colors.surface }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 }}>{children}</View>
  </SafeAreaView>;
}
