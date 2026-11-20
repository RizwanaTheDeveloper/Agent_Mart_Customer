import ApkScreen from '../apk/ApkScreen';

/** Auth Forgot Password Screen. UI and actions live in this feature's browser source. */
export default function AuthForgotPasswordScreen() {
  return (
    <ApkScreen
      entry="roles"
      page="marketAuth"
      pageArgs={{"side":"buyer","mode":"login"}}
    />
  );
}
