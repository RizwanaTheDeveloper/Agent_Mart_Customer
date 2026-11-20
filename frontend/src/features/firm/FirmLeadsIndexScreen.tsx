import ApkScreen from '../apk/ApkScreen';

/** Firm Leads Index Screen. UI and actions live in this feature's browser source. */
export default function FirmLeadsIndexScreen() {
  return (
    <ApkScreen
      entry="seller"
      page="leads"
      pageArgs={{}}
    />
  );
}
