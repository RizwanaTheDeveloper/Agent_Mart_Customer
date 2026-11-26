# AgentMart frontend

Run Expo directly from this folder:

```powershell
npx.cmd expo start
```

This starts the single **AgentMart** app and its local seller service. Scan the QR code using Expo Go on the same Wi-Fi. Press `w` for the browser at http://localhost:8081. The opening screen lets you choose Buyer or Seller / Property owner. Ctrl+C stops Expo and the seller service it started. If the seller service was already running, Expo reuses it and leaves it running on exit.

`npm.cmd run dev` remains an alternative that opens the web preview automatically. From the repository root, `npm.cmd run dev` and `Start-Frontend.cmd` start the same app and service.

## Project structure

- `package.json` and `package-lock.json`: Expo dependencies and npm workspace installation.
- `app.config.js`: AgentMart identity, assets and the existing Router source directory.
- `metro.config.js`: Expo Metro configuration and development seller-service startup.
- `buyer/src/`: shared AgentMart app with chooser, account screens, native buyer screens and seller WebView/iframe.
- `buyer/assets/`: app assets.
- `seller/`: existing Seller Studio web/API service with its separate React dependencies.
- `outputs/seller-dev.log`: seller-service logs when started directly with Expo.

The Expo app and its `buyer` source package use one hoisted dependency tree. The web seller remains isolated because it uses a different React version. Install with `npm.cmd ci` here, and `npm.cmd --prefix seller ci` for the seller web service. Root `npm.cmd run install:all` also installs the applications.

## Workspaces and data

Buyer discovery uses a fictional sample catalogue. Saves, comparison and unsent enquiry drafts stay on this device. Buyer tools include the supplied APK features in an isolated sample workspace; account workflows require a compatible HTTPS API.

Seller uses a WebView on Android/iOS and an iframe on web, served locally on port 5173. Seller records load from the authenticated workspace API. Choose View seller / owner demo for the read-only sample workspace. Seller sign-in uses the existing hosted workspace. Set `EXPO_PUBLIC_SELLER_URL` to use a hosted seller service; local startup is skipped in that case. `SELLER_PORT` changes the local seller port.

For the older standalone seller-only Expo shell, use `npm.cmd run seller:expo`; its source remains in `seller/expo/`. It is not needed for the combined AgentMart app.

## Validation

`npm.cmd run build` exports Android, iOS and web from this folder. In `buyer/`, run `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run verify` and `npm.cmd run verify:responsive`. Browser profiles check layouts and navigation; physical Expo Go testing and signed release builds remain separate.
