import ApkScreen from '../apk/ApkScreen';

/** Tools Map Screen. UI and actions live in this feature's browser source. */
export default function ToolsMapScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="map"
      pageArgs={{}}
    />
  );
}
