import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { Pressable, View } from 'react-native';
import { AppText as Text } from '../AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuyerProvider, useBuyer } from '../state';
import { colors, fonts, styles as s } from '../theme';
import WorkspaceSwitch from '../WorkspaceSwitch';

function Notice() { const store = useBuyer(); const insets = useSafeAreaInsets(); return store.notice ? <View style={[s.toast, { bottom: 18 + insets.bottom }]} accessibilityLiveRegion="polite"><Text style={s.toastText}>{store.notice}</Text><Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={store.dismiss} style={{ padding: 10 }}><Text style={{ color: 'white', fontSize: 20 }}>×</Text></Pressable></View> : null; }
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    AgentMartBody: require('../../assets/fonts/DMSans-Regular.ttf'),
    AgentMartBodySemiBold: require('../../assets/fonts/DMSans-SemiBold.ttf'),
    AgentMartBodyBold: require('../../assets/fonts/DMSans-Bold.ttf'),
    AgentMartHeading: require('../../assets/fonts/Manrope-Bold.ttf'),
    AgentMartHeadingExtraBold: require('../../assets/fonts/Manrope-ExtraBold.ttf'),
  });
  if (!fontsLoaded && !fontError) return null;
  return <BuyerProvider><View style={{ flex: 1 }}><StatusBar style="dark" /><WorkspaceSwitch />
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.green, headerTitleStyle: { fontFamily: fonts.heading }, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'AgentMart' }} />
      <Stack.Screen name="seller" options={{ headerShown: false, title: 'AgentMart Seller' }} />
      <Stack.Screen name="account" options={{ headerShown: false, title: 'AgentMart account' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack><Notice /></View></BuyerProvider>;
}
