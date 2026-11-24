import { Stack } from 'expo-router';
import BuyerNavigation from '../../BuyerNavigation';
import { colors, fonts } from '../../theme';

export default function BuyerLayout() {
  return <BuyerNavigation><Stack screenOptions={{ headerShown: false, headerTitleStyle: { fontFamily: fonts.heading }, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="discover" />
    <Stack.Screen name="saved" />
    <Stack.Screen name="compare" />
    <Stack.Screen name="drafts" />
    <Stack.Screen name="tools" />
    <Stack.Screen name="property/[id]" options={{ headerShown: true, title: 'Property details', headerTintColor: colors.green, headerStyle: { backgroundColor: colors.background } }} />
  </Stack></BuyerNavigation>;
}
