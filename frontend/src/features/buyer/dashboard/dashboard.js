// APK dashboard, property presentation, account view, and navigation.
// Browser document source; assembled in source-manifest.json order.
const classicBase = {
  render,
  detail,
  marketProperty,
  marketLogout,
  startMarketDemo,
  savedPage,
  header
};
const Classic = {
  mode: 'grid',
  sort: 'recent'
};
paths.account = 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0';
const classicEdit = edit,
  classicSaveProperty = saveProperty;
edit = function () {
  if (Market.user) {
    if (buyerSide()) {
      go('classicAccount');
      return;
    }
    go('sellerEdit', args);
    return;
  }
  classicEdit();
  const form = $('propertyForm');
  if (!form) return;
  const p = state.listings.find(x => x.id === args.id) || {},
    x = p.insights || {};
  const fields = ['projectName', 'builder', 'areaBasis', 'carpetArea', 'superArea', 'floor', 'parking', 'rera', 'oc', 'maintenance', 'lengthM', 'widthM', 'landUse', 'roadStatus', 'water', 'power', 'drainage', 'boundary'];
  const submit = form.querySelector('[type=submit]');
  submit.insertAdjacentHTML('beforebegin', `<details><summary>More plot / flat insights (optional)</summary><p class="mini muted">Enter only known facts. These are seller statements, not verified records.</p><div class="grid">${fields.map(k => input(extraLabels[k], 'insight_' + k, x[k], numericExtras.has(k) ? 'number' : 'text', false, numericExtras.has(k) ? 'min="0" step="any"' : '')).join('')}</div></details>`);
};
saveProperty = async function (e) {
  if (Market.user) return classicSaveProperty(e);
  const fields = Object.fromEntries(new FormData(e.target)),
    insights = {};
  for (const [k, v] of Object.entries(fields)) {
    if (k.startsWith('insight_') && v !== '') {
      const name = k.slice(8);
      insights[name] = numericExtras.has(name) ? +v : v;
    }
  }
  await classicSaveProperty(e);
  if (route === 'detail') {
    const p = state.listings.find(x => x.id === args.id);
    if (p) {
      p.insights = insights;
      for (const k of Object.keys(p)) if (k.startsWith('insight_')) delete p[k];
      persist();
      render();
    }
  }
};
function classicSaved() {
  return Market.user && buyerSide() ? Market.saved : state.saved;
}
function classicRows() {
  const q = view.q.trim().toLowerCase();
  let rows = state.listings.filter(p => (view.type === 'All' || p.type === view.type) && (view.purpose === 'All' || p.purpose === view.purpose) && (!view.max || p.price <= +view.max) && (!q || [p.title, p.village, p.city, p.district, p.plotCode, p.survey, p.insights?.projectName].join(' ').toLowerCase().includes(q)));
  if (Classic.sort === 'low') rows.sort((a, b) => a.price - b.price);
  if (Classic.sort === 'high') rows.sort((a, b) => b.price - a.price);
  if (Classic.sort === 'area') rows.sort((a, b) => a.type.localeCompare(b.type) || a.unit.localeCompare(b.unit) || b.area - a.area);
  return rows;
}
header = function () {
  const side = Market.user ? buyerSide() ? 'Buyer workspace' : 'Seller / firm workspace' : 'Property • Amaravati & beyond';
  $('header').innerHTML = `<div class="mark">${icon('home')}</div><div class="brand"><strong>Agent Mart</strong><small>${esc(side)}</small></div><button class="iconbtn" aria-label="Add property" onclick="classicAdd()">${icon('plus')}</button><button class="avatarbtn" aria-label="Account and firm dashboard" onclick="go('classicAccount')">${Market.user ? esc(Market.user.name.slice(0, 1)) : icon('account')}</button>`;
  let active = ['detail', 'marketProperty', 'edit', 'sellerEdit', 'dossier', 'classicDossier'].includes(route) ? 'home' : ['ref', 'preview'].includes(route) ? 'crda' : route === 'marketSaved' ? 'saved' : route;
  $('nav').innerHTML = [['home', 'home', 'Properties'], ['map', 'map', 'Map'], ['legal', 'legal', 'Legal'], ['crda', 'crda', 'CRDA plots'], ['saved', 'saved', 'Saved']].map(([r, i, l]) => `<button class="${active === r ? 'active' : ''}" aria-label="${l}" onclick="go('${r}')">${icon(i)}<span>${l}</span></button>`).join('');
};
function classicAdd() {
  if (Market.user) {
    if (buyerSide()) {
      go('classicAccount');
      toast('Sign in with a seller account to publish property.');
      return;
    }
    go('sellerEdit');
    return;
  }
  go('edit');
}
function classicSearch(e) {
  e.preventDefault();
  view.q = e.target.elements.namedItem('q').value;
  home();
}
home = function () {
  const rows = classicRows();
  $('app').innerHTML = `<div class="classicintro"><div class="eyebrow">PROPERTY • LOCATION • INSIGHTS</div><h1>Find the right property.<br><em>Know the plot.</em></h1><p>Listings, legal search and CRDA maps. All in one place.</p><div class="introactions"><button class="btn" onclick="classicAdd()">${icon('plus')} List a property</button><button class="textaction" onclick="go('classicAccount')">${Market.user ? 'My dashboard' : 'Buyer / seller login'} →</button></div></div>${Market.user ? `<div class="classicstatus"><span>${Market.demo ? 'OFFLINE DEMO' : buyerSide() ? 'BUYER ACCOUNT' : 'FIRM INVENTORY'}</span><button onclick="go('${buyerSide() ? 'marketRequests' : 'sellerHome'}')">${buyerSide() ? 'My enquiries' : 'Firm dashboard'} →</button></div>` : '<div class="classicstatus"><span>LOCAL PROPERTY TOOLS</span><small>Fictional examples are labelled.</small></div>'}<form class="searchline classicsearch" onsubmit="classicSearch(event)"><span>${icon('search')}</span><input name="q" aria-label="Search properties" value="${esc(view.q)}" placeholder="Village, city, project or plot code"><button class="btn" aria-label="Search">Go</button></form><div class="chips">${['All', 'Plot', 'Apartment', 'House', 'Commercial', 'Farm land'].map(x => `<button class="chip ${view.type === x ? 'active' : ''}" onclick="setFilter('type','${x}')">${x === 'Apartment' ? 'Flats' : x === 'All' ? 'All property' : x}</button>`).join('')}</div><div class="classictools"><button onclick="go('plotAI')">${icon('search')} Plot AI search</button><button onclick="go('investment')">${icon('map')} 10-year outlook</button></div><details class="classicfilters"><summary>Budget & purpose filters${view.max ? ' · active' : ''}</summary><div class="grid"><div><label>Purpose</label><select onchange="setFilter('purpose',this.value)">${options(['All', 'Sale', 'Rent'], view.purpose)}</select></div><div><label>Maximum budget (INR)</label><input aria-label="Maximum budget" type="number" min="0" value="${esc(view.max)}" onchange="setFilter('max',this.value)"></div></div><button class="textaction" onclick="view.q='';view.max='';view.type='All';view.purpose='All';home()">Clear filters</button></details><div class="row sectionhead"><div><h2>Property listings</h2><small>${rows.length} ${Market.user && !Market.demo ? 'visible' : 'local / sample'} results</small></div><select class="classicsort" aria-label="Sort properties" onchange="Classic.sort=this.value;home()"><option value="recent" ${Classic.sort === 'recent' ? 'selected' : ''}>Default order</option><option value="low" ${Classic.sort === 'low' ? 'selected' : ''}>Price: low to high</option><option value="high" ${Classic.sort === 'high' ? 'selected' : ''}>Price: high to low</option><option value="area" ${Classic.sort === 'area' ? 'selected' : ''}>Area by type / unit</option></select></div><div class="cards classiccards">${rows.map(card).join('') || empty('No matching properties', 'Change your filters or add a property to your inventory.')}</div><div class="classicfoot"><b>Check the details before deciding.</b><p>Seller facts, map references and source records have different meanings. Sample listings are fictional. Future values use editable assumptions.</p><button onclick="go('about')">Sources & app information →</button></div>`;
};
card = function (p) {
  const flat = p.type === 'Apartment',
    x = p.insights || {},
    saved = classicSaved().includes(p.id);
  return `<article class="card classiccard"><div class="visual" onclick="go('detail',{id:'${p.id}'})">${p.photo ? `<img src="${p.photo}" alt="Property photo">` : illustration(p)}<span class="tag ${p.demo || Market.demo ? 'amber' : ''}">${p.demo || Market.demo ? 'FICTIONAL SAMPLE' : Market.user && !buyerSide() ? p.published ? 'PUBLISHED' : 'PRIVATE INVENTORY' : esc(p.status || 'SELLER PUBLISHED')}</span>${!p.photo ? '<small>Illustration</small>' : ''}<button class="savefloat" aria-label="Save property" onclick="event.stopPropagation();classicSave('${p.id}')">${saved ? '♥' : '♡'}</button></div><div class="cardbody"><div class="categoryline">${flat ? 'Flat / apartment' : esc(p.type)} · ${esc(p.purpose)}</div><h3 onclick="go('detail',{id:'${p.id}'})">${esc(p.title)}</h3><small>${icon('pin')} ${esc(p.village)}, ${esc(p.city || p.district)}</small><div class="meta"><span>${fmt(p.area)} ${esc(p.unit)}</span><span>${flat ? p.bhk ? esc(p.bhk) + ' BHK' : 'BHK not supplied' : esc(p.facing || 'Facing not supplied')}</span>${p.road ? `<span>${fmt(p.road)} m road</span>` : ''}</div><div class="row"><div class="price">${money(p.price)}${p.purpose === 'Rent' ? '<small> /mo</small>' : ''}</div><button class="btn secondary" onclick="go('detail',{id:'${p.id}'})">View details</button></div><div class="classiccardlinks"><button onclick="go('classicDossier',{id:'${p.id}'})">Property insights →</button><button onclick="go('legal',{id:'${p.id}'})">Legal checks</button></div></div></article>`;
};
async function classicSave(id) {
  if (Market.user && buyerSide()) {
    await marketSave(id);
    return;
  }
  toggleSave(id);
}
savedPage = function () {
  if (Market.user && buyerSide()) {
    const ps = Market.catalog.filter(p => Market.saved.includes(p.id));
    $('app').innerHTML = `<div class="eyebrow">YOUR PRIVATE SHORTLIST</div><h1>Saved properties</h1><div class="cards classiccards">${ps.map(card).join('') || empty('No saved properties in this view', 'Save a property from the catalogue. Some saved properties may have been withdrawn or filtered out.')}</div>`;
    return;
  }
  classicBase.savedPage();
};
function classicAccount() {
  if (Market.user) {
    accountMarket();
    $('app').insertAdjacentHTML('afterbegin', `<div class="row classictools"><button onclick="go('home')">${icon('home')} Property listings</button><button onclick="go('${buyerSide() ? 'marketRequests' : 'sellerHome'}')">${icon('legal')} ${buyerSide() ? 'My enquiries' : 'Firm dashboard'}</button></div>`);
    return;
  }
  $('app').innerHTML = `${backbtn()}<div class="eyebrow">BUYER • SELLER • REAL ESTATE FIRMS</div><h1>Your property workspace</h1><p class="muted">Keep browsing with the familiar property tools, or connect an account for shared work.</p><div class="panel"><h2>Buyer account</h2><p>Save property, contact sellers with consent and track enquiries and visits.</p><div class="row"><button class="btn grow" onclick="chooseMarketSide('buyer')">Buyer login</button><button class="btn outline grow" onclick="startMarketDemo('buyer')">Buyer demo</button></div></div><div class="panel"><h2>Seller & firm account</h2><p>Private inventory, listing publication, buyer enquiries and multi-user firm access.</p><div class="row"><button class="btn grow" onclick="chooseMarketSide('seller')">Seller login</button><button class="btn outline grow" onclick="startMarketDemo('seller')">Firm demo</button></div></div><div class="panel"><h2>Local property tools</h2><p>Your earlier device-local listings and CRDA references remain available here.</p><button class="btn secondary full" onclick="go('home')">Continue with properties</button></div><button class="btn outline full" onclick="go('firmSettings')">Connect HTTPS backend</button>`;
}
function classicDashboard() {
  const ps = Market.inventory,
    rs = Market.requests;
  $('app').innerHTML = `${backbtn()}${sessionBanner()}<div class="hero firmhero"><div class="eyebrow">FIRM DASHBOARD</div><h1>${esc(Firm.data?.firm?.name || 'My property firm')}</h1><p>${esc(Market.user.name)} · ${esc(Market.user.role)}</p><button class="btn" onclick="go('home')">Open property inventory</button></div><div class="grid classicmetrics">${[[ps.length, 'Visible properties'], [ps.filter(p => p.published).length, 'Published listings'], [rs.filter(r => r.status === 'Pending').length, 'New buyer enquiries'], [rs.filter(r => r.buyerConfirmedVisit).length, 'Buyer-confirmed visits']].map(([n, l]) => `<div class="stat"><div class="pillcount">${n}</div><small>${l}</small></div>`).join('')}</div><div class="row sectionhead"><h2>Workspace actions</h2></div><div class="actiongrid">${[['home', 'home', 'Property listings'], ['marketRequests', 'legal', 'Buyer enquiries'], ['visits', 'pin', 'Firm site visits'], ['team', 'saved', 'Team & access'], ['branches', 'crda', 'Branches'], ['reports', 'map', 'Firm reports']].map(([r, i, l]) => `<button class="actiontile" onclick="go('${r}')">${icon(i)}<strong>${l}</strong></button>`).join('')}</div><div class="panel" style="margin-top:18px"><h2>Drafts needing review</h2>${ps.filter(p => !p.published).slice(0, 5).map(p => `<div class="listrow"><strong>${esc(p.title)}</strong><small>Private inventory; review before publication.</small><button class="btn secondary" onclick="go('detail',{id:'${p.id}'})">Review listing</button></div>`).join('') || '<p class="muted">No unpublished properties in your visible inventory.</p>'}</div><button class="btn outline full" onclick="go('marketSecurity')">Account security & sessions</button>`;
}
detail = function () {
  if (Market.user) {
    classicBase.marketProperty();
    return;
  }
  classicBase.detail();
  const p = state.listings.find(x => x.id === args.id);
  if (!p) return;
  const hero = $('app').querySelector('.visual');
  if (hero) hero.classList.add('classicdetailvisual');
  const intro = $('app').querySelector('.panel');
  if (intro) intro.insertAdjacentHTML('beforebegin', classicInsightEntry(p));
};
function classicInsightEntry(p) {
  return `<div class="classicdetailtools"><button onclick="go('classicDossier',{id:'${p.id}'})">${icon('search')} In-depth insights</button><button onclick="go('legal',{id:'${p.id}'})">${icon('legal')} Legal search</button><button onclick="classicGrowth('${p.id}')">${icon('map')} 10-year outlook</button></div>`;
}
function classicGrowth(id) {
  const p = state.listings.find(x => x.id === id);
  if (p?.purpose === 'Sale' && p.price) {
    Growth.price = p.price;
    Growth.label = 'Seller asking price used as an unverified input.';
  } else Growth.label = 'Enter a purchase price; monthly rent is not a purchase value.';
  go('investment');
}
function classicDossier() {
  const p = state.listings.find(x => x.id === args.id);
  if (!p) {
    $('app').innerHTML = empty('Property unavailable', 'Return to the property list.');
    return;
  }
  const x = p.insights || {},
    flat = p.type === 'Apartment',
    sample = window.DILIGENCE_SAMPLES[flat ? 'Apartment' : 'Plot'];
  $('app').innerHTML = `${backbtn()}<div class="classicinsighthead"><div class="eyebrow">IN-DEPTH PROPERTY INSIGHTS</div><h1>${esc(p.title)}</h1><p>${flat ? 'Project, area and occupancy checks' : 'Parcel identity, access and source records'}</p></div><div class="panel"><h2>Property snapshot</h2><div class="facts">${fact('Type', p.type)}${fact('Listed area', fmt(p.area) + ' ' + p.unit)}${fact('Asking price', money(p.price) + (p.purpose === 'Rent' ? ' / month' : ''))}${fact('Village / locality', p.village)}${fact('Survey / plot code', p.plotCode || p.survey)}${fact('Price per listed unit', p.area && p.price ? money(p.price / p.area) + ' / ' + p.unit : null)}</div><p class="mini muted">Seller inputs and asking price, not independently verified records or a valuation.</p></div><div class="panel"><h2>${flat ? 'Flat & project details' : 'Plot & access details'}</h2><div class="facts">${(flat ? ['projectName', 'builder', 'areaBasis', 'carpetArea', 'superArea', 'floor', 'totalFloors', 'parking', 'uds', 'rera', 'oc', 'cc', 'maintenance'] : ['lengthM', 'widthM', 'roadStatus', 'landUse', 'water', 'power', 'drainage', 'boundary']).map(k => fact(extraLabels[k], x[k])).join('')}</div></div><div class="panel"><h2>Questions to resolve</h2><ul class="insightlist">${flat ? '<li>Compare the listed area with the agreement on the same carpet or built-up basis.</li><li>Request applicable project approvals, possession and occupancy records.</li><li>Confirm unit identity, parking rights, land share and unpaid dues.</li>' : '<li>Match deed, survey, subdivision, extent and boundary records.</li><li>Check lawful access, current road formation and permitted land use.</li><li>Confirm boundaries and utilities through an independent site check.</li>'}<li>Review ownership history, charges and missing search periods with appropriate professional support.</li></ul></div><div class="panel"><h2>Document insights</h2><div class="notice blue">No live title-report provider is connected. Ownership, charges, litigation and approvals remain unverified until relevant source records are retrieved and reviewed.</div>${p.demo || Market.demo ? `<details><summary>View a fictional ${flat ? 'flat' : 'plot'} report example</summary><p class="mini">This separate example explains the report structure. It is not a report on this listing, and no Landeed or government search was performed.</p>${sample.sections.map(s => `<div class="sourcefinding"><strong>${esc(s.title)} · ${esc(s.status)}</strong><p class="mini">${esc(s.summary)}</p>${s.findings.map(f => `<small>${esc(f.text)} · Fictional source ${esc(f.source_id || 'not supplied')}${f.page ? ' / page ' + f.page : ''}</small>`).join('')}</div>`).join('')}</details>` : ''}<button class="btn secondary full" onclick="go('legal',{id:'${p.id}'})">Open legal search & document checklist</button></div><div class="classicdetailtools"><button onclick="classicPlot('${p.id}')">Nearby & plot AI</button><button onclick="classicGrowth('${p.id}')">10-year scenarios</button></div>`;
}
function classicPlot(id) {
  const p = state.listings.find(x => x.id === id);
  Insight.query = p?.plotCode && !p.demo ? p.plotCode : '';
  go('plotAI');
}
const classicOldMarketProperty = marketProperty;
marketProperty = async function () {
  await classicOldMarketProperty();
  if (route !== 'detail' && route !== 'marketProperty') return;
  const p = Market.active;
  if (!p) return;
  const cover = $('propertyCover');
  if (cover && !$('classicDetailActions')) cover.insertAdjacentHTML('afterend', `<div id="classicDetailActions">${classicInsightEntry(p)}</div>`);
  header();
};
// Use the wrapped version for the legacy property route as well.
detail = function () {
  if (Market.user) {
    marketProperty();
    return;
  }
  classicBase.detail();
  const p = state.listings.find(x => x.id === args.id);
  if (p) {
    const el = $('app').querySelector('.panel');
    if (el) el.insertAdjacentHTML('beforebegin', classicInsightEntry(p));
  }
};
const classicRender = render;
render = function () {
  if (Market.user && !Market.demo && !Firm.token) {
    Market.user = null;
    Market.side = '';
    Market.inventory = [];
    Market.catalog = [];
    Market.requests = [];
    restoreLocal();
    route = 'home';
  }
  if (['portal', 'buyerHome', 'catalog'].includes(route)) {
    route = 'home';
    args = {};
  }
  if (route === 'firm') {
    route = Market.user && !buyerSide() ? 'sellerHome' : 'classicAccount';
  }
  if (route === 'marketProperty') route = 'detail';
  if (route === 'dossier') route = 'classicDossier';
  if (route === 'marketSaved') route = 'saved';
  if (route === 'home') {
    header();
    home();
    return;
  }
  if (route === 'detail') {
    header();
    detail();
    return;
  }
  if (route === 'saved') {
    header();
    savedPage();
    return;
  }
  if (route === 'classicAccount') {
    header();
    classicAccount();
    return;
  }
  if (route === 'classicDossier') {
    header();
    classicDossier();
    return;
  }
  if (route === 'sellerHome' && Market.user) {
    header();
    classicDashboard();
    return;
  }
  classicRender();
  header();
};
startMarketDemo = function (side) {
  view.q = '';
  view.type = 'All';
  view.purpose = 'All';
  view.max = '';
  classicBase.startMarketDemo(side);
  if (side === 'buyer') {
    state.listings = Market.catalog;
    render();
  }
};
marketLogout = async function () {
  await classicBase.marketLogout();
  view.q = '';
  view.type = 'All';
  view.purpose = 'All';
  view.max = '';
  route = 'home';
  args = {};
  stack = [];
  render();
};
// Retain the existing v2/v3 local storage identity and open the familiar home.
route = 'home';
args = {};
stack = [];
render();
// Clear role entry; listing creation belongs to seller accounts only.
