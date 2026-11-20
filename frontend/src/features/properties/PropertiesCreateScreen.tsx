import ApkScreen from '../apk/ApkScreen';

/** Properties Create Screen. UI and actions live in this feature's browser source. */
export default function PropertiesCreateScreen() {
  return (
    <ApkScreen
      entry="seller"
      page="sellerEdit"
      pageArgs={{}}
    />
  );
}
