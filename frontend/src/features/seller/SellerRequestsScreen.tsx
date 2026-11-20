import ApkScreen from '../apk/ApkScreen';

/** Seller Requests Screen. UI and actions live in this feature's browser source. */
export default function SellerRequestsScreen() {
  return (
    <ApkScreen
      entry="seller"
      page="marketRequests"
      pageArgs={{}}
    />
  );
}
