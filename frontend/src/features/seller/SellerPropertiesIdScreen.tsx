import ApkScreen from '../apk/ApkScreen';
import { usePropertyPageArgs } from '../apk/usePropertyPageArgs';

/** Seller Properties Id Screen. UI and actions live in this feature's browser source. */
export default function SellerPropertiesIdScreen() {
  const pageArgs = usePropertyPageArgs();
  return (
    <ApkScreen
      entry="seller"
      page="detail"
      pageArgs={pageArgs}
    />
  );
}
