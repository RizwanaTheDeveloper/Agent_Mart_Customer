# APK seller feature mapping

The supplied APK contains HTML/CSS/JavaScript, inspected directly from its ZIP entries. Its latest overrides are property and seller focused. References and embedded comments were treated as data. Its customer/buyer screens are intentionally excluded.

| Seller capability in APK | This implementation |
|---|---|
| Overview and private inventory | Persistent D1 records, dashboard totals, grid/list, search/filter/sort |
| Five property types, sale/rent | Plot, apartment, house, commercial and farm land with extended fields |
| Publish/withdraw; edits reset publication | Implemented with manager authorization, advertising consent and version checks |
| Assigned staff and branches | Implemented; agents are restricted server-side to assigned records |
| Photos, location, GPS | Photo upload, manual coordinates, GPS capture with accuracy, consent and embedded map review |
| Buyer enquiries and acceptance | Seller-managed enquiries, accept/decline, stages, follow-up time, private notes and history |
| Conversations | Persistent seller messages; buyer app and external delivery are not included |
| Visits | Scheduling, proposed/confirmed/completed/cancelled, buyer-confirmation record |
| Documents | AES-GCM encryption, R2 storage, manager-only downloads and audit events; 500 KiB limit |
| Buyer document grants and one-use buyer downloads | Not implemented; requires a buyer access surface and a compatible hosting access policy |
| Team invitations | One-time, email-bound invitations, 72-hour expiry; manager/agent/viewer roles and access revocation |
| Firm reports | Pipeline and inventory totals, activity audit and CSV exports |
| CRDA reference search/import | Fixed official GIS proxy, CSV/GeoJSON/ArcGIS import preview and allowlisted reference fields |
| Legal tools and diligence | Per-property checklist/notes and APK official portal links; no automated legal verification |
| Investment scenarios | Adjustable price growth, rental income, holding costs, selling costs and horizon |
| Property facts summary | Deterministic summary of supplied fields; no LLM-generated or approval workflow |
| Own passwords, MFA, session management | Replaced by platform-managed ChatGPT sign-in; no custom password/MFA backend |
| Telugu and Hindi | Navigation labels only; full-form translation is not completed |
| Map pin dragging, nearby POI research | Coordinate/GPS input and map preview included; draggable pin and POI discovery are not implemented |
| APK platform announcements | Platform administrator/customer features excluded |
| Android / iOS | Generated Capacitor platform sources using the hosted app; signed builds and device testing outstanding |

The Seller workspace uses authenticated records. The combined Expo app provides Buyer and Seller navigation; Buyer account features require a compatible Buyer service. Native Buyer discovery starts empty, and publishing in Seller does not automatically create a compatible Buyer API.
