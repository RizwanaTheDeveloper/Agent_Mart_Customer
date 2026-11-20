import ApkScreen from '../apk/ApkScreen';

/** Auth Verify Otp Screen. UI and actions live in this feature's browser source. */
export default function AuthVerifyOtpScreen() {
  return (
    <ApkScreen
      entry="roles"
      page="marketAuth"
      pageArgs={{"side":"buyer","mode":"login"}}
    />
  );
}
