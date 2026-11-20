import ApkScreen from '../apk/ApkScreen';

/** Firm Activity Screen. UI and actions live in this feature's browser source. */
export default function FirmActivityScreen() {
  return (
    <ApkScreen
      entry="seller"
      page="activity"
      pageArgs={{}}
    />
  );
}
