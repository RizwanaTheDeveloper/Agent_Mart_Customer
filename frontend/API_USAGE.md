# API usage and request cleanup

The active services remain available because they support current features:

| Service | Feature |
| --- | --- |
| APCRDA ArcGIS REST | Plot codes/numbers, boundaries, land use and planning layers |
| OpenStreetMap tiles | Background maps |
| Overpass, with existing backup providers | Nearby landmarks |
| Photon fallback | Landmark lookup when Overpass providers fail |
| Nest account API | Registration, login, session refresh, profile and logout |
| Existing Buyer/Seller workspace APIs | Published listings, saves, enquiries, visits, documents and team management |

Google Maps entries are external links for opening locations or directions. Leaflet is the map display library. Neither is an additional property-data API.

## Removed duplicate requests

- Overpass searches now contact one server at a time, with a bounded overall failover window. A healthy response stops further providers; existing backup endpoints remain available after failure.
- Identical concurrent nearby-landmark searches share one request. Successful results are cached for five minutes, with a bounded cache size.
- Repeated requests for the same normalized CRDA plot boundary share a request and five-minute public-data cache.
- Simultaneous published-listing reads share the complete paginated load. Later manual refreshes fetch again, so publication changes remain discoverable immediately.
- Cancelling one screen does not cancel another screen's shared lookup. When the last subscriber cancels, its request is aborted. Failures are not cached.

Authentication requests and private account data are excluded from this public read cache. No active service or account data was deleted. User-selected features remain in place.

Run `npm.cmd run test:api-requests` from `frontend/`. The suite uses isolated local HTTP stand-ins to verify request counts, fallbacks, cancellation, expiry, retry and fresh catalogue pagination. It does not contact production services.
