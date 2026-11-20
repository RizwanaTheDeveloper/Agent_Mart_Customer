import ApkScreen from '../apk/ApkScreen';

/** Properties Saved Screen. UI and actions live in this feature's browser source. */
export default function PropertiesSavedScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="saved"
      pageArgs={{}}
    />
  );
}
