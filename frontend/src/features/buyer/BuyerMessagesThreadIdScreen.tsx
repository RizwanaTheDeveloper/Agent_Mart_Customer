import ApkScreen from '../apk/ApkScreen';
import { usePropertyPageArgs } from '../apk/usePropertyPageArgs';

/** Buyer Messages Thread Id Screen. UI and actions live in this feature's browser source. */
export default function BuyerMessagesThreadIdScreen() {
  const pageArgs = usePropertyPageArgs();
  return (
    <ApkScreen
      entry="buyer"
      page="marketThread"
      pageArgs={pageArgs}
    />
  );
}
