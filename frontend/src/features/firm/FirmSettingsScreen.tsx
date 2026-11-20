import ApkScreen from '../apk/ApkScreen';

/** Firm Settings Screen. UI and actions live in this feature's browser source. */
export default function FirmSettingsScreen() {
  return (
    <ApkScreen
      entry="seller"
      page="firmSettings"
      pageArgs={{}}
    />
  );
}
