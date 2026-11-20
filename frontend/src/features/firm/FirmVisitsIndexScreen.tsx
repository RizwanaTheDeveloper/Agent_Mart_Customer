import ApkScreen from '../apk/ApkScreen';

/** Firm Visits Index Screen. UI and actions live in this feature's browser source. */
export default function FirmVisitsIndexScreen() {
  return (
    <ApkScreen
      entry="seller"
      page="visits"
      pageArgs={{}}
    />
  );
}
