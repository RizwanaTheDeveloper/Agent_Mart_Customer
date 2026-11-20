import ApkScreen from '../apk/ApkScreen';

/** Auth Register Screen. UI and actions live in this feature's browser source. */
export default function AuthRegisterScreen() {
  return (
    <ApkScreen
      entry="roles"
      page="marketAuth"
      pageArgs={{"side":"buyer","mode":"register"}}
    />
  );
}
