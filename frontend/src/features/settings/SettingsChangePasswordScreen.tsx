import ApkScreen from '../apk/ApkScreen';

/** Settings Change Password Screen. UI and actions live in this feature's browser source. */
export default function SettingsChangePasswordScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="marketSecurity"
      pageArgs={{}}
    />
  );
}
