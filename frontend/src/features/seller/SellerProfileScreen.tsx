import ApkScreen from '../apk/ApkScreen';

/** Seller Profile Screen. UI and actions live in this feature's browser source. */
export default function SellerProfileScreen() {
  return (
    <ApkScreen
      entry="seller"
      page="classicAccount"
      pageArgs={{}}
    />
  );
}
