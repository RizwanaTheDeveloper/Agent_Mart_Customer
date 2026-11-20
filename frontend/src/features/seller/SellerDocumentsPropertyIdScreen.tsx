import ApkScreen from '../apk/ApkScreen';
import { usePropertyPageArgs } from '../apk/usePropertyPageArgs';

/** Seller Documents Property Id Screen. UI and actions live in this feature's browser source. */
export default function SellerDocumentsPropertyIdScreen() {
  const pageArgs = usePropertyPageArgs();
  return (
    <ApkScreen
      entry="seller"
      page="detail"
      pageArgs={pageArgs}
    />
  );
}
