# AgentMart Buyer APK features

Buyer tools preserve the supplied AgentMart Customer 4.5 APK interface in an isolated document. They start in a clearly labelled Buyer demo, separate from native saves and Seller records. Four fictional properties and synthetic diligence examples support exploration; eleven dated CRDA parcels remain reference records, not advertised properties.

## Available workflows

| Feature | Data source |
| --- | --- |
| Property catalogue, search, saved items and comparisons | Compatible Buyer API after sign-in |
| Buyer registration, profile and preferences | Compatible Buyer API |
| Interests, messages, visits and controlled documents | Compatible API and participating sellers |
| Password change, MFA and session controls | Compatible security API |
| Maps and parcel boundaries | OpenStreetMap and APCRDA reference records |
| CRDA search, file import, validation and export | User imports, bundled dated GIS records and public GIS service |
| Legal portals, private checklists and notes | Official portals and device-local notes |
| Plot and nearby research | APCRDA and Overpass availability |
| Investment scenarios | Sample inputs and editable assumptions |
| Language | English, Telugu and Hindi navigation dictionaries |

## Server connection

Open Buyer tools > Server connection and configure an Agent Mart Firms compatible
HTTPS origin. `/api/health` must identify that service. Login and registration
then use the original `/api/auth/*` contracts, with dashboard and listing requests
under `/api/buyer/*` and `/api/market/*`. Security, research, reporting and curated
records use the corresponding `/api/security/*`, `/api/intelligence/*`,
`/api/reports` and `/api/platform/*` endpoints.

The existing Seller service uses ChatGPT sign-in and a different API. Its address
cannot be used as a drop-in Buyer API. A compatible Buyer server is not included
in the supplied APK. Account features remain gated until that service is set up.
Tokens remain in memory and are not written to device storage.

## Maps and records

OpenStreetMap tiles need no API key and retain attribution, normal HTTP caching,
loading/retry controls and request identification. Web requests originate from the
parent browser so they include the application Referer. Native WebView identifies
AgentMart in its user agent. Only visible tiles are requested, subject to the
[OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/).

The eleven bundled APCRDA parcels retain their source dates and reference labels.
They are not advertised properties or proof of ownership. Legal portals and
professional document review remain separate from map data. Investment tools calculate editable assumptions, not guaranteed forecasts.

## Device storage

Buyer native state uses `agentmart-buyer-expo-v1`; tool state uses `agentmart-apk-buyer-tools-v45`. These stores remain separate. The native catalogue contains six fictional listings and property illustrations. APK demo changes stay on this device; restarting the demo restores its sample workspace.

## Validation

From frontend, use `npx tsc --noEmit` and `npm run build`. In buyer, run
`npm run lint`, `node scripts/verify-live-workspaces.mjs`,
`node scripts/verify-free-maps.mjs` and `node scripts/verify-responsive.mjs`.
Account tests use intercepted API responses confined to their browser context.
Map tests use intercepted tiles rather than downloading community map regions.
Physical-device and actual backend testing remain separate from browser checks
and Android/iOS/web bundle compilation.
