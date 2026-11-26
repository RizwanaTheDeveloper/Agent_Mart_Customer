# AgentMart Customer 4.5 APK field comparison

Reference: `AgentMart_Customer_Managed_v4.5.apk`, supplied by the user. Its `assets/app.js` matches the script already embedded in `frontend/buyer/src/buyer-tools/vendor/assets.json` exactly (268,593 characters). The APK was inspected as an archive; its Android executable was not installed or executed. Extracted audit material lives in ignored `outputs/apk-comparison/`.

## Buyer frontend

| APK field group | Current implementation |
| --- | --- |
| Listed area, area unit, price, property type, purpose and facing | Existing discovery/detail screens retained; price per area added to native details. |
| Bedrooms | Native details now receive the Seller's `bhk` value correctly. |
| District, mandal, village, survey/subdivision, CRDA plot code, approval reference, road width | Added to native Buyer property facts. |
| Latitude, longitude and property map | Added to native details; public coordinates require the Seller's pin confirmation. |
| Public seller/business display name, listing photograph | Added to the public property projection and native detail screen. Phone numbers remain private. |
| Project name, builder, construction stage, possession date, area basis, carpet/built-up/super built-up area | Added to the expandable Project and building section. |
| Bathrooms, balconies, floor, total floors, age, parking, lifts, maintenance and undivided land share | Added to the same section. |
| Plot length/width, road condition, water, power, drainage, land use, boundary information | Added to Plot and utilities. Existing Seller fields for farming/commercial properties are included. |
| RERA, OC, CC, ownership, mortgage/charges, disputes and expected rent | Added as seller-stated references, with missing facts shown as Not supplied. |
| Amenities | Added to native details; both APK-style `insights.amenities` and current Seller amenities are supported. |
| Preferred city, property type and budget ceiling | Added to Buyer Profile. Stored per account on this device and applied when Discover opens. These preferences are not synchronized across devices. |
| Plot research, source evidence, legal checklists, development projects, investment scenarios and their input fields | Already present in the embedded Buyer tools; preserved without copying a second implementation. CRDA master plan remains a separate native navigation entry. |

## Seller frontend

All 29 keys in the APK's `extraLabels` listing-field definition are present in the 39-field shared property-detail definition. Existing Seller-specific fields, including furnishing, ownership, farming and commercial facts, are preserved.

| APK field group | Current implementation |
| --- | --- |
| Core listing facts, availability, identifiers, location, photo, description, business name and private mobile | Already present in Seller Editor; retained. |
| Detailed property facts | Organized into Project and building, Plot and utilities, and Seller-stated references. |
| Numeric facts | Carpet/built-up/super area, bathrooms, balconies, floors, age, parking, lifts, maintenance, UDS, length/width and expected rent now use numeric inputs and numeric saved values. |
| Possession date | Uses a date input. |
| Amenities | Supports editing existing APK-style amenities arrays. |
| Purchase price, acquisition costs, fixed annual holding cost, sale costs and inflation | Added to Seller Research → Investment scenarios, matching the APK's field meanings. |
| Downside, moderate and higher-growth annual rates | Added as three separate editable assumptions; results include acquisition/holding/sale costs and inflation-adjusted net sale proceeds. |
| Rental income and duration | Existing project inputs retained alongside the APK fields. |
| Enquiry contact, stage, follow-up, assignment, notes; visit time/status; team/branch controls and document checklist | Existing Seller workflows retained. |

## Scope and compatibility

The native screens retain the project's visual design. The previously removed workspace switch, dropdown, shortcut badge and Seller toolbar remain removed. Buyer facts are seller claims, rather than verified title or ownership information. Scenario rates are user inputs, rather than predictions derived from landmarks or plot codes.

The public Buyer listing endpoint was extended only to supply allowlisted facts needed by these screens. It continues to exclude private notes, checklist status, document keys, contact numbers and assignment metadata. PostgreSQL account login and the existing property workspace API continue to have their documented migration boundary.

The APK also contains backend-dependent security and workflow screens: MFA/recovery codes, session administration, invitations, gated contact/document sharing and listing reports. This field update does not create those services in the Nest backend. Their embedded tools screens and the existing Seller access rules remain in place; complete workflow parity requires separately connecting those services. Seller account-type/firm onboarding also follows the current workspace model rather than silently importing the APK's separate identity system.

## Verification

`frontend/npm run test:apk-fields` checks Seller numeric/date inputs, investment cost calculations, Buyer field visibility and mobile layout using isolated preview servers. Screenshots are stored under ignored `frontend/outputs/apk-fields/`. Backend Buyer API tests verify the public-field projection and private-field exclusions. The PostgreSQL authentication/browser suite checks profile preference persistence alongside login, switching accounts and logout. Android/iOS/web exports check bundle compatibility; physical Android operation is a separate device test.
