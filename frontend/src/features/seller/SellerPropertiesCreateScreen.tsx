import ApkScreen from '../apk/ApkScreen';

/** Seller Properties Create Screen. UI and actions live in this feature's browser source. */
export default function SellerPropertiesCreateScreen() {
  return (
    <ApkScreen
      entry="seller"
      page="sellerEdit"
      pageArgs={{}}
    />
  );
}
