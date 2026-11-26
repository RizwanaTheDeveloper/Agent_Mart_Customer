# CRDA master plan integration

Open **Buyer menu → CRDA master plan**, or `/master-plan` in the web app.

The interactive map supports pan/zoom, official layer toggles and legends, exact plot-code lookup, and clicking a location to inspect enabled layers. Plot results highlight the returned geometry and display public land-use, zoning, area, survey and road-width attributes when supplied by the source. There are no generated/sample plot records in this feature. Zero matches, source errors and authorization requirements remain visible.

## External services

All APCRDA URLs below start with `https://gis.apcrda.org/server/rest/services/`.

| Layer | Service | Layer ID |
| --- | --- | --- |
| Plot boundaries and land-use attributes | `LSP19Aug2026/MapServer` | 0 |
| Master plan trunk roads | `DEVELOPMENTPROMOTION/Road_Network/MapServer` | 8 |
| Planning boundary | `DEVELOPMENTPROMOTION/Road_Network/MapServer` | 4 |
| Industrial area | `LPS_Portal/MapServer` | 10 |
| R5 land | `LPS_Portal/MapServer` | 11 |

ArcGIS `/export` supplies map images in Web Mercator (EPSG:3857); `/legend` supplies actual source symbols. Layer `/query` requests return GeoJSON in WGS84 (EPSG:4326). Exact plot lookup uses the public `plot_code` field. The map also uses OpenStreetMap tiles from `https://tile.openstreetmap.org/{z}/{x}/{y}.png` with attribution, and Leaflet 1.9.4 JavaScript/CSS from unpkg with integrity hashes.

The selected public services responded without an API key during verification. No paid provider subscription is created. A new provider or protected APCRDA layer may require separate authorized access. There is no attempt to access token-protected datasets.

## Data handling and coverage

`buyer/src/master-plan/api.ts` defines the permitted services, layer IDs and public output fields. Plot searches and point queries run through the existing platform bridge, with bounded requests, a timeout and response validation. The queries do not send AgentMart credentials or session tokens. The new view excludes Aadhaar numbers, owner names, phone numbers, addresses and registration details from its output. The upstream attributes are projected again before they reach the embedded map document.

The APIs expose datasets with different coverage and dates. Plot land-use values and the R5/industrial overlays are not a complete, current, certified regional zoning plan. The UI labels this limitation and reports retrieval time separately from any official publication date. Check the notified APCRDA master plan and applicable amendments for authoritative planning decisions. A future complete land-use service should be added only after verifying its provider, coverage and version.

## Run and verify

Start Expo normally. This public map does not require the Nest authentication server to fetch planning data. Network access to APCRDA, OpenStreetMap and unpkg is required. Existing Buyer property/account APIs remain separate.

From `frontend/`:

```powershell
npm.cmd run test:master-plan
```

The check starts its own local Expo instance, verifies a live public plot and map layers in headless Edge, and intercepts requests to test source HTTP 503 and authorization failures. It checks recovery and mobile-width layout. Screenshots and logs are written under ignored `frontend/outputs/master-plan/`. It writes no account or planning records. Physical Android interaction is a separate device check.
