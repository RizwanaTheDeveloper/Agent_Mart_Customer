# Open and run in Visual Studio Code

To run **Seller in Expo**, use `npm run seller:expo` from the root or `frontend/`. It starts the seller web server and the Expo app in `frontend/seller/expo/` together. Scan its QR code in Expo Go; use `npm run seller:expo:web` for the browser. For the combined AgentMart app, run `npx.cmd expo start` directly in the parent `frontend` folder. It starts the seller service and displays one Expo QR code.

Open `AgentMart-Seller.code-workspace`. Expand **frontend**, then **seller** or **buyer** in the Explorer.

| Folder | What it contains |
| --- | --- |
| `frontend/seller/app/` | Seller pages, screens, styles and API routes |
| `frontend/seller/components/` | Reusable UI components |
| `frontend/seller/lib/` | Models, validation and access rules |
| `frontend/seller/db/`, `drizzle/`, `worker/` | Database schema and server runtime |
| `frontend/seller/mobile/` | Capacitor Android and iOS projects |
| `frontend/buyer/src/app/(tabs)/` | Discover, Saved, Compare and Drafts screens |
| `frontend/buyer/src/app/property/[id].tsx` | Property details and enquiry draft form |
| `frontend/buyer/src/components.tsx` | Shared native UI components |
| `frontend/buyer/src/theme.ts` | Responsive layout and colors |
| `frontend/buyer/src/state.tsx` | Device-local saved data |
| `frontend/buyer/src/data/` | Fictional sample listings |
| `frontend/buyer/reference/` | Earlier web prototype, excluded from the active build |

From the root terminal run `npm run seller` for http://127.0.0.1:5173, `npm run buyer` for Expo, or `npm run buyer:web` for its browser preview. Stop with Ctrl+C. For Expo on a phone, use Expo Go supporting SDK 58 and the same Wi-Fi network as the computer.

**Terminal > Run Task** contains Seller and Buyer commands. F5 starts seller debugging in Edge. Ctrl+Shift+B builds the seller. The Buyer export task bundles Android, iOS and web.

On a new computer run `npm run install:all` and follow `frontend/seller/README.md` for local database setup. Native seller tasks also require `npm run seller:mobile:install`. Android needs Android Studio; iOS needs a Mac with Xcode. Seller document keys remain in its ignored `.dev.vars` file.
