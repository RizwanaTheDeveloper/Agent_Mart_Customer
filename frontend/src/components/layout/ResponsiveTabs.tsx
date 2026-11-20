import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { colors } from '../../theme/colors';

type Tab = { name: string; title: string; symbol: string };
export default function ResponsiveTabs({ tabs }: { tabs: Tab[] }) {
  const { isDesktop } = useResponsive();
  return <Tabs screenOptions={{
    tabBarPosition: isDesktop ? 'left' : 'bottom',
    tabBarLabelPosition: isDesktop ? 'beside-icon' : 'below-icon',
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: isDesktop ? { width: 240, paddingTop: 24, backgroundColor: colors.surface } : { backgroundColor: colors.surface },
    tabBarItemStyle: { minHeight: 52 },
    headerTitleStyle: { color: colors.text },
    sceneStyle: { backgroundColor: colors.background },
  }}>
    {tabs.map(tab => <Tabs.Screen key={tab.name} name={tab.name} options={{
      title: tab.title,
      tabBarAccessibilityLabel: tab.title,
      tabBarIcon: ({ color }) => <Text accessibilityElementsHidden style={{ color, fontSize: 20 }}>{tab.symbol}</Text>,
    }} />)}
  </Tabs>;
}
