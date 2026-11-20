import ApkScreen from '../apk/ApkScreen';
import { usePropertyPageArgs } from '../apk/usePropertyPageArgs';

/** Seller Properties Edit Id Screen. UI and actions live in this feature's browser source. */
export default function SellerPropertiesEditIdScreen() {
  const pageArgs = usePropertyPageArgs();
  return (
    <ApkScreen
      entry="seller"
      page="sellerEdit"
      pageArgs={pageArgs}
    />
  );
}
