// Seller property studio and property dossier.
// Browser document source; assembled in source-manifest.json order.
const extraLabels = {
  projectName: 'Project name',
  builder: 'Builder / developer',
  constructionStatus: 'Construction / possession stage',
  possessionDate: 'Seller-stated possession date',
  areaBasis: 'Area basis',
  carpetArea: 'Carpet area (sq ft)',
  builtUpArea: 'Built-up area (sq ft)',
  superArea: 'Super built-up area (sq ft)',
  baths: 'Bathrooms',
  balconies: 'Balconies',
  floor: 'Floor number',
  totalFloors: 'Total floors',
  age: 'Building age (years)',
  parking: 'Parking spaces claimed',
  lifts: 'Lifts claimed',
  maintenance: 'Monthly maintenance (INR)',
  uds: 'Undivided land share (sq yd)',
  rera: 'RERA reference',
  oc: 'Occupancy certificate availability',
  cc: 'Completion certificate availability',
  lengthM: 'Plot length (m)',
  widthM: 'Plot width (m)',
  roadStatus: 'Road formation / current condition',
  water: 'Water supply statement',
  power: 'Power / backup statement',
  drainage: 'Drainage statement',
  landUse: 'Seller-stated land use',
  boundary: 'Boundary / survey status',
  expectedRent: 'Seller-quoted monthly rent (INR)'
};
const numericExtras = new Set(['carpetArea', 'builtUpArea', 'superArea', 'baths', 'balconies', 'floor', 'totalFloors', 'age', 'parking', 'lifts', 'maintenance', 'uds', 'lengthM', 'widthM', 'expectedRent']);
function sellerEditor() {
  if (!sellerWrite()) {
    $('app').innerHTML = empty('Read-only role', 'Ask a manager for editing access.');
    return;
  }
  const p = Market.inventory.find(p => p.id === args.id) || {},
    x = p.insights || {};
  Market.edit = JSON.parse(JSON.stringify(p));
  photoDraft = p.photo || '';
  $('app').innerHTML = `${backbtn()}<div class="eyebrow">SELLER LISTING STUDIO</div><h1>${p.id ? 'Refine your listing.' : 'Tell the property story.'}</h1><div class="notice blue">This saves private firm inventory. Publication is a separate owner/manager action. Editing a published property hides its older public version until republished.</div><form id="sellerStudio" onsubmit="saveSellerStudio(event)"><div class="panel"><div class="stepbadge">01 · CORE PROPERTY FACTS</div>${input('Listing title', 'title', p.title, 'text', true)}<div class="grid">${select('Type', 'type', ['Plot', 'Apartment', 'House', 'Commercial', 'Farm land'], p.type || 'Plot')}${select('Purpose', 'purpose', ['Sale', 'Rent'], p.purpose || 'Sale')}${input('Asking price (INR)', 'price', p.price, 'number', true, 'min="1" step="0.01"')}${input('Listed area', 'area', p.area ? Number(p.area).toFixed(2) : '', 'number', true, 'min="0.01" step="0.01"')}${select('Area unit', 'unit', ['sq yd', 'sq ft', 'sq m', 'acre'], p.unit || 'sq yd')}${select('Availability', 'status', ['Draft', 'Available', 'On hold', 'Sold', 'Rented'], p.status || 'Draft')}${input('Bedrooms (where applicable)', 'bhk', p.bhk, 'number', false, 'min="0"')}${select('Facing', 'facing', ['Not supplied', 'East', 'West', 'North', 'South', 'North East', 'North West', 'South East', 'South West'], p.facing || 'Not supplied')}</div></div><div class="panel"><div class="stepbadge">02 · LOCATION & IDENTIFIERS</div><div class="grid">${input('City', 'city', p.city || 'Amaravati', 'text', true)}${input('District', 'district', p.district, 'text', true)}${input('Mandal', 'mandal', p.mandal)}${input('Village / locality', 'village', p.village, 'text', true)}${input('Latitude', 'lat', p.lat, 'number', false, 'step="any"')}${input('Longitude', 'lon', p.lon, 'number', false, 'step="any"')}</div>${input('Survey number', 'survey', p.survey)}${input('CRDA plot code', 'plotCode', p.plotCode)}${input('Approval reference (seller supplied)', 'approval', p.approval)}${input('Road width (m)', 'road', p.road, 'number', false, 'min="0" step="0.1"')}</div><details open><summary>03 · In-depth plot or flat facts</summary><p class="mini muted">Supply only what you know. Missing values remain Not supplied, rather than being guessed.</p><div class="grid">${Object.entries(extraLabels).map(([k, l]) => input(l, 'x_' + k, x[k], numericExtras.has(k) ? 'number' : k === 'possessionDate' ? 'date' : 'text', false, numericExtras.has(k) ? 'min="0" step="any"' : '')).join('')}</div><label>Amenities (comma separated; seller claims)</label><input name="amenities" value="${esc((x.amenities || []).join(', '))}" maxlength="1000"></details><div class="panel"><div class="stepbadge">04 · DESCRIPTION, MEDIA & CONTACT</div><label>Description</label><textarea name="description" maxlength="2500">${esc(p.description || '')}</textarea><label>Property photo</label><input type="file" accept="image/*" onchange="readPhoto(this)"><div id="photopreview">${photoDraft ? `<img class="photo-preview" src="${photoDraft}" alt="Selected property photo">` : ''}</div>${input('Public seller / business display name', 'seller', p.seller || Market.user.name)}${input('Contact mobile (released after enquiry acceptance)', 'phone', p.phone, 'tel', false, 'pattern="[6-9][0-9]{9}" maxlength="10"')}<small>Contact is buyer-enquiry scoped. Do not put personal IDs, private owner numbers or confidential documents into public descriptions.</small></div><button class="btn full">Save private property inventory</button></form>`;
}
async function saveSellerStudio(e) {
  e.preventDefault();
  const b = e.target.querySelector('button');
  b.disabled = true;
  try {
    const f = Object.fromEntries(new FormData(e.target)),
      p = {};
    for (const k of ['title', 'type', 'purpose', 'unit', 'status', 'facing', 'city', 'district', 'mandal', 'village', 'survey', 'plotCode', 'approval', 'description', 'seller', 'phone']) p[k] = f[k];
    for (const k of ['price', 'area', 'bhk', 'lat', 'lon', 'road']) p[k] = f[k] === '' ? null : num(f[k]);
    p.insights = {};
    for (const k of Object.keys(extraLabels)) {
      const v = f['x_' + k];
      if (v !== '' && v !== undefined) p.insights[k] = numericExtras.has(k) ? +v : v;
    }
    p.insights.amenities = (f.amenities || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 20);
    if (photoDraft) p.photo = photoDraft;
    p.assignedTo = Market.edit.assignedTo || Market.user.id;
    p.branchId = Market.edit.branchId || null;
    let id = Market.edit.id;
    if (id) p.version = Market.edit.version;
    if (Market.demo) {
      if (id) {
        const old = marketDemo.properties.find(x => x.id === id);
        Object.assign(old, p, {
          version: old.version + 1,
          published: false
        });
      } else {
        id = uid('dp');
        marketDemo.properties.unshift({
          ...p,
          id,
          version: 1,
          published: false,
          demo: true,
          views: 0
        });
      }
      saveMarketDemo();
      Market.inventory = marketDemo.properties;
      Market.catalog = localCatalog();
    } else {
      const result = await marketCall(id ? 'PATCH' : 'POST', id ? '/api/properties/' + id : '/api/properties', p);
      id = result.id;
      await refreshMarket(false);
    }
    go('marketProperty', {
      id
    });
    toast('Private inventory saved; review before publishing');
  } catch (e) {
    toast(e.message);
  } finally {
    b.disabled = false;
  }
}
function dossierPage() {
  const p = Market.catalog.find(p => p.id === args.id) || Market.inventory.find(p => p.id === args.id);
  if (!p) {
    $('app').innerHTML = empty('Select a property', 'Open a property to see its detailed insights.');
    return;
  }
  const x = p.insights || {},
    flat = p.type === 'Apartment',
    sample = window.DILIGENCE_SAMPLES[flat ? 'Apartment' : 'Plot'],
    required = flat ? ['projectName', 'builder', 'carpetArea', 'areaBasis', 'rera', 'oc', 'cc', 'uds', 'maintenance', 'parking'] : ['lengthM', 'widthM', 'roadStatus', 'landUse', 'water', 'power', 'drainage', 'boundary'],
    known = required.filter(k => x[k] !== undefined && x[k] !== ''),
    missing = required.filter(k => x[k] === undefined || x[k] === '');
  $('app').innerHTML = `${backbtn()}<div class="dossierhero"><div class="eyebrow">PROPERTY INSIGHT DOSSIER</div><h1>${flat ? 'Understand the flat.' : 'Understand the parcel.'}</h1><p>${esc(p.title)}</p><span class="tag amber">${Market.demo ? 'SYNTHETIC EVIDENCE EXAMPLE' : 'SELLER FIELDS + RECORDS NOT YET CONNECTED'}</span></div><div class="panel"><div class="row"><h2>Information completeness</h2><strong>${known.length}/${required.length}</strong></div><div class="legalprogress"><span style="width:${known.length / required.length * 100}%"></span></div><p class="mini muted">Counts supplied fields only. This is not a safety, legal, investment or title-quality score.</p><div class="facts">${required.map(k => fact(extraLabels[k], x[k])).join('')}</div></div><div class="panel"><h2>Practical checks to resolve</h2><ul class="insightlist">${missing.map(k => `<li>${esc(extraLabels[k])}: not supplied.</li>`).join('') || '<li>Core selected fields are filled; source documents and independent checks are still required.</li>'}${flat ? '<li>Compare carpet, built-up and super built-up area on the same unit basis; confirm the agreement and approved plan.</li><li>Check the actual unit, linked land share, parking rights and possession/occupancy records where applicable.</li>' : '<li>Compare survey/plot identity, extent and boundaries across the deed, revenue records, planning records and a physical survey.</li><li>Check road access, permitted land use, utilities and current site condition independently.</li>'}</ul></div>${flat && x.carpetArea && p.price ? `<div class="panel"><h2>Price basis</h2><div class="facts">${fact('Asking price per listed unit', money(p.price / p.area) + ' / ' + p.unit)}${fact('Asking price per carpet sq ft', money(p.price / x.carpetArea) + ' / sq ft')}${fact('Seller-quoted maintenance', x.maintenance ? money(x.maintenance) + ' / month' : null)}${fact('Seller-quoted rent', x.expectedRent ? money(x.expectedRent) + ' / month' : null)}</div><small>Seller inputs, not independent market comparables or guaranteed rental income.</small></div>` : ''}<div class="panel"><h2>Evidence-linked record review</h2><p class="mini muted">The structure takes inspiration from evidence-led property diligence. A plot code alone does not establish ownership, charges or a clear title.</p>${Market.demo ? `<div class="notice">${esc(sample.notice)} No real Landeed API, government search, court search or legal verification was performed.</div>${sample.sections.map(s => `<details><summary>${esc(s.title)} <span class="tag gray">${esc(s.status)}</span></summary><p>${esc(s.summary)}</p>${s.findings.map(f => `<div class="sourcefinding"><strong>${esc(f.text)}</strong><small>Source: ${esc(f.source_id || 'Not supplied')} ${f.page ? '· sample page ' + f.page : ''} · synthetic</small></div>`).join('')}</details>`).join('')}<h3>Sample coverage gaps</h3><p class="mini">EC example covers only the stated period. Litigation, CERSAI and physical survey are Not searched / Not done. Missing evidence must not become a green clearance badge.</p>` : `<div class="notice blue">No live document-procurement or title-report provider is connected. Ownership chain, EC, mortgage releases, litigation, statutory approvals and underlying source pages remain Not retrieved / Not verified.</div><p class="mini">Seller-uploaded files can be requested in your enquiry. A file being available does not establish its authenticity or legal sufficiency.</p>`}</div><div class="row"><button class="btn grow" onclick="go('plotAI')">Nearby & CRDA research</button><button class="btn secondary grow" onclick="propertyGrowthFromMarket('${p.id}')">Investment scenarios</button></div>`;
}
