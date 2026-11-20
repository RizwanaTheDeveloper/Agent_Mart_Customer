import ApkScreen from '../apk/ApkScreen';

/** Buyer Saved Screen. UI and actions live in this feature's browser source. */
export default function BuyerSavedScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="saved"
      pageArgs={{}}
    />
  );
}
