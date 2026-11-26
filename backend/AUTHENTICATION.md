# Account authentication

The `/login` frontend screen supports Buyer and Seller registration, email/password login, session restoration and logout using the Nest API and PostgreSQL. Successful registration or login opens `/discover` in published-property mode for Buyers, or `/seller` for Sellers, based on the role returned by the backend. Revisiting `/login` shows the current account with a workspace button and logout. `/account` opens this same screen by default, including bookmarked links. Existing workspace sign-in is explicitly available through `/account?legacy=1` and uses a separate account database. Create an account first: users in the old D1 database or PostgreSQL `public` schema are not automatically imported into the Prisma `agentmart` schema.

## Start locally

From `backend/`:

```powershell
npm.cmd run auth:setup
npm.cmd run start:dev
```

The ignored `.env` contains the local database connection and generated JWT secrets. `auth:setup` fills missing secrets and preserves existing settings. A fresh database also requires `npm.cmd run prisma:deploy`. Never commit `.env`.

In another terminal, from `frontend/`:

```powershell
npm.cmd run expo -- --port 8083 --lan
```

Choose a workspace, then Login or Create account. Registration requires a name, email and password of at least 12 characters. The development app derives the computer address from Expo and connects to port 4000. For a physical Android device, use the same Wi-Fi and allow the backend port through the computer firewall. If necessary set `EXPO_PUBLIC_AUTH_API_URL=http://YOUR_COMPUTER_LAN_IP:4000/api/v1` in `frontend/.env` and restart Expo. Keep the existing `EXPO_PUBLIC_API_URL` for property workspace APIs.

For local test credentials, run `npm.cmd run auth:demo` from `backend/`. This creates `buyer@agentmart.test` and `seller@agentmart.test` with separate random passwords saved in the ignored `backend/.env.demo-accounts` file. Existing accounts and passwords are preserved. The command only accepts a local development database. These accounts sign in through `/login`; existing property workspace authentication remains separate.

## API

Buyer navigation includes a Profile entry and a mobile profile icon. `/profile` displays the current account's name and email. Sign out revokes the session and returns to Buyer login. Switch account revokes the session before returning to workspace selection; it also clears any existing Buyer workspace session and local account state. Network failures keep an error visible so the action can be retried.

Interactive documentation: `http://localhost:4000/api/v1/docs`.

| Method | Path | Input / access |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | `name`, `email`, `password`, optional `role`: `BUYER` or `SELLER` |
| POST | `/api/v1/auth/login` | `email`, `password`, optional selected workspace `role`: `BUYER` or `SELLER` |
| POST | `/api/v1/auth/refresh` | Refresh cookie for web; `refreshToken` JSON for native |
| GET | `/api/v1/auth/me` | `Authorization: Bearer <accessToken>` |
| POST | `/api/v1/auth/logout` | Bearer token; revokes current session |

Registration and login return `user`, `accessToken` and `expiresAt` (Unix milliseconds). Native clients also receive `refreshToken`. Send `X-Auth-Client: web` for browser requests; the server sets an HttpOnly refresh cookie instead. Browser requests require credentials, and refresh requires an allowed Origin header. Native clients use `X-Auth-Client: native` and store the refresh token in Expo SecureStore. Access tokens stay in memory.

The frontend always includes the selected workspace role in login requests. After password verification, an account with a different role receives HTTP 403 and a message directing it to the correct login; no session or tokens are created. Requests without a role retain the general account login behavior. The supplied role never changes the account's stored role or permissions.

Passwords use Argon2id. Access tokens expire after 15 minutes by default; sessions expire after seven days. Refresh tokens rotate atomically, and only a keyed hash is stored in PostgreSQL. Logout immediately invalidates the current session's access and refresh tokens. Other device sessions remain signed in. Registration/login/refresh are rate limited. Public registration cannot assign administrator privileges.

## Deployment and scope

Set a public HTTPS `EXPO_PUBLIC_AUTH_API_URL` for release builds, a valid `DATABASE_URL`, distinct random JWT secrets, and exact permitted `CORS_ORIGINS`. Browser frontend and API must share the same site because refresh cookies use SameSite Strict; production cookies require HTTPS. Rate limits currently use process memory, so multiple server instances need shared throttling storage.

The new login authenticates PostgreSQL accounts. Existing property, enquiry and Seller workspace APIs continue to use their established authentication. Buyer browsing opens the public published-property catalogue; enquiry submission and account state still require the existing Buyer workspace session. Seller Studio may require its existing ChatGPT sign-in. Email verification, password reset and account import are not included.

## Verification

`npm.cmd run test:auth` creates a temporary, loopback-only PostgreSQL cluster, applies migrations and runs 11 integration tests, including browser registration, reload restoration, logout and login. It never targets the configured development database. The Windows harness requires PostgreSQL 18 binaries and the installed frontend Playwright/Edge browser. Existing checks remain `test:nest`, `test`, `typecheck` and `lint`. Android/iOS bundle exports passed; physical-device login needs device validation.
