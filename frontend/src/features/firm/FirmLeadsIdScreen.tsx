import ApkScreen from '../apk/ApkScreen';
import { usePropertyPageArgs } from '../apk/usePropertyPageArgs';

/** Firm Leads Id Screen. UI and actions live in this feature's browser source. */
export default function FirmLeadsIdScreen() {
  const pageArgs = usePropertyPageArgs();
  return (
    <ApkScreen
      entry="seller"
      page="leadEdit"
      pageArgs={pageArgs}
    />
  );
}
