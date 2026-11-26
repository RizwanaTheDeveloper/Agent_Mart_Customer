# AgentMart

Buyer login, published Seller listings, account saves/drafts and enquiry delivery now use the existing Seller database. See [backend setup and API](backend/README.md). Initialize local tables once with `npm.cmd run backend:setup`; verify with `npm.cmd run backend:test`.

The application code is organized under **`frontend/seller/`**, **`frontend/buyer/`** and **`backend/`**. Start commands below run from this repository root.

```text
AgentMart/
??? backend/                          API handlers, schema, migrations and tests
├── frontend/
│   ├── seller/                   Seller web app and its Android/iOS wrapper
│   │   ├── app/                  Pages, seller screens, styles and API routes
│   │   ├── components/           Reusable interface components
│   │   ├── hooks/                Responsive UI helpers
│   │   ├── lib/                  Models, validation and access rules
│   │   ├── db/                   Database connection and schema
│   │   ├── drizzle/              Database migrations
│   │   ├── worker/               Cloudflare Worker entry
│   │   ├── mobile/               Capacitor Android and iOS projects
│   │   ├── expo/                 Seller Expo shell for Android, iOS and web
│   │   ├── public/               Icons and static assets
│   │   ├── scripts/              Seller build and verification tools
│   │   └── package.json          Seller dependencies and commands
│   └── buyer/                    Expo app for Android, iOS and web
│       ├── src/app/              Navigation and buyer screens
│       ├── src/components.tsx    Shared native interface components
│       ├── src/data/             Typed sample listings
│       ├── src/state.tsx         Device-local saved properties and drafts
│       ├── src/theme.ts          Responsive layout and colors
│       ├── assets/               App icons and native assets
│       ├── scripts/              Buyer browser verification
│       ├── reference/            Earlier web-only buyer prototype
│       ├── app.json              Expo configuration
│       └── package.json          Buyer dependencies and commands
├── .vscode/                      Editor tasks and browser debugging
├── Start-Seller.cmd              Windows seller launcher
├── Start-Buyer.cmd               Windows Expo buyer launcher
└── package.json                  Commands forwarding to the two apps
```

The seller's framework runs its frontend and API together. Backend handlers, schema, migrations and tests live in the top-level `backend/` package. Files in `frontend/seller/app/api/` are framework adapters; `worker/` handles hosting integration. Seller data and private documents remain separate from the buyer sample UI.

## Run

For **Seller in Expo**, use `npm run seller:expo` from this root or `frontend/`. This launches the seller web/API server and the Expo shell together. Scan the QR code with Expo Go supporting SDK 58; see [seller Expo setup](frontend/seller/expo/README.md) for local phone previews and hosted sign-in.

To run the **complete frontend together**, use `npm run dev` from this root or from `frontend/`. This starts the seller service on port 5173 and the combined AgentMart Expo app on port 8081. You can also run `npx.cmd expo start` directly from `frontend/`; it starts the seller service automatically. Press Ctrl+C to stop both. `Start-Frontend.cmd` is the equivalent Windows launcher.

Requires Node.js 22.13 or newer. Dependencies are already present in this checkout. For a fresh clone, run `npm run install:all`; install the seller's native wrapper dependencies with `npm run seller:mobile:install` when needed.

| Application | Root command | Opens |
| --- | --- | --- |
| Seller web | `npm run seller` | http://127.0.0.1:5173 |
| Seller Expo | `npm run seller:expo` | Seller web server and Expo QR code on port 8082 |
| Buyer Expo | `npm run buyer` | Metro and a QR code for Expo Go supporting SDK 58 |
| Buyer web | `npm run buyer:web` | Expo's browser preview |
| Buyer Android | `npm run buyer:android` | Connected Android device/emulator |
| Buyer iOS | `npm run buyer:ios` | iOS simulator on a Mac |
| Seller Android source | `npm run seller:android` | Android Studio |
| Seller iOS source | `npm run seller:ios` | Xcode on a Mac |

For Expo on your phone, connect it and your computer to the same Wi-Fi and scan the QR code in Expo Go. Expo uses LAN by default; an internet tunnel is not needed. Stop a development server with Ctrl+C. For the direct Expo command, change into `frontend/` and run `npx.cmd expo start`. The repository root remains a command launcher.

The combined Expo app uses frontend/package-lock.json and shares its dependencies with the buyer source package through an npm workspace. Seller web keeps its own dependencies because it uses a different React version. Do not force the seller and Expo dependency trees together.

## Data and platforms

The seller retains its existing local database and document configuration in ignored files under `frontend/seller/`. For a new computer, follow [seller setup](frontend/seller/README.md), including the initial database migration. Do not reapply the initial migration to an existing database.

Seller layouts adapt to desktop, tablet and phone widths; `frontend/seller/mobile/` wraps the hosted seller app for Android and iOS. Buyer layouts use native components with safe areas, responsive property grids and scrollable filters/comparison on Android, iOS and web. Buyer accounts now browse published Seller listings, sync saves and drafts, and submit enquiries through the Seller backend. The fictional demo remains separate.

Native projects and bundles require physical-device validation and signing before a store release. The existing seller native wrapper uses its previously configured hosted URL; a local folder move does not publish those changes.

## Verify

`npm run typecheck` checks the seller web app and both Expo apps. `npm run build` builds Seller Studio and exports buyer and seller Expo Android/iOS/web bundles. `npm run buyer:lint` and `npm run seller:expo:lint` check their Expo sources. With each application's local server running, use `npm run seller:verify` or `npm run buyer:verify` for browser checks. See the application READMEs for test URL configuration and native setup.

Detailed guides: [frontend map](frontend/README.md), [seller](frontend/seller/README.md), [buyer](frontend/buyer/README.md), [VS Code](OPEN-IN-VISUAL-STUDIO-CODE.md).
