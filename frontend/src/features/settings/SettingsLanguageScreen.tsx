import ApkScreen from '../apk/ApkScreen';

/** Settings Language Screen. UI and actions live in this feature's browser source. */
export default function SettingsLanguageScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="language"
      pageArgs={{}}
    />
  );
}
