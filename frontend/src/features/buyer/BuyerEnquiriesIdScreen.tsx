import ApkScreen from '../apk/ApkScreen';
import { usePropertyPageArgs } from '../apk/usePropertyPageArgs';

/** Buyer Enquiries Id Screen. UI and actions live in this feature's browser source. */
export default function BuyerEnquiriesIdScreen() {
  const pageArgs = usePropertyPageArgs();
  return (
    <ApkScreen
      entry="buyer"
      page="marketThread"
      pageArgs={pageArgs}
    />
  );
}
