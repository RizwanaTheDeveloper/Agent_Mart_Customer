import ApkScreen from '../apk/ApkScreen';

/** Firm Reports Screen. UI and actions live in this feature's browser source. */
export default function FirmReportsScreen() {
  return (
    <ApkScreen
      entry="seller"
      page="reports"
      pageArgs={{}}
    />
  );
}
