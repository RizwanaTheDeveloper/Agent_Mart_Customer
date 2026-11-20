import ApkScreen from '../apk/ApkScreen';

/** Auth Join Firm Screen. UI and actions live in this feature's browser source. */
export default function AuthJoinFirmScreen() {
  return (
    <ApkScreen
      entry="roles"
      page="marketAuth"
      pageArgs={{"side":"seller","mode":"join"}}
    />
  );
}
