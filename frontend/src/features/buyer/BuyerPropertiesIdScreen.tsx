import ApkScreen from '../apk/ApkScreen';
import { usePropertyPageArgs } from '../apk/usePropertyPageArgs';

/** Buyer Properties Id Screen. UI and actions live in this feature's browser source. */
export default function BuyerPropertiesIdScreen() {
  const pageArgs = usePropertyPageArgs();
  return (
    <ApkScreen
      entry="buyer"
      page="detail"
      pageArgs={pageArgs}
    />
  );
}
