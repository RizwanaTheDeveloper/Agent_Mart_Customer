import { Redirect } from 'expo-router';

/** Open the APK workspace chooser before entering a buyer or seller flow. */
export default function LoginScreen() {
  return <Redirect href="/workspace" />;
}
