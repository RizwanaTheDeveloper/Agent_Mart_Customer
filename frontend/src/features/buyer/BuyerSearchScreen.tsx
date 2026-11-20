import ApkScreen from '../apk/ApkScreen';

/** Buyer Search Screen. UI and actions live in this feature's browser source. */
export default function BuyerSearchScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="home"
      pageArgs={{}}
    />
  );
}
