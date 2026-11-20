import ApkScreen from '../apk/ApkScreen';

/** Buyer Profile Screen. UI and actions live in this feature's browser source. */
export default function BuyerProfileScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="classicAccount"
      pageArgs={{}}
    />
  );
}
