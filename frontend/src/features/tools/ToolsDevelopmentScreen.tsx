import ApkScreen from '../apk/ApkScreen';

/** Tools Development Screen. UI and actions live in this feature's browser source. */
export default function ToolsDevelopmentScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="development"
      pageArgs={{}}
    />
  );
}
