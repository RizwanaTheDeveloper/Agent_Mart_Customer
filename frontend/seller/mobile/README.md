# Android and iOS shells

The same web interface runs in a Capacitor WebView connected to the HTTPS backend. These are native project sources, not signed app-store releases. Internet access is required. There is no offline database or background push service.

Install with `npm ci` in this directory. The Android and iOS project sources are already generated. Run `npm run sync` after changing capacitor.config.json. Use the add scripts only if you are starting fresh without platform folders. Open with `npm run android` or `npm run ios`.

Android release builds require Android Studio, a supported JDK and Android SDK. Configure your signing key in Android Studio; never commit it. iOS release builds require a Mac with Xcode and an Apple developer team. Configure signing and the bundle ID there. The default bundle ID is com.agentmart.sellerstudio and should be changed before store submission.

The current backend is owner-private and uses platform sign-in. Test sign-in, redirects, cookies, logout, GPS, file selection, sharing, keyboard resizing and safe areas on physical devices before distributing. The Site access policy also needs to permit intended team members; an application invitation does not grant hosting-platform access. Remote hosted content and external links need review against your distribution requirements. No device compatibility or store acceptance is claimed.

The current geotag action uses WebView browser geolocation. Location permissions and the iOS usage description are configured. Add a native Capacitor geolocation adapter if device testing requires it. Native push notifications and biometric authentication are not implemented.
