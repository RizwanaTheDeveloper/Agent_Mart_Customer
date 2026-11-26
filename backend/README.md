# AgentMart backend

The NestJS/Prisma API provides PostgreSQL registration, login, refresh and logout on port 4000. See [authentication setup](AUTHENTICATION.md) and [Nest setup and verification](NEST_SETUP.md). Existing Buyer/Seller business APIs described below remain on the current Cloudflare host until migrated; their workspace sign-in is available from the new login screen.

This folder owns the Buyer and Seller backend code, database schema, migrations, scripts and tests. It has its own `package.json`, dependencies and commands. The API runs through the existing Seller server on port **5173**, using the same persistent Cloudflare D1 database. Frontend API route files only connect requests and the hosting identity to these handlers. Buyer endpoints are under `/api/buyer/`; [openapi.json](openapi.json) is their contract.

```text
backend/
  src/
    routes/         Buyer, Seller workspace and research handlers
    db/             Database connection and schema
    lib/            Shared access rules and constants
    types.ts        Database bindings and Seller identity contract
  migrations/       SQL migrations and Drizzle metadata
  scripts/          Local database setup
  tests/            API integration tests
  package.json
  package-lock.json
  tsconfig.json
  drizzle.config.ts
  wrangler.jsonc
  openapi.json
```

From this folder, use `npm.cmd ci`, `npm.cmd run setup`, `npm.cmd run dev`, `npm.cmd test` and `npm.cmd run typecheck`. The `dev` command starts the existing framework host for both the Seller UI and backend. Root-level commands below remain available.

## Start locally

From the repository root:

```powershell
npm.cmd run backend:setup
npm.cmd --prefix frontend run expo -- --port 8083 --lan
```

If already inside `frontend/`, use `npm.cmd run expo -- --port 8083 --lan` for the second command. Expo starts the Seller web/API service automatically. Keep the terminal running, connect Android and the computer to the same Wi-Fi, and scan the QR code in Expo Go for SDK 58.

Setup creates missing tables without deleting existing Seller records. Local database files live in `frontend/seller/.wrangler/state/`. Rerunning setup is safe. It never modifies the hosted database.

1. In Seller Studio, sign in, add a property, mark it **Available**, and publish with advertising authorization.
2. For the existing property workflow, open **Existing workspace sign-in** from the new login screen, then create or sign in to the existing Buyer account. PostgreSQL account registration on `/login` is separate until the business APIs are migrated.
3. Open Discover to view published properties. Saves, comparison and private drafts sync when signed in. Use Refresh to fetch changes from another device.
4. Open a property and choose **Send enquiry to seller**. Its Seller workspace receives the enquiry with the Buyer's name, email and message. Buyer Drafts also shows submitted enquiries and their current status after refresh.
5. **View buyer demo** keeps fictional properties and device-only data separate. Demo records are never sent to sellers. Guest live saves last only until the store is reloaded; sign in for persistence.

The app derives the API host from Expo's LAN address. Override it with `EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:5173` before starting Expo when needed. For a physical phone, `localhost` refers to the phone. Metro's port (8083) and the API's port (5173) are different services. Both must be reachable from the phone.

## Endpoints

| Method | Path under `/api/buyer` | Access |
| --- | --- | --- |
| GET | `/health` | Public; verifies Buyer schema |
| POST | `/auth/register`, `/auth/login` | Public; rate limited |
| GET | `/auth/me` | Buyer session |
| POST | `/auth/logout` | Revokes current session |
| GET | `/listings?limit=50&offset=0` | Public; published and available properties only |
| GET, PUT | `/state` | Only current Buyer's saves, comparison and drafts |
| GET, POST | `/enquiries` | Only current Buyer's enquiries; new ones delivered to Seller |

Authenticated requests use `Authorization: Bearer <token>`. Sessions expire after seven days. Passwords use salted PBKDF2-SHA256; only token hashes are stored in D1. Android/iOS tokens use Expo SecureStore; web uses tab-scoped session storage. Passwords are never stored on the device. Authentication and enquiry creation have database-backed rate limits. Writes require JSON and bodies below 64 KiB.

State writes require the version from the last read. A conflicting update returns 409; the app reloads the current account state and asks the user to retry. Enquiry `requestId` makes retries idempotent. The API exposes a public property projection, excluding private documents, phone numbers, workspace metadata, assignments and internal notes. Seller messages, visits and document access are not exposed through these Buyer endpoints.

## Verify

From the repository root:

```powershell
npm.cmd run backend:test
npm.cmd run buyer:typecheck
npm.cmd run seller:typecheck
npm.cmd run buyer:lint
```

Backend tests run the actual handler inside a local Cloudflare Worker with D1, using an isolated persistent database under `backend/outputs/`. They verify public/private boundaries, auth, account isolation, conflicts, delivery, retry handling, persistence, logout, expiry, request limits and CORS. They never write to the real Seller database. Physical Android validation is separate.

## Hosting

This change is local; it does not publish or change Site sharing. Apply `backend/migrations/0001_buyer_backend.sql` to the hosted Seller D1 binding as part of deployment, preserving the existing Seller migration. A new database also needs `backend/migrations/0000_moaning_piledriver.sql`. The Seller build copies the canonical migrations into its hosting output. Keep both `backend/` and `frontend/seller/` in the build checkout. Production requires HTTPS and a publicly reachable Buyer API; a Site behind platform-only sign-in cannot accept independent Buyer sessions until hosting access is configured appropriately. Seller management must retain its authenticated access rules.

For a separate browser frontend, configure the server's `BUYER_ORIGINS` as comma-separated exact HTTPS origins and point `EXPO_PUBLIC_API_URL` at the deployed server. Native apps send Bearer tokens without relying on browser cookies. Email verification, password reset and account deletion are not implemented in this initial backend.
