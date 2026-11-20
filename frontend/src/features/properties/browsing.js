function home() {
  const rows = filterListings();
  $('app').innerHTML = `<div class="hero"><div class="eyebrow">PROPERTY • LOCATION • DUE DILIGENCE</div><h1>${t('Find the right property. Know the plot.', 'సరైన ప్రాపర్టీని కనుగొనండి.')}</h1><p>${t('Property details, map locations and CRDA plot references in one simple place.', 'ప్రాపర్టీ వివరాలు, మ్యాప్ మరియు CRDA ప్లాట్ సమాచారం ఒకే చోట.')}</p><button class="btn" style="background:#edb76f;color:#191658" onclick="go('edit')">${icon('plus')} ${t('List a property', 'ప్రాపర్టీ జోడించండి')}</button></div><form class="searchline" onsubmit="event.preventDefault();setFilter('q',this.q.value)"><input name="q" aria-label="Search properties" value="${esc(view.q)}" placeholder="Village, city, survey or plot code"><button class="btn" aria-label="Search">${icon('search')}</button></form><div class="chips">${['All', 'Plot', 'Apartment', 'House', 'Commercial', 'Farm land'].map(x => `<button class="chip ${view.type === x ? 'active' : ''}" onclick="setFilter('type','${x}')">${x}</button>`).join('')}</div><details><summary>More filters ${view.mine ? '• My properties' : ''}</summary><div class="grid"><div><label>Purpose</label><select onchange="setFilter('purpose',this.value)">${options(['All', 'Sale', 'Rent'], view.purpose)}</select></div><div><label>Maximum budget (INR)</label><input type="number" min="0" value="${esc(view.max)}" onchange="setFilter('max',this.value)"></div></div><div class="checkrow" style="margin-top:14px"><input id="mine" type="checkbox" ${view.mine ? 'checked' : ''} onchange="setFilter('mine',this.checked)"><label for="mine">Only my local properties</label></div></details><div class="row sectionhead"><h2>${t('Property listings', 'ప్రాపర్టీ లిస్టింగ్స్')}</h2><span class="count">${rows.length} results</span></div><div class="cards">${rows.map(card).join('') || empty('No properties match', 'Try a different place or add your own property.')}</div><p class="footertext">Standalone prototype. Listings you add stay on this device. Sample listings are fictional and their pins are approximate. CRDA records are reference plots, not sale offers.</p><button class="btn outline full" onclick="go('about')">Data sources & app information</button>`;
}
function options(a, v) {
  return a.map(x => `<option ${x === v ? 'selected' : ''}>${esc(x)}</option>`).join('');
}
function empty(h, p) {
  return `<div class="empty">${icon('home')}<h3>${h}</h3><p class="muted">${p}</p></div>`;
}
function toggleSave(id) {
  state.saved = state.saved.includes(id) ? state.saved.filter(x => x !== id) : [...state.saved, id];
  if (persist()) {
    toast(state.saved.includes(id) ? 'Property saved' : 'Removed from saved');
    render();
  }
}
function savedPage() {
  $('app').innerHTML = `<div class="eyebrow">YOUR SHORTLIST</div><h1>${t('Saved properties', 'సేవ్ చేసిన ప్రాపర్టీలు')}</h1><p class="muted">Your saved listing details and legal-check progress.</p><div class="cards">${state.listings.filter(p => state.saved.includes(p.id)).map(card).join('') || empty('Your shortlist is empty', 'Tap the heart on any property to save it here.')}</div>`;
}
function fact(k, v) {
  return `<div class="fact"><span>${k}</span><b>${v === undefined || v === null || v === '' ? 'Not supplied' : esc(v)}</b></div>`;
}
function detail() {
  const p = state.listings.find(x => x.id === args.id);
  if (!p) {
    $('app').innerHTML = empty('Property unavailable', 'Return to the property list.');
    return;
  }
  const ref = state.refs.find(r => r.code === p.plotCode);
  $('app').innerHTML = `${backbtn()}<div class="visual" style="height:220px;border-radius:18px;margin-bottom:17px">${p.photo ? `<img src="${p.photo}" alt="Property photo">` : illustration(p)}<span class="tag ${p.demo ? 'amber' : ''}">${p.demo ? 'FICTIONAL SAMPLE' : esc(p.status)}</span>${!p.photo ? '<small>Illustration</small>' : ''}</div><div class="row"><span class="tag gray">${esc(p.type)} • ${esc(p.purpose)}</span><button onclick="toggleSave('${p.id}')">${state.saved.includes(p.id) ? '♥ Saved' : '♡ Save'}</button></div><h1>${esc(p.title)}</h1><p class="muted">${icon('pin')} ${esc(p.village)}, ${esc(p.city || p.district)}</p><div class="price">${money(p.price)}${p.purpose === 'Rent' ? '<small> /month</small>' : ''}</div><small>${p.area && p.price ? money(p.price / p.area) + ' / ' + esc(p.unit) : ''}</small>${p.demo ? '<div class="notice">Fictional sample, not a genuine sale offer. Coordinates are approximate demonstration pins.</div>' : '<div class="notice blue">Device-local listing. Owner-entered facts and asking price are not independently verified.</div>'}<div class="panel"><h2>Property details</h2><div class="facts">${fact('Area', fmt(p.area) + ' ' + p.unit)}${fact('Facing', p.facing)}${fact('Road width', p.road ? fmt(p.road) + ' m' : null)}${fact('Bedrooms', p.bhk)}${fact('District', p.district)}${fact('Mandal', p.mandal)}${fact('Revenue village', p.village)}${fact('Availability', p.status)}${fact('CRDA plot code', p.plotCode)}${fact('Survey / subdivision', p.survey)}${fact('Approval reference', p.approval)}${fact('Document availability', p.documents || 'Not supplied')}</div></div><div class="panel"><h2>About this property</h2><p>${esc(p.description || 'No description supplied.')}</p><small>Public seller: ${esc(p.seller || 'Not supplied')}</small></div>${ref ? `<div class="notice blue">Linked CRDA reference: ${esc(ref.code)}<br><button class="btn secondary" onclick="go('ref',{id:'${ref.id}'})">View source plot & boundary</button></div>` : ''}<div class="panel"><div class="row"><h2>Property location</h2><span class="tag gray">${p.demo ? 'Approximate demo pin' : ref ? 'Imported GIS centre' : 'User-entered pin'}</span></div>${coords(p.lat, p.lon) ? `<div id="detailmap" class="map" style="height:290px"></div><a class="btn outline full" href="${mapsURL(p)}">Open Google Maps / Directions</a><small>${Number(p.lat).toFixed(6)}, ${Number(p.lon).toFixed(6)}. Map position alone does not establish ownership.</small>` : '<p class="muted">No coordinates supplied. Edit this property to add a map pin.</p>'}</div><div class="panel"><h2>Legal search & checks</h2><p class="muted">Search official records and track the documents you have reviewed.</p><button class="btn full" onclick="go('legal',{id:'${p.id}'})">${icon('legal')} Open legal search</button></div><div class="row wrap"><button class="btn outline grow" onclick="shareProperty('${p.id}')">${icon('share')} Share details</button><button class="btn secondary grow" onclick="go('edit',{id:'${p.id}'})">Edit property</button></div>${!p.demo && /^\d{10}$/.test(p.phone || '') ? `<div class="stickyaction row"><a class="btn grow" href="tel:+91${p.phone}">Call seller</a><a class="btn secondary grow" href="https://wa.me/91${p.phone}?text=${encodeURIComponent('I am interested in ' + p.title)}">WhatsApp</a></div>` : '<p class="footertext">No contact supplied. Sample listings do not include real seller phone numbers.</p>'}`;
  if (coords(p.lat, p.lon)) makeMap('detailmap', [p], ref ? [ref] : [], p.lat, p.lon, 16);
}
function mapsURL(p) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.lat + ',' + p.lon);
}
function shareText(title, text) {
  if (window.AndroidApp?.share) AndroidApp.share(title, text);else if (navigator.share) navigator.share({
    title,
    text
  }).catch(() => {});else {
    navigator.clipboard?.writeText(text).then(() => toast('Copied to clipboard')).catch(() => showText(title, text));
  }
}
function showText(title, text) {
  $('app').innerHTML = `${backbtn()}<h2>${esc(title)}</h2><textarea readonly style="min-height:350px">${esc(text)}</textarea><p class="muted">Select and copy the text.</p>`;
}
function shareProperty(id) {
  const p = state.listings.find(x => x.id === id);
  shareText(p.title, `${p.demo ? 'FICTIONAL SAMPLE - NOT FOR SALE\n' : ''}${p.title}\n${p.village}, ${p.city || p.district}\n${p.area} ${p.unit} | ${money(p.price)}${p.purpose === 'Rent' ? ' /month' : ''}\n${p.plotCode ? 'Plot: ' + p.plotCode + '\n' : ''}${coords(p.lat, p.lon) ? mapsURL(p) : ''}\nListing facts are seller supplied. Independently verify documents.`);
}
