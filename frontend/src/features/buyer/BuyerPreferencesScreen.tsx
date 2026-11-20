import ApkScreen from '../apk/ApkScreen';

/** Buyer Preferences Screen. UI and actions live in this feature's browser source. */
export default function BuyerPreferencesScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="classicAccount"
      pageArgs={{}}
    />
  );
}
