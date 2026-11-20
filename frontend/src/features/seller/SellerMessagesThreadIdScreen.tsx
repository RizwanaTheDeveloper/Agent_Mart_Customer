import ApkScreen from '../apk/ApkScreen';
import { usePropertyPageArgs } from '../apk/usePropertyPageArgs';

/** Seller Messages Thread Id Screen. UI and actions live in this feature's browser source. */
export default function SellerMessagesThreadIdScreen() {
  const pageArgs = usePropertyPageArgs();
  return (
    <ApkScreen
      entry="seller"
      page="marketThread"
      pageArgs={pageArgs}
    />
  );
}
