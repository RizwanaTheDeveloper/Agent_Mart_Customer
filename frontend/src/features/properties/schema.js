// Complete property form schema, fields, and disclosures.
// Browser document source; assembled in source-manifest.json order.
const Schema43 = window.PROPERTY_SCHEMA43;
for (const [k, s] of Object.entries(Schema43)) {
  extraLabels[k] = s.label;
  if (s.kind === 'number') numericExtras.add(k);
}
const Complete43 = {
  draft: {},
  type: 'Plot'
};
function schemaField(k, values = {}) {
  const s = Schema43[k],
    v = values[k] ?? '',
    req = s.required ? ' required' : '';
  if (s.kind === 'select') {
    const def = k === 'areaBasis' ? Complete43.type === 'Plot' || Complete43.type === 'Farm land' ? 'Plot / land area' : 'Built-up area' : s.options[0];
    const value = s.options.includes(v) ? v : def;
    return `<div class="field43"><label for="x43_${k}">${esc(s.label)}${s.required ? ' *' : ''}</label><select id="x43_${k}" name="x_${k}"${req}>${s.options.map(o => `<option value="${esc(o)}" ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
  }
  const type = s.kind === 'number' ? 'number' : s.kind === 'date' ? 'date' : k === 'videoUrl' ? 'url' : 'text';
  return `<div class="field43"><label for="x43_${k}">${esc(s.label)}${s.required ? ' *' : ''}</label><input id="x43_${k}" name="x_${k}" type="${type}" value="${esc(v)}"${req}${s.kind === 'number' ? ' min="0" step="' + (['baths', 'balconies', 'floor', 'totalFloors', 'age', 'parking', 'lifts', 'borewells'].includes(k) ? '1' : 'any') + '"' : ''}${k === 'pincode' ? ' pattern="[1-9][0-9]{5}" inputmode="numeric" maxlength="6"' : type === 'text' ? ' maxlength="' + (k === 'address' ? '500' : '250') + '"' : ''}${k === 'videoUrl' ? ' placeholder="https://…" maxlength="500"' : ''}></div>`;
}
function fieldGroup43(group, x, type = Complete43.type) {
  return Object.entries(Schema43).filter(([k, s]) => s.group === group && s.types.includes(type)).map(([k]) => schemaField(k, x)).join('');
}
function capture43() {
  const f = $('sellerStudio');
  if (!f) return;
  for (const [k, v] of new FormData(f)) if (k.startsWith('x_')) Complete43.draft[k.slice(2)] = v;
}
function changeType43(type) {
  capture43();
  Complete43.type = type;
  Complete43.draft.areaBasis = ['Plot', 'Farm land'].includes(type) ? 'Plot / land area' : 'Built-up area';
  $('typeFacts43').innerHTML = fieldGroup43('specific', Complete43.draft);
  $('legalFacts43').innerHTML = fieldGroup43('legal', Complete43.draft);
  $('areaBasis43').innerHTML = schemaField('areaBasis', Complete43.draft);
  window.applyLanguage43?.();
}
sellerEditor = function () {
  if (!sellerWrite()) {
    $('app').innerHTML = empty('Seller access required', 'Use a seller or property owner account.');
    return;
  }
  let p = Market.inventory.find(p => p.id === args.id) || {};
  const ref = args.ref ? state.refs.find(r => r.id === args.ref) : null;
  if (!p.id && ref) p = {
    type: 'Plot',
    purpose: 'Sale',
    title: 'Plot in ' + ref.village,
    area: ref.area,
    unit: 'sq yd',
    city: 'Amaravati',
    village: ref.village,
    district: ref.district,
    mandal: ref.mandal,
    plotCode: ref.code,
    survey: ref.survey,
    road: ref.road,
    lat: ref.lat,
    lon: ref.lon
  };
  const x = p.insights || {};
  Complete43.type = p.type || 'Plot';
  Complete43.draft = {
    ...x
  };
  Market.edit = JSON.parse(JSON.stringify(p));
  photoDraft = p.photo || '';
  $('app').innerHTML = `${backbtn()}<div class="eyebrow">SELLER / OWNER LISTING STUDIO</div><h1>${p.id ? 'Edit property' : 'Add a property'}</h1><p class="muted">Complete the core fields. Add optional facts you know. Save privately, then review before publishing.</p><div class="formsteps43"><span>1 · Basics</span><span>2 · Location</span><span>3 · Details</span><span>4 · Review</span></div><form id="sellerStudio" onsubmit="saveCompleteProperty(event)"><input type="hidden" name="x_listingSchema" value="4.3"><section class="panel"><h2>Basic property details</h2>${input('Listing title', 'title', p.title, 'text', true)}<div class="grid"><div><label>Property type *</label><select name="type" required onchange="changeType43(this.value)">${options(['Plot', 'Apartment', 'House', 'Commercial', 'Farm land'], p.type || 'Plot')}</select></div>${select('Purpose *', 'purpose', ['Sale', 'Rent'], p.purpose || 'Sale')}${select('Availability *', 'status', ['Draft', 'Available', 'On hold', 'Sold', 'Rented'], p.status || 'Draft')}${input('Asking price (INR)', 'price', p.price, 'number', true, 'min="1" step="0.01"')}${input('Listed area', 'area', p.area, 'number', true, 'min="0.01" step="0.01"')}${select('Area unit *', 'unit', ['sq yd', 'sq ft', 'sq m', 'acre'], p.unit || 'sq yd')}<div id="areaBasis43">${schemaField('areaBasis', x)}</div>${select('Facing', 'facing', ['Not supplied', 'East', 'West', 'North', 'South', 'North East', 'North West', 'South East', 'South West'], p.facing || 'Not supplied')}${input('Bedrooms', 'bhk', p.bhk, 'number', false, 'min="0" max="100" step="1"')}</div><p class="mini muted">Sale price means total asking price. Rent means monthly rent. Area and price are seller inputs.</p></section><section class="panel"><h2>Location & property identity</h2><div class="grid">${fieldGroup43('location', {
    state: 'Andhra Pradesh',
    ...x
  })}${input('District', 'district', p.district, 'text', true)}${input('City', 'city', p.city || 'Amaravati', 'text', true)}${input('Mandal', 'mandal', p.mandal)}${input('Village / locality', 'village', p.village, 'text', true)}${input('Latitude', 'lat', p.lat, 'number', false, 'step="any" min="-85" max="85"')}${input('Longitude', 'lon', p.lon, 'number', false, 'step="any" min="-180" max="180"')}${input('Survey / subdivision', 'survey', p.survey)}${input('CRDA plot code', 'plotCode', p.plotCode)}${input('Road width (m)', 'road', p.road, 'number', false, 'min="0" step="0.1"')}</div><small>Coordinates are optional. A map pin is not a surveyed boundary or proof of ownership.</small></section><details open><summary>Property-specific details</summary><div class="grid" id="typeFacts43">${fieldGroup43('specific', x)}</div></details><details><summary>Pricing & availability extras</summary><div class="grid">${fieldGroup43('price', x)}</div><small>Deposit is relevant to rent. Estimated rent and future values are not guaranteed.</small></details><details><summary>Legal & document disclosures</summary><div class="grid" id="legalFacts43">${fieldGroup43('legal', x)}</div>${input('Approval reference', 'approval', p.approval)}<div class="notice blue">Seller disclosures are not legal verification. Missing documents and unknown charges remain unresolved.</div></details><details><summary>Amenities & media</summary><label>Amenities (comma separated)</label><input name="amenities" maxlength="1000" value="${esc((x.amenities || []).join(', '))}" placeholder="Water, lift, parking…"><label>Property photo</label><input type="file" accept="image/*" onchange="readPhoto(this)"><div id="photopreview">${photoDraft ? `<img class="photo-preview" src="${photoDraft}" alt="Property photo">` : ''}</div>${schemaField('videoUrl', x)}<small>One compressed photo is supported. Video links open externally; a gallery or video-upload service is not configured.</small></details><section class="panel"><h2>Seller contact & description</h2><div class="grid">${fieldGroup43('contact', x)}</div>${input('Seller / business display name', 'seller', p.seller || Market.user.name, 'text', true)}${input('Seller mobile', 'phone', p.phone, 'tel', true, 'pattern="[6-9][0-9]{9}" maxlength="10" inputmode="tel"')}<label>Description</label><textarea name="description" maxlength="2500">${esc(p.description || '')}</textarea><small>Contact is released through accepted buyer enquiries. Do not put private personal IDs into public listing text.</small></section><div class="notice blue">Saving creates private inventory. Only an owner or manager can publish it to buyers.</div><button class="btn full" type="submit">Save private property inventory</button></form>`;
};
const oldSaveComplete = saveSellerStudio;
async function saveCompleteProperty(e) {
  capture43();
  await oldSaveComplete(e);
}
// Add all supplied fields to the buyer/seller dossier without inventing values.
const oldDossier43 = classicDossier;
classicDossier = function () {
  oldDossier43();
  const p = state.listings.find(p => p.id === args.id);
  if (!p) return;
  const x = p.insights || {};
  const sections = [['location', 'Address details'], ['specific', 'Additional property facts'], ['price', 'Pricing & availability extras'], ['legal', 'Seller document disclosures']];
  for (const [group, title] of sections) {
    const fields = Object.entries(Schema43).filter(([k, s]) => s.group === group && s.types.includes(p.type) && x[k] !== undefined && x[k] !== '');
    if (fields.length) $('app').insertAdjacentHTML('beforeend', `<section class="panel"><h2>${title}</h2><div class="facts">${fields.map(([k, s]) => fact(s.label, x[k])).join('')}</div></section>`);
  }
  if (x.videoUrl && /^https:\/\//.test(x.videoUrl)) $('app').insertAdjacentHTML('beforeend', `<a class="btn outline full" href="${esc(x.videoUrl)}" rel="noreferrer">Open property video</a>`);
};
const priorProperty43 = marketProperty;
marketProperty = async function () {
  await priorProperty43();
  if (!['detail', 'marketProperty'].includes(route) || !Market.active) return;
  const x = Market.active.insights || {},
    form = $('app').querySelector('form[onsubmit^="submitMarketEnquiry"]');
  if (form && /^[6-9][0-9]{9}$/.test(Market.profile.phone || '')) form.elements.namedItem('phone').value = Market.profile.phone;
  if (!$('locationExtra43') && (x.address || x.pincode)) $('app').insertAdjacentHTML('beforeend', `<section id="locationExtra43" class="panel"><h2>Address details</h2><div class="facts">${fact('State', x.state)}${fact('Address / locality details', x.address)}${fact('PIN code', x.pincode)}${fact('Nearby landmark', x.landmark)}</div></section>`);
};
aboutPage = function () {
  $('app').innerHTML = `${backbtn()}<div class="eyebrow">AGENT MART • 4.3</div><h1>Data & app information</h1><section class="panel"><h2>Buyer and seller workspaces</h2><p>Buyer discovery, seller inventory, publication, interest tracking, follow-ups, maps, legal tools and CRDA parcel references.</p><p>Real accounts require your deployed HTTPS backend. Demo accounts, listings and report examples are fictional.</p></section><section class="panel"><h2>Language selection</h2><p>English, Telugu and Hindi are available for main navigation, account controls and property-form labels. Some supporting technical help remains in English. Listing descriptions, personal names, plot identifiers and source records retain their original text.</p><button class="btn outline full" onclick="chooseLanguage43()">Choose language</button></section><section class="panel"><h2>Sources and verification</h2><p>Seller disclosures are not legal verification. Live title-report procurement is not connected. The existing GIS, nearby-place and optional AI services require network availability or configuration.</p><a href="${GIS}">APCRDA GIS plot layer ↗</a><br><a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors ↗</a></section><div class="notice">Version 4.5 uses the same prototype package and signing identity as v2-v4.4. Back up device-local data before changing installations. Physical Android installation and upgrade have not been tested here.</div>`;
};

// Static UI translation. Listing text, numbers, identifiers and source evidence stay original.
