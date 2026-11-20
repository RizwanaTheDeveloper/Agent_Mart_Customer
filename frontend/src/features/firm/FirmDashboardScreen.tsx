import ApkScreen from '../apk/ApkScreen';

/** Firm Dashboard Screen. UI and actions live in this feature's browser source. */
export default function FirmDashboardScreen() {
  return (
    <ApkScreen
      entry="seller"
      page="sellerHome"
      pageArgs={{}}
    />
  );
}
