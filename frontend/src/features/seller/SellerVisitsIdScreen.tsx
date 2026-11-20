import ApkScreen from '../apk/ApkScreen';
import { usePropertyPageArgs } from '../apk/usePropertyPageArgs';

/** Seller Visits Id Screen. UI and actions live in this feature's browser source. */
export default function SellerVisitsIdScreen() {
  const pageArgs = usePropertyPageArgs();
  return (
    <ApkScreen
      entry="seller"
      page="marketThread"
      pageArgs={pageArgs}
    />
  );
}
