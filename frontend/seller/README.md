# AgentMart Seller Studio

A redesigned seller-only property workspace based on inspection of AgentMart_Customer_Managed_v4.5.apk. The interface uses a forest-green sidebar, responsive dashboard and mobile navigation. The frontend is React/TypeScript on Vinext; the backend runs on Cloudflare Workers, D1 and R2. Android and iOS sources are in `mobile/`.

## Run locally

For **Seller in Expo**, run `npm run seller:expo` from the repository root or `frontend/`. The launcher starts the seller web/API server and the separate Expo shell in [`expo/`](expo/README.md) together. Expo dependencies are isolated there from this web app's React version.

This folder contains the Seller frontend and framework host. API handlers and database code live in the top-level `backend/` package. From the repository root, run `npm run seller`, or run the commands below after changing into `frontend/seller`. The Expo buyer lives separately in [`../buyer/`](../buyer/README.md).

Requires Node 22.13 or newer. From this directory:

```sh
npm ci
npm run build
npm run db:migrate:local
npm run dev
```

Open the printed loopback URL. Local sign-in uses the starter's loopback-only simulated identity; it is excluded from production. Local data is separate from the hosted database. The backend setup command safely creates missing tables while preserving existing data. Install its dependencies first with `npm --prefix ../../backend ci`. Later schema changes require new migrations.

For encrypted documents, generate a key locally with Node's `crypto.randomBytes(32).toString('base64')`, and put it in an ignored `.dev.vars` as `DOCUMENT_KEY=...`. Keep this value stable: changing it makes previously encrypted documents unreadable. Configure the production value through Sites secrets, never source control. Production encryption is already configured for this deployment. Local test encryption keys are independent.

## Use the app

Buyer screens now live in `frontend/buyer/` and run through Expo for Android, iOS and web. The previous `/buyer` prototype has been retained as reference source in `../buyer/reference/web-preview/`; it is no longer an active seller route. The Buyer API under `/api/buyer` shares the Seller database for published listings, Buyer accounts, saved state and enquiry delivery. Drafts remain private until submitted. See [backend setup](../../backend/README.md).

Sign in, update the business name in Settings, create branches and add properties. New listings are private drafts. Mark a property Available and confirm advertising authorization to publish it. Edits reset publication. Owners and managers can manage publication and private documents. Agents can write assigned properties and enquiries. Viewers are read-only.

Add buyer enquiries, record follow-ups, accept or decline enquiries and schedule visits. Invite teammates using their sign-in email. Share the one-time code yourself; there is no automatic email delivery. The recipient enters it under Settings. The hosting platform also needs to allow that person to access this owner-private Site; application invites do not change platform sharing.

Choose Explore sample workspace to preview fictional properties and buyers. Sample mode is read-only and does not write to your real workspace. Sign in to load your authenticated workspace records.

## Verification

```sh
npx tsc --noEmit
node --experimental-strip-types scripts/verify-seller.mjs
```

The browser verification expects the development server at 127.0.0.1:5173 and Microsoft Edge installed. It covers desktop/tablet/phone widths, navigation, filtering, required fields, real form submission, unauthenticated and cross-origin rejection, persistence, publication consent, stale versions, follow-up history, visit confirmation and dependent-record deletion. It creates and removes test business records in the local database; audit entries remain. Screenshots are saved in ignored `outputs/`.

## Deployment and mobile

`.openai/hosting.json` retains the registered private Site identity and DB/BUCKET bindings. Use the Sites workflow to build, synchronize source, package and deploy. Hosted migrations are applied by Sites. Keep the vendored Sites build/auth integration intact.

See [mobile/README.md](mobile/README.md) for Android and iOS build/signing requirements, and [FEATURES.md](FEATURES.md) for the exact APK mapping and outstanding work. Native platform sources have been generated and synced; no signed APK, AAB or IPA is supplied. Physical-device sign-in, file selection/download and GPS testing are still required.

This is a working initial seller implementation, not complete feature parity with the APK. Buyer-side delivery and document grants, LLM summaries, complete translations and app-owned MFA/session controls remain outstanding. Live GIS and linked portals depend on external availability. The original backend and its private data are not present in the APK.
