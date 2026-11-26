# Seller Studio in Expo

Run this from **`frontend/`** or the repository root:

```powershell
npm run seller:expo
```

This command starts the seller web/API server on port 5173 and the seller Expo app on port 8082. Scan its QR code with Expo Go supporting SDK 58. Keep your phone and computer on the same Wi-Fi. Press `w` in Expo for the browser preview, or run `npm run seller:expo:web`. Ctrl+C stops both servers. The root `Start-Seller-Expo.cmd` launcher does the same.

Do not run `npx expo start` from `frontend/`: it contains multiple applications. If you want to start Metro directly, change into `frontend/seller/expo/` first and run `npx expo start`; run the seller server separately in that case.

## What runs

This is an Expo shell around the existing seller interface. Android/iOS use `react-native-webview`, which is included in Expo Go. Web uses an iframe with an option to open Seller Studio in its own browser tab. The complete seller UI and backend remain in the parent seller project; this does not duplicate them as React Native screens.

| File | Purpose |
| --- | --- |
| `App.tsx` | Safe areas and root screen |
| `src/SellerView.native.tsx` | Native WebView, Android back, loading, reload and connection errors |
| `src/SellerView.web.tsx` | Browser iframe and open-in-browser fallback |
| `src/config.ts` | Local development and hosted workspace addresses |
| `app.json` | Separate seller Expo identity |
| `package.json` | Isolated Expo/React Native dependencies |

The launcher binds the local seller server to the LAN so a phone can load it. The existing local simulated sign-in remains loopback-only: on a physical phone, choose **Explore sample workspace** for local UI testing, or **Use hosted workspace** for the real hosted application. The hosted private-site access policy and sign-in still apply. Starting Expo does not deploy local code to that hosted URL.

For a specific deployed backend, set `EXPO_PUBLIC_SELLER_URL` to its HTTP(S) URL before starting Expo. This is a public URL, never a secret. Default production exports use the seller URL already configured in `../mobile/capacitor.config.json`. Local development infers the computer address from Expo and uses port 5173; the launcher forwards a custom `SELLER_PORT` when set. `SELLER_EXPO_PORT` changes Metro's port.

For a clean installation, run `npm run install:seller:expo` from the root after installing the seller web dependencies. Do not install Expo into the web seller package, because the apps use different React versions.

## Verify

Inside this folder, run `npm run typecheck`, `npm run lint`, `npx expo install --check` and `npm run build`. Build exports Android/iOS/web bundles. Physical-device sign-in, GPS, document uploads/downloads and keyboard behavior still need testing before a native release; bundles are not signed APK/IPA releases. Hosted pages that disallow framing can be opened with the browser action.

Reference: [Expo SDK 58 WebView](https://docs.expo.dev/versions/v58.0.0/sdk/webview/).
