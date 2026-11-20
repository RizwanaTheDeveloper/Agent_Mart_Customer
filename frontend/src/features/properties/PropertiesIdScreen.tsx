import ApkScreen from '../apk/ApkScreen';
import { usePropertyPageArgs } from '../apk/usePropertyPageArgs';

/** Properties Id Screen. UI and actions live in this feature's browser source. */
export default function PropertiesIdScreen() {
  const pageArgs = usePropertyPageArgs();
  return (
    <ApkScreen
      entry="buyer"
      page="detail"
      pageArgs={pageArgs}
    />
  );
}
