import ApkScreen from '../apk/ApkScreen';

/** Seller Index Screen. UI and actions live in this feature's browser source. */
export default function SellerIndexScreen() {
  return (
    <ApkScreen
      entry="seller"
      page="sellerHome"
      pageArgs={{}}
    />
  );
}
