import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { AppText as Text } from '../AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuyerProvider, useBuyer } from '../state';
import { colors, fonts, styles as s } from '../theme';
import WorkspaceSwitch from '../WorkspaceSwitch';
import { AuthProvider } from '../auth/AuthProvider';

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
  // On a slow connection the fonts can take a while. Show a visible loader, and stop waiting after a few seconds
  // so the app opens with system fonts instead of a blank screen (the custom fonts apply once they arrive).
  const [waited, setWaited] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setWaited(true), 5000); return () => clearTimeout(timer); }, []);
  if (!fontsLoaded && !fontError && !waited) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color={colors.green} /></View>;
  return <AuthProvider><BuyerProvider><View style={{ flex: 1 }}><StatusBar style="dark" /><WorkspaceSwitch />
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.green, headerTitleStyle: { fontFamily: fonts.heading }, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'AgentMart' }} />
      <Stack.Screen name="seller" options={{ headerShown: false, title: 'AgentMart Seller' }} />
      <Stack.Screen name="account" options={{ headerShown: false, title: 'AgentMart account' }} />
      <Stack.Screen name="login" options={{ headerShown: false, title: 'AgentMart login' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack><Notice /></View></BuyerProvider></AuthProvider>;
}
