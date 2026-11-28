# CRDA master plan integration

Open **Buyer menu → CRDA master plan**, or `/master-plan` in the web app.

The interactive map supports pan/zoom, official layer toggles and legends, plot-code lookup, and clicking a location to inspect enabled layers. Clicking a mapped plot opens a popup with its full CRDA plot code, plot number, village, area and land use when supplied by APCRDA. Plot identification remains active even when the plot overlay is hidden. Unmapped locations and source errors show distinct messages, without reusing a previous plot's number. Each highlighted plot has its own code label. Plot results also display public zoning, survey and road-width attributes. There are no generated/sample plot records in this feature. The standard Buyer Map screen links directly to this clickable CRDA map.

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

Point lookup is also available in the embedded Buyer maps and Seller property-location previews. A short tap queries the containing APCRDA plot; dragging and existing property-pin actions retain their usual behavior. Clicks outside the source's mapped area return a no-record message rather than an invented or nearest plot code. Location previews start at the property's coordinates and use the same official lookup as the master-plan screen.

`buyer/src/master-plan/api.ts` defines the permitted services, layer IDs and public output fields. Plot searches and point queries run through the existing platform bridge, with bounded requests, a timeout and response validation. The queries do not send AgentMart credentials or session tokens. The new view excludes Aadhaar numbers, owner names, phone numbers, addresses and registration details from its output. The upstream attributes are projected again before they reach the embedded map document.

The APIs expose datasets with different coverage and dates. Plot land-use values and the R5/industrial overlays are not a complete, current, certified regional zoning plan. The UI labels this limitation and reports retrieval time separately from any official publication date. Check the notified APCRDA master plan and applicable amendments for authoritative planning decisions. A future complete land-use service should be added only after verifying its provider, coverage and version.

## Run and verify

Start Expo normally. This public map does not require the Nest authentication server to fetch planning data. Network access to APCRDA, OpenStreetMap and unpkg is required. Existing Buyer property/account APIs remain separate.

From `frontend/`:

```powershell
npm.cmd run test:master-plan
```

The check starts its own local Expo instance, verifies a live public plot and map layers in headless Edge, and intercepts requests to test source HTTP 503 and authorization failures. It checks recovery and mobile-width layout. Screenshots and logs are written under ignored `frontend/outputs/master-plan/`. It writes no account or planning records. Physical Android interaction is a separate device check.

The same check also clicks the standard Buyer map at a known public plot and outside APCRDA coverage. To test a running local Seller preview, run `npm.cmd run test:seller-crda`; it defaults to `http://127.0.0.1:5173` and accepts `SELLER_TEST_ORIGIN` for another localhost port. That browser check supplies its own test workspace responses and blocks all workspace writes; it does not change account access or stored property records.
