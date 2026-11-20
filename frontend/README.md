# Frontend

The complete editable source is organized by feature. See [SOURCE_GUIDE.md](SOURCE_GUIDE.md) for the implementation map and build workflow. The APK interface remains HTML/JavaScript/CSS hosted by Expo; its renderers are browser functions rather than native React components.

Shared Expo / React Native TypeScript code runs on Android, iOS, and web. The app opens `/workspace` with Parcel's redesigned Buyer and Seller / Property owner workspace chooser. `/login` opens the same chooser. `/dashboard` opens the buyer Today demo directly, with no backend, account, or password required. `/seller-dashboard` opens the seller Today demo. The shared document runs in a native WebView or a web iframe. Parcel's new navigation connects existing property filters, saved properties, comparisons, conversations, research tools, firm controls and language selection. Live account and property data are not connected; displayed listings are offline demo records.

## Run

For a physical phone using Expo Go, run `npm run start:go`. This rebuilds the document, clears Metro's cache, and explicitly selects Expo Go over LAN. Keep the terminal running, connect the phone to the same network, and scan the newly generated QR code rather than opening an old recent-project link.

This frontend uses Expo SDK 58 and React Native 0.88.1. Use Expo Go with SDK 58 support (including client 58.0.5).

If Expo Go reports `Failed to download remote update`, open the terminal's `http://<computer-IP>:8081/status` address in the phone's browser. `packager-status:running` confirms that the server is reachable. Stop any Metro server started before the SDK upgrade, run `npm run start:go`, and scan its new QR code.


```sh
npm install
npm run android
npm run ios
npm run web
```

Run one platform command at a time. The local iOS simulator requires macOS and Xcode. From Windows, open the development server in a compatible Expo Go app on an iPhone, or use an EAS iOS build with Apple signing configured.

## Code locations

- `src/hooks/useResponsive.ts`: live viewport sizes, gutters, and breakpoints: phone below 768, tablet 768â€“1023, desktop 1024 and above.
- `src/components/layout/ScreenContainer.tsx`: safe areas, scrolling, iOS keyboard avoidance, and centered maximum content widths (560 for forms, 800 for reading, 1200 for wide layouts).
- `src/components/layout/ResponsiveGrid.tsx`: one, two, or three columns; uses one column for large accessibility font sizes. Use inside the wide screen container.
- `src/components/layout/ResponsiveTabs.tsx`: bottom navigation on phones/tablets and a left navigation rail on desktop. Both buyer and seller tab layouts use it.
- `src/components/common`: reusable inputs, buttons, loading, error, and empty states, with wrapping text and minimum 48-point input/button heights.
- `src/theme`: shared colors, spacing, and typography.
- `src/features/auth/LoginScreen.tsx`: redirects to the workspace chooser without collecting credentials.
- `src/features`: complete browser implementations and named React entry screens, organized by feature.
- `src/components/properties`, `src/services`, `src/store`, `src/demo`: property renderers, existing APK operations, device/session state, and fictional records.
- `src/theme/apk.css` and `src/i18n/apk-locales.js`: complete APK styling and localized property schema.
- `src/features/apk`: document builder, native/web hosts, and ordered source manifest.
- `assets/apk`: unchanged APK comparison reference. Edit the files listed in `src/features/apk/source-manifest.json`, then run `npm run build:apk-assets` to regenerate the embedded document. Start commands do this automatically; repeat the build after source edits when Metro is already running.
- `src/features/buyer/dashboard/`: dashboard entry component and full dashboard JavaScript implementation.
- `src/app`: Expo routes mapped to the corresponding APK screens.

Avoid fixed screen heights and widths. Use `variant="form"` on `ScreenContainer` for forms. For virtualized lists, use `scroll={false}` and let the list own scrolling rather than nesting it inside a ScrollView.

## Review and verification

Open `/responsive-preview` on web, or the `agentmartcustomer://responsive-preview` deep link on a development build, to review the shared components and open buyer/seller navigation. The preview never sends data.

```sh
npm run typecheck
npx expo install --check
npx expo export --platform all --max-workers 1
```

Check phone widths (320, 390), tablet (768), desktop (1280, 1920), landscape, large system text, browser zoom, and an open keyboard. Confirm content scrolls, fields remain reachable, and navigation updates after resizing. Native bundle export verifies compilation, not device behavior; review Android and iOS on devices before release.

Web hosting must route unknown paths to `index.html` because this app uses single-page output.

Dependencies follow the [Expo Router installation guidance](https://docs.expo.dev/router/installation/).
