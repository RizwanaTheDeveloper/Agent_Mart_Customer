import ApkScreen from '../apk/ApkScreen';

/** Buyer Enquiries Index Screen. UI and actions live in this feature's browser source. */
export default function BuyerEnquiriesIndexScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="marketRequests"
      pageArgs={{}}
    />
  );
}
