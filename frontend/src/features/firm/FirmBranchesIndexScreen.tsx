import ApkScreen from '../apk/ApkScreen';

/** Firm Branches Index Screen. UI and actions live in this feature's browser source. */
export default function FirmBranchesIndexScreen() {
  return (
    <ApkScreen
      entry="seller"
      page="branches"
      pageArgs={{}}
    />
  );
}
