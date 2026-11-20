import ApkScreen from '../apk/ApkScreen';

/** Settings About Screen. UI and actions live in this feature's browser source. */
export default function SettingsAboutScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="about"
      pageArgs={{}}
    />
  );
}
