# AgentMart - Expo

This folder contains the combined **AgentMart** Expo app. It opens **Choose your workspace** at `/`. Choose **Buyer** (`/discover`) or **Seller / Property owner** (`/seller`). Click the AgentMart brand to return to the chooser, or use the **Seller / Buyer** switch within a workspace. Native Seller uses a WebView; web Seller uses an iframe around the seller service. The folder name is retained for existing source and scripts. The Expo project can now be started directly from the parent frontend folder with `npx.cmd expo start`; its Metro configuration also starts the seller service. Dependencies are installed with `npm.cmd ci` in frontend/ using the npm workspace.

For the complete app, run `npm.cmd run dev` from `frontend/` or the repository root. Open http://localhost:8081 or scan the Expo QR code from an interactive terminal. This starts the seller service and one Expo app. Direct Expo startup in frontend/ starts the seller service automatically; the older standalone command inside buyer/ requires a separate seller service or `EXPO_PUBLIC_SELLER_URL`.

## Run

From the repository root:

```powershell
npm run buyer
```

Or start Expo directly here:

```powershell
cd frontend/buyer
npx expo start
```

Use Expo Go supporting SDK 58 and scan the QR code from the same Wi-Fi network. The default connection uses LAN, without an internet tunnel. Press `a` for an Android emulator; an iOS simulator requires macOS. Stop with Ctrl+C. Use `npm run buyer:web` from the root for a browser preview.

For a fresh installation run `npm run install:buyer` from the root, or `npm.cmd ci` in frontend/. The root `Start-Buyer.cmd` launcher also starts this app. CLI flags pass through: `npm run buyer -- --localhost` limits access to this computer; `npm run buyer -- --clear` clears Metro's cache after a folder move.

The Expo app dependencies are shared between frontend/ and this source package through an npm workspace. Seller web dependencies in frontend/seller/ remain separate because that application uses a different React version.

## Files

| Location | Purpose |
| --- | --- |
| `src/app/_layout.tsx` | Root navigation, state and notifications |
| `src/app/(tabs)/_layout.tsx` | Buyer stack inside responsive side navigation |
| `src/app/(tabs)/discover.tsx` | Discover, search, buy/rent, filters and sorting |
| `src/app/(tabs)/saved.tsx` | Property shortlist |
| `src/app/(tabs)/compare.tsx` | Compare up to three properties |
| `src/app/(tabs)/drafts.tsx` | Saved enquiry drafts and deletion |
| `src/app/(tabs)/property/[id].tsx` | Property details and enquiry draft form |
| `src/components.tsx` | Shared native components and vector illustrations |
| `src/state.tsx` | Device-local persistence using AsyncStorage |
| `src/data/listings.ts` | Typed fictional sample listings |
| `src/theme.ts` | Shared colors and responsive styles |
| `assets/` | Native icons and assets |
| `scripts/verify-buyer.mjs` | Browser interaction checks |
| `reference/web-preview/` | Earlier prototype, excluded from build and lint |
| `app.json` | Expo Android/iOS/web configuration |

The same screens render on all three platforms. Property grids adapt to phone, tablet and desktop widths. Filters and comparison scroll horizontally when needed. Buyer navigation uses a persistent sidebar on wide screens and a menu drawer on phones and tablets; there is no bottom tab bar. The sidebar stays available on property details. Saved, comparison and draft counts update in the menu. Screens respect bottom safe areas and the detail form avoids the iOS keyboard. Orientation is unlocked for portrait and landscape layouts.

The welcome and account screens protect the bottom and side safe areas as well as the shared header's top inset. Workspace cards stack below 760 effective points, and the hero stacks below 1000; effective width also accounts for system font scaling. Stacked content uses natural height inside the scroll view, with 48-point login/account buttons. Short landscape windows omit the decorative hero artwork. The header wraps on narrow screens.

Responsive verification covers web widths from 280 to 1920 pixels and Android/iPhone browser profiles in portrait and landscape. These browser profiles are layout checks, not native device tests. Android/iOS bundle exports are also checked; test Expo Go on physical devices before release.

With the app running, use `npm.cmd run verify:responsive` here to check section overlap, card bounds, scrolling, touch targets and workspace navigation across those 12 layouts. Screenshots are written to `outputs/responsive-*.png`.

## Data and limits

The workspace chooser provides login, account creation and demo entry for both roles. Seller account actions continue to hosted ChatGPT sign-in. Buyer account screens support email/password registration and login through the shared Seller backend. See [backend setup](../../backend/README.md). Buyer tools retain their separate compatible-API workflows.

The demo catalogue contains six fictional listings and device-local state. Live mode browses published Seller properties; authenticated saves, comparisons and drafts sync to the Buyer account. Sending an enquiry delivers it to the Seller workspace. Buyer tools start in a separate Buyer demo with sample properties and dated CRDA reference parcels. Their account workflows require a compatible HTTPS API, which is not included in the APK. Seller sample mode is read-only and never writes sample records to your database.

Native bundle validation is not a signed release. Physical-device testing and signing are required before distribution.

## Verify

Run `npm run typecheck`, `npm run lint`, `npx expo install --check` and `npm run build` in this folder. Build exports Android, iOS and web bundles to ignored `dist/`.

For browser checks, serve the exported web app with SPA fallback, or start the Expo web server. Set `EXPO_BUYER_TEST_URL` to its URL and run `npm run verify` here (or `npm run buyer:verify` from the root). Tests use Playwright and Microsoft Edge; screenshots go to ignored `outputs/`.

Setup references: [Expo Router](https://docs.expo.dev/router/installation/) and [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/).

Run `npm.cmd run verify:sidebar` with the app running to check drawer opening/dismissal, all four routes, active states, counts, property details and sidebar/grid bounds at 320, 390, 768, 1024 and 1440 pixels.
