# Frontend source guide

The complete v4.5 APK interface is editable inside this frontend. It is a web-based interface hosted by Expo in `react-native-webview` on Android/iOS and an iframe on web. The `.js` source below runs inside that browser document, rather than as React Native components. The `.tsx` files connect Expo routes to the correct document screen.

## Where to edit

| Folder or file | Implementation |
| --- | --- |
| `src/features/parcel/workspace.js` | Parcel's final presentation layer: navigation, Today dashboards, discovery, property files, guided editor and research workspace; existing feature handlers remain authoritative |
| `src/theme/parcel.css` | Parcel design system and responsive layouts, loaded after the existing feature styles |
| `src/features/auth/workspace.js` | The opening Buyer / Seller workspace cards, role login, and follow-ups |
| `src/features/auth/marketplace-auth.js` | Marketplace login and registration UI |
| `src/features/buyer/dashboard/` | DashboardScreen.tsx entry and full dashboard.js implementation: buyer dashboard, search, property cards, account view, and navigation overrides |
| `src/features/seller/studio.js` | Seller property editor and dossier |
| `src/features/seller/geotag.js` | GPS, map selection, summaries, and approval |
| `src/features/firm/` | Firm workspace, settings, leads, visits, staff, branches, and activity |
| `src/features/marketplace/` | Marketplace discovery, saved properties, comparison, enquiries, and conversations |
| `src/features/properties/` | Local property browsing, complete property schema, and disclosures |
| `src/features/tools/` | Maps, legal checklist, CRDA search and imports |
| `src/features/insights/` | Evidence, nearby places, development, investment, and growth views |
| `src/features/settings/` | Accounts and translated controls |
| `src/components/properties/` | Original property card, filters, and form renderers |
| `src/services/` | Existing APK transport, property persistence, GIS, security, reports, and documents |
| `src/store/` | Existing APK device storage, preferences, and firm/marketplace session state |
| `src/demo/` | Fictional property catalog and marketplace demo behavior |
| `src/i18n/apk-locales.js` | Original localized property schema |
| `src/theme/apk.css` | Shared responsive design system for the redesigned APK interface |
| `src/features/core/` | Shared helpers, navigation, header, and document rendering |
| `src/features/platform/` | Existing optional platform integration |
| `src/features/apk/` | Document assembly and Android/iOS/web hosting |
| `src/app/` | Expo Router entry points, each wired to a named feature screen |

The original APK extends earlier functions to add its newer screens. Some later modules therefore override earlier renderers. Edit the corresponding final override for the screen you want to change. Source order is listed explicitly in `src/features/apk/source-manifest.json`; preserve that order when reorganizing modules. These files share the original document scope and must not be imported separately into React Native. The archived APK under `assets/apk/` remains unchanged as a feature and integrity reference; the live interface now uses a separate visual design.

## Build and run

```sh
npm run build:apk-assets
npm run typecheck
npm run web
```

Start commands regenerate the embedded document automatically. After editing browser `.js`, CSS, or HTML sources while Metro is already running, run `npm run build:apk-assets` again and reload the app. React `.tsx` changes use Metro's normal refresh behavior.

`src/features/apk/apkAssets.generated.ts` is a readable generated bundle. Edit the source modules rather than this file. The builder validates assembled JavaScript syntax and combines the manifest's base CSS with its additional `styles` files in order. `assets/apk/` remains an unchanged reference for visual comparisons; the build does not replace its hashes. Parcel's module loads last so that the original data, permission, geotag and persistence handlers remain available to the new screen composition. Expo routes re-export the corresponding feature screens to keep direct entry points consistent.

## Entry points

- `/` and `/login`: workspace chooser, matching the supplied screenshot.
- `/workspace`: direct workspace chooser.
- `/dashboard`: buyer demo.
- `/seller-dashboard`: seller demo.

Demo behavior, local saves, and optional backend integration are preserved. This source reorganization does not implement the backend's missing business endpoints, introduce native React versions of the HTML screens, or add unsupported OTP/password-reset flows. Those routes retain the existing APK login behavior.

## Verification

```sh
npm run typecheck
npm run export:web
npx playwright test
```

Playwright tests use the archived APK to verify key feature parity while checking the redesigned layout, startup, filters, persistence, property details, seller actions, translations, and viewport sizes. Set `PLAYWRIGHT_EXECUTABLE_PATH` to an installed Chrome executable if Playwright's bundled browser is unavailable. Native compilation and device behavior require separate verification.
