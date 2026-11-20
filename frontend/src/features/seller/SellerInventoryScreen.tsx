import ApkScreen from '../apk/ApkScreen';

/** Seller Inventory Screen. UI and actions live in this feature's browser source. */
export default function SellerInventoryScreen() {
  return (
    <ApkScreen
      entry="seller"
      page="home"
      pageArgs={{}}
    />
  );
}
