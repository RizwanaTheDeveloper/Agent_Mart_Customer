import ApkScreen from '../apk/ApkScreen';

/** Settings Sessions Screen. UI and actions live in this feature's browser source. */
export default function SettingsSessionsScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="marketSecurity"
      pageArgs={{}}
    />
  );
}
