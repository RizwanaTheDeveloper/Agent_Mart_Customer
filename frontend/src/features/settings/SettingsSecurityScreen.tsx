import ApkScreen from '../apk/ApkScreen';

/** Settings Security Screen. UI and actions live in this feature's browser source. */
export default function SettingsSecurityScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="marketSecurity"
      pageArgs={{}}
    />
  );
}
