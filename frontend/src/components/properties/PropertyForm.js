// Property editing, validation, photos, and deletion.
// Browser document source; assembled in source-manifest.json order.
function edit() {
  const p = state.listings.find(x => x.id === args.id) || {};
  editorRef = args.ref ? state.refs.find(r => r.id === args.ref) : null;
  editorCopy = editorRef ? {
    ...p,
    title: 'Plot in ' + editorRef.village,
    type: 'Plot',
    purpose: 'Sale',
    area: editorRef.area,
    unit: 'sq yd',
    village: editorRef.village,
    city: 'Amaravati',
    district: editorRef.district,
    mandal: editorRef.mandal,
    plotCode: editorRef.code,
    survey: editorRef.survey,
    road: editorRef.road,
    lat: editorRef.lat,
    lon: editorRef.lon
  } : p;
  const v = editorCopy;
  photoDraft = v.photo || '';
  $('app').innerHTML = `${backbtn()}<div class="eyebrow">PROPERTY LISTING</div><h1>${p.id ? 'Edit property' : 'Add a property'}</h1><div class="notice blue">Saved on this device. Imported plot data is reference information; enter your own asking price and authorized contact.</div><form id="propertyForm" onsubmit="saveProperty(event)"><div class="panel"><h2>Basic details</h2>${input('Title', 'title', v.title, 'text', true)}<div class="grid">${select('Property type', 'type', ['Plot', 'Apartment', 'House', 'Commercial', 'Farm land'], v.type || 'Plot')}${select('Purpose', 'purpose', ['Sale', 'Rent'], v.purpose || 'Sale')}${input('Asking price (INR)', 'price', v.price, 'number', true, 'min="1" step="0.01"')}${input('Area', 'area', v.area ? Number(v.area).toFixed(2) : '', 'number', true, 'min="0.01" step="0.01"')}${select('Area unit', 'unit', ['sq yd', 'sq ft', 'sq m', 'acre'], v.unit || 'sq yd')}${select('Availability', 'status', ['Draft', 'Available', 'On hold', 'Sold', 'Rented'], v.status || 'Draft')}</div></div><div class="panel"><h2>Location & plot identity</h2><div class="grid">${input('City', 'city', v.city || 'Amaravati', 'text', true)}${input('District', 'district', v.district, 'text', true)}${input('Mandal', 'mandal', v.mandal)}${input('Revenue village / locality', 'village', v.village, 'text', true)}</div>${input('CRDA plot code (optional)', 'plotCode', v.plotCode)}${input('Survey / subdivision', 'survey', v.survey)}<div class="grid">${input('Latitude', 'lat', v.lat, 'number', false, 'step="any" min="-85" max="85"')}${input('Longitude', 'lon', v.lon, 'number', false, 'step="any" min="-180" max="180"')}</div><small>Enter exact coordinates from your documents, or pick an approximate pin below.</small><div class="space"></div><button class="btn secondary full" type="button" onclick="pickMap()">${icon('map')} Pick position on map</button><div id="pickmap" class="map" hidden></div></div><div class="panel"><h2>Property facts & documents</h2><div class="grid">${select('Facing', 'facing', ['Not supplied', 'East', 'West', 'North', 'South', 'North East', 'North West', 'South East', 'South West'], v.facing || 'Not supplied')}${input('Road width (metres)', 'road', v.road, 'number', false, 'min="0" step="0.1"')}${input('Bedrooms (where applicable)', 'bhk', v.bhk, 'number', false, 'min="0" max="20"')}${select('Documents', 'documents', ['Not supplied', 'Available on request'], v.documents || 'Not supplied')}</div>${input('Approval reference (seller supplied)', 'approval', v.approval)}<label>Description</label><textarea name="description" maxlength="2500">${esc(v.description || '')}</textarea><label>Photo (optional)</label><input type="file" accept="image/*" onchange="readPhoto(this)"><div id="photopreview">${photoDraft ? `<img class="photo-preview" src="${photoDraft}" alt="Selected property">` : ''}</div></div><div class="panel"><h2>Seller contact</h2>${input('Public seller / business name', 'seller', v.seller)}${input('Public mobile (optional, 10 digits)', 'phone', v.phone, 'tel', false, 'pattern="[6-9][0-9]{9}" maxlength="10"')}<small>Only enter a phone number you are authorized to display in this local listing.</small></div><button class="btn full" type="submit">Save property on device</button>${p.id ? `<button type="button" class="btn danger full" style="margin-top:10px" onclick="deleteProperty('${p.id}')">Delete this local property</button>` : ''}</form>`;
}
function input(l, n, v, type = 'text', req = false, extra = '') {
  return `<div><label for="f_${n}">${l}${req ? ' *' : ''}</label><input id="f_${n}" name="${n}" type="${type}" value="${esc(v ?? '')}" ${req ? 'required' : ''} ${extra} maxlength="250"></div>`;
}
function select(l, n, a, v) {
  return `<div><label for="f_${n}">${l}</label><select name="${n}" id="f_${n}">${options(a, v)}</select></div>`;
}
