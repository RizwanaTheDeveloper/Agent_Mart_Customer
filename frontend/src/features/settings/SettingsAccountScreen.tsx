import ApkScreen from '../apk/ApkScreen';

/** Settings Account Screen. UI and actions live in this feature's browser source. */
export default function SettingsAccountScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="classicAccount"
      pageArgs={{}}
    />
  );
}
