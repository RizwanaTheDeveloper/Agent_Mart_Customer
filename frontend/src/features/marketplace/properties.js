// Marketplace property artwork, discovery, comparison, and seller inventory.
// Browser document source; assembled in source-manifest.json order.
function buildingArt() {
  return `<svg viewBox="0 0 420 190" aria-label="Illustrative building and plot"><ellipse cx="210" cy="167" rx="180" ry="18" fill="#19165810"/><path d="M35 144 164 116 263 145 132 176Z" fill="#b9b6ed" stroke="#f53d5f"/><path d="m56 144 107-21 75 23-108 22Z" fill="none" stroke="#fff" stroke-dasharray="5 4"/><path d="m187 133 0-100 69-20 95 35v100l-69 24Z" fill="#f7f1df"/><path d="m256 13 95 35v100l-69 24-26-10Z" fill="#b7b5ec"/><path d="m180 34 77-29 102 37-9 13-96-28-66 20Z" fill="#201c6e"/>${[0, 1, 2].flatMap(i => [0, 1, 2].map(j => `<path d="m${198 + i * 18} ${50 + j * 25 - i * 5} 11-3v16l-11 3Z" fill="#f53d5f"/>`)).join('')}<path d="M271 59v18l18 7V66ZM306 71v18l18 6V78ZM271 94v18l18 7V101ZM306 106v18l18 6V113Z" fill="#5a56ae"/><path d="m236 123 15-4v42l-15-4Z" fill="#d3a05b"/><circle cx="367" cy="126" r="25" fill="#9f9dcd"/><path d="M367 136v29" stroke="#545098" stroke-width="5"/></svg>`;
}
function assetArt(p) {
  return p.type === 'Apartment' ? buildingArt() : illustration(p);
}
function marketCard(p, seller = false) {
  const saved = Market.saved.includes(p.id);
  return `<article class="marketcard"><div class="cardvisual" onclick="go('marketProperty',{id:'${p.id}'})">${p.photo ? `<img src="${p.photo}" alt="Property photo">` : assetArt(p)}<span class="tag ${Market.demo ? 'amber' : ''}">${Market.demo ? 'FICTIONAL SAMPLE' : seller ? p.published ? 'PUBLISHED' : 'PRIVATE DRAFT' : 'SELLER PUBLISHED'}</span><small>${p.photo ? 'Seller photo' : 'Illustration - not a property photo'}</small></div><div class="cardbody"><div class="row"><span class="categoryline">${esc(p.type)} · ${esc(p.purpose)}</span>${!seller ? `<button aria-label="Save property" onclick="marketSave('${p.id}')">${saved ? '♥' : '♡'}</button>` : ''}</div><h3 onclick="go('marketProperty',{id:'${p.id}'})">${esc(p.title)}</h3><small>${icon('pin')} ${esc(p.village)}, ${esc(p.city)}</small><div class="meta"><span>${fmt(p.area)} ${esc(p.unit)}</span><span>${p.bhk ? esc(p.bhk) + ' BHK' : esc(p.facing || 'Facing not supplied')}</span></div><div class="row"><div class="price">${money(p.price)}${p.purpose === 'Rent' ? '<small>/mo</small>' : ''}</div><button class="btn secondary" onclick="go('marketProperty',{id:'${p.id}'})">Details</button></div>${seller ? `<small>${p.views || 0} unique buyer/day detail opens · ${p.published ? 'Edit changes require republication.' : 'Not visible to live buyers.'}</small>` : `<div class="cardtools"><button onclick="toggleCompare('${p.id}')">${Market.compare.includes(p.id) ? '✓ Selected' : '＋ Compare'}</button><button onclick="go('dossier',{id:'${p.id}'})">Insights →</button></div>`}</div></article>`;
}
function localCatalog() {
  const f = Market.filter;
  return marketDemo.properties.filter(p => p.published && (!f.q || [p.title, p.village, p.city, p.plotCode, p.survey].join(' ').toLowerCase().includes(f.q.toLowerCase())) && (!f.type || p.type === f.type) && (!f.city || p.city.toLowerCase().includes(f.city.toLowerCase())) && (!f.maxPrice || p.price <= +f.maxPrice) && (!f.purpose || p.purpose === f.purpose));
}
async function searchMarket(e) {
  if (e) {
    e.preventDefault();
    Object.assign(Market.filter, Object.fromEntries(new FormData(e.target)));
  }
  if (Market.demo) {
    Market.catalog = localCatalog();
    catalogPage();
  } else {
    try {
      const r = await marketCall('GET', '/api/market/catalog?' + new URLSearchParams(Market.filter));
      Market.catalog = r.properties;
      catalogPage();
    } catch (e) {
      toast(e.message);
    }
  }
}
function buyerHome() {
  $('app').innerHTML = `${sessionBanner()}<div class="buyerhero"><div class="eyebrow">HELLO, ${esc(Market.user.name.split(' ')[0]).toUpperCase()}</div><h1>A home for your<br><em>next big decision.</em></h1><p>Discover the property. Understand the evidence.</p><button class="btn" onclick="go('catalog')">${icon('search')} Explore properties</button>${buildingArt()}</div><div class="metricrow"><button onclick="go('marketSaved')"><strong>${Market.saved.length}</strong><span>Saved</span></button><button onclick="go('marketRequests')"><strong>${Market.requests.length}</strong><span>Enquiries</span></button><button onclick="go('marketCompare')"><strong>${Market.compare.length}</strong><span>Compare</span></button></div><div class="discoverytiles"><button onclick="Market.filter.type='Plot';go('catalog');searchMarket()">${icon('crda')}<b>Plots & land</b><small>Identity, boundary & access</small></button><button onclick="Market.filter.type='Apartment';go('catalog');searchMarket()">${icon('home')}<b>Flats & apartments</b><small>Area, project & readiness</small></button></div><div class="row sectionhead"><h2>Explore your options</h2><button onclick="go('catalog')">View all →</button></div><div class="cards">${Market.catalog.slice(0, 4).map(p => marketCard(p)).join('') || empty('No published inventory yet', 'Sellers must explicitly publish an available property before it appears here.')}</div><div class="insightentry"><span class="eyebrow">LOOK BEYOND THE LISTING</span><h3>Evidence before assumptions.</h3><p>Inspect the plot or flat, review missing records, and keep future-value scenarios separate from verified facts.</p><div class="row"><button class="btn grow" onclick="go('plotAI')">Plot research</button><button class="btn secondary grow" onclick="go('investment')">10-year scenarios</button></div></div>`;
}
function catalogPage() {
  $('app').innerHTML = `${sessionBanner()}<div class="eyebrow">CURATED BY YOUR FILTERS</div><h1>Find your place.</h1><form class="panel" onsubmit="searchMarket(event)"><div class="searchline"><input name="q" aria-label="Search properties" value="${esc(Market.filter.q)}" placeholder="Location, project, survey or plot code"><button class="btn" aria-label="Search">${icon('search')}</button></div><div class="grid"><div><label>Property type</label><select name="type"><option value="">All types</option>${['Plot', 'Apartment', 'House', 'Commercial', 'Farm land'].map(t => `<option ${Market.filter.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div><div><label>Purpose</label><select name="purpose"><option value="">Buy or rent</option>${options(['Sale', 'Rent'], Market.filter.purpose)}</select></div><div><label>City</label><input name="city" value="${esc(Market.filter.city)}" placeholder="Any city"></div><div><label>Maximum budget (INR)</label><input name="maxPrice" type="number" min="0" value="${esc(Market.filter.maxPrice)}" placeholder="No limit"></div></div><button class="btn secondary full" style="margin-top:14px">Apply filters</button></form><div class="row sectionhead"><h2>Properties</h2><small>${Market.catalog.length} returned</small></div><div class="cards">${Market.catalog.map(p => marketCard(p)).join('') || empty('No matching properties', 'Try another location or budget.')}</div>${Market.compare.length ? `<div class="stickyaction row"><span>${Market.compare.length}/3 selected</span><button class="btn" onclick="go('marketCompare')">Compare now</button></div>` : ''}<p class="footertext">Seller-published claims are not independently verified. Search results are capped; they are not all properties on the market.</p>`;
}
async function marketSave(id) {
  if (Market.demo) {
    Market.saved = Market.saved.includes(id) ? Market.saved.filter(x => x !== id) : [...Market.saved, id];
    marketDemo.saved = Market.saved;
    saveMarketDemo();
    render();
    return;
  }
  try {
    await marketCall(Market.saved.includes(id) ? 'DELETE' : 'POST', '/api/buyer/saved/' + id);
    await refreshMarket();
    toast('Shortlist updated');
  } catch (e) {
    toast(e.message);
  }
}
function toggleCompare(id) {
  if (Market.compare.includes(id)) Market.compare = Market.compare.filter(x => x !== id);else {
    if (Market.compare.length >= 3) {
      toast('Compare up to three properties');
      return;
    }
    Market.compare.push(id);
  }
  render();
}
function savedMarket() {
  $('app').innerHTML = `${sessionBanner()}<div class="eyebrow">YOUR PRIVATE SHORTLIST</div><h1>Saved properties</h1><div class="cards">${Market.catalog.filter(p => Market.saved.includes(p.id)).map(p => marketCard(p)).join('') || empty('Your shortlist is empty', 'Save a property from Explore to revisit it here.')}</div>${Market.saved.some(id => !Market.catalog.some(p => p.id === id)) ? '<div class="notice">Some saved listings are not in the current catalogue view or are no longer published.</div>' : ''}<button class="btn outline full" style="margin-top:16px" onclick="go('marketCompare')">Compare selected properties (${Market.compare.length})</button>`;
}
function compareMarket() {
  const ps = Market.catalog.filter(p => Market.compare.includes(p.id));
  $('app').innerHTML = `${backbtn()}<div class="eyebrow">SIDE-BY-SIDE DECISIONS</div><h1>Property comparison</h1>${ps.length ? `<div class="panel comparewrap"><table class="comparetable"><thead><tr><th>Field</th>${ps.map(p => `<th>${esc(p.title)}</th>`).join('')}</tr></thead><tbody>${[['Asking price', p => money(p.price)], ['Property type', p => p.type], ['Location', p => p.city], ['Listed area', p => fmt(p.area) + ' ' + p.unit], ['Area basis', p => p.insights?.areaBasis || 'Not supplied'], ['Bedrooms', p => p.bhk || 'Not supplied'], ['Carpet area', p => p.insights?.carpetArea ? fmt(p.insights.carpetArea) + ' sq ft' : 'Not supplied'], ['Facing', p => p.facing || 'Not supplied'], ['Road width', p => p.road ? fmt(p.road) + ' m' : 'Not supplied'], ['RERA reference', p => p.insights?.rera || 'Not supplied'], ['OC availability', p => p.insights?.oc || 'Not supplied']].map(([k, fn]) => `<tr><td>${k}</td>${ps.map(p => `<td>${esc(fn(p))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="notice blue">Compare equal area bases and property types. A plot area and a flat's super built-up area describe different things.</p>` : empty('Select properties first', 'Tap Compare on up to three listings.')}`;
}
function sellerHome() {
  const ps = Market.inventory,
    reqs = Market.requests;
  $('app').innerHTML = `${sessionBanner()}<div class="sellerhero"><div><div class="eyebrow">YOUR PROPERTY BUSINESS, IN VIEW</div><h1>${esc(Market.user.name.split(' ')[0])},<br>make every listing count.</h1><p>Manage your inventory, buyer interest and evidence.</p>${sellerWrite() ? '<button class="btn" onclick="go(\'sellerEdit\')">+ List a property</button>' : ''}</div><div class="sellerart">${buildingArt()}</div></div><div class="sellerstats"><div><strong>${ps.length}</strong><span>Inventory</span></div><div><strong>${ps.filter(p => p.published).length}</strong><span>Published</span></div><div><strong>${reqs.filter(r => r.status === 'Pending').length}</strong><span>New enquiries</span></div><div><strong>${ps.reduce((n, p) => n + (p.views || 0), 0)}</strong><span>Buyer/day opens</span></div></div><div class="row sectionhead"><h2>Your next actions</h2><button onclick="go('sellerInventory')">Inventory →</button></div><div class="actiongrid"><button class="actiontile" onclick="go('marketRequests')">${icon('legal')}<strong>Respond to buyers</strong></button><button class="actiontile" onclick="go('sellerInventory')">${icon('home')}<strong>Review private drafts</strong></button><button class="actiontile" onclick="go('plotAI')">${icon('map')}<strong>Research a plot</strong></button><button class="actiontile" onclick="go('marketSecurity')">${icon('saved')}<strong>Account protection</strong></button></div><div class="panel" style="margin-top:17px"><h2>Attention needed</h2>${ps.filter(p => !p.published).slice(0, 4).map(p => `<div class="listrow" onclick="go('marketProperty',{id:'${p.id}'})"><strong>${esc(p.title)}</strong><small>Private inventory. Review details before publishing.</small></div>`).join('') || '<p class="muted">No unpublished listings in your visible inventory.</p>'}</div><div class="row sectionhead"><h2>Recent properties</h2></div><div class="cards">${ps.slice(0, 4).map(p => marketCard(p, true)).join('') || empty('Start your inventory', 'Add a plot, flat or other property, then review its buyer-facing details.')}</div>`;
}
function sellerInventory() {
  $('app').innerHTML = `${sessionBanner()}<div class="row sectionhead"><div><div class="eyebrow">PRIVATE DRAFTS & PUBLISHED LISTINGS</div><h1>My inventory</h1></div>${sellerWrite() ? '<button class="btn" onclick="go(\'sellerEdit\')">+ Add</button>' : ''}</div><div class="cards">${Market.inventory.map(p => marketCard(p, true)).join('') || empty('No inventory yet', 'Add your first property to start.')}</div>`;
}
async function marketProperty() {
  const session = Firm.token;
  const p = (buyerSide() ? Market.catalog : Market.inventory).find(p => p.id === args.id);
  if (!p) {
    $('app').innerHTML = empty('Property unavailable', 'Refresh the catalogue or return to your inventory.');
    return;
  }
  Market.active = p;
  $('app').innerHTML = propertyBody(p);
  if (!Market.demo) {
    try {
      if (buyerSide()) {
        const d = await marketCall('GET', '/api/market/properties/' + p.id);
        if (!['marketProperty', 'detail'].includes(route) || args.id !== p.id || session !== Firm.token) return;
        Market.active = {
          ...p,
          ...d.property
        };
        $('app').innerHTML = propertyBody(Market.active);
      }
      if (p.hasPhoto && !p.photo) {
        const r = await marketCall('GET', buyerSide() ? '/api/market/properties/' + p.id + '/photo' : '/api/properties/' + p.id + '/photo');
        if (['marketProperty', 'detail'].includes(route) && args.id === p.id && r.photo) {
          p.photo = r.photo;
          $('propertyCover').innerHTML = `<img src="${r.photo}" alt="Seller supplied property photo">`;
        }
      }
    } catch (e) {
      toast(e.message);
    }
  }
}
function propertyBody(p) {
  const x = p.insights || {},
    flat = p.type === 'Apartment';
  return `${backbtn()}<div class="detailcover" id="propertyCover">${p.photo ? `<img src="${p.photo}" alt="Property photo">` : assetArt(p)}<span class="tag ${Market.demo ? 'amber' : ''}">${Market.demo ? 'FICTIONAL SAMPLE' : p.published || buyerSide() ? 'SELLER PUBLISHED' : 'PRIVATE INVENTORY'}</span></div><div class="row" style="margin-top:16px"><span class="categoryline">${esc(p.type)} · ${esc(p.purpose)}</span>${buyerSide() ? `<button onclick="marketSave('${p.id}')">${Market.saved.includes(p.id) ? '♥ Saved' : '♡ Save'}</button>` : ''}</div><h1>${esc(p.title)}</h1><p class="muted">${icon('pin')} ${esc(p.village)}, ${esc(p.city)}</p><div class="price">${money(p.price)}${p.purpose === 'Rent' ? '<small> / month</small>' : ''}</div><small>${p.area && p.price ? money(p.price / p.area) + ' per ' + esc(p.unit) : ''} · Asking price, not an independent valuation</small><div class="featurefacts"><div><strong>${fmt(p.area)}</strong><span>${esc(p.unit)} listed</span></div><div><strong>${flat ? (p.bhk || '—') + ' BHK' : esc(p.facing || '—')}</strong><span>${flat ? 'Bedrooms' : 'Facing'}</span></div><div><strong>${flat ? x.floor ?? '—' : p.road || '—'}</strong><span>${flat ? 'Floor' : 'Road width (m)'}</span></div></div><div class="notice blue">Property facts and approvals shown here are seller-supplied. A published listing is not title, identity or approval verification.</div><div class="panel"><div class="row"><h2>At a glance</h2><span class="tag">${flat ? 'FLAT' : 'PLOT / PROPERTY'} INSIGHTS</span></div><div class="facts">${fact('District / mandal', [p.district, p.mandal].filter(Boolean).join(' / '))}${fact('Survey / plot code', p.plotCode || p.survey)}${flat ? fact('Project', x.projectName) + fact('Builder', x.builder) + fact('Carpet area', x.carpetArea ? fmt(x.carpetArea) + ' sq ft' : null) + fact('Area basis', x.areaBasis) + fact('RERA reference', x.rera) + fact('Occupancy record', x.oc) : fact('Seller-stated land use', x.landUse) + fact('Road condition', x.roadStatus) + fact('Dimensions', x.lengthM && x.widthM ? `${x.lengthM} × ${x.widthM} m` : null) + fact('Boundary check', x.boundary)}</div><button class="btn full" style="margin-top:16px" onclick="go('dossier',{id:'${p.id}'})">Open in-depth property insights →</button></div><div class="panel"><h2>About the property</h2><p>${esc(p.description || 'No description supplied.')}</p><div class="amenitychips">${(x.amenities || []).map(a => `<span>${esc(a)}</span>`).join('')}</div><small>Amenities are seller claims and may not be operational.</small></div><div class="panel"><h2>Location & surroundings</h2><p class="mini muted">${coords(p.lat, p.lon) ? 'Coordinates supplied. Verify actual access and boundaries.' : 'Exact coordinates have not been supplied.'}</p><div class="row">${coords(p.lat, p.lon) ? `<a class="btn outline grow" href="${mapsURL(p)}">Open map</a>` : ''}<button class="btn secondary grow" onclick="Insight.query='${p.plotCode && /^\d[\dA-Z-]+$/.test(p.plotCode) ? p.plotCode : ''}';go('plotAI')">Research plot / area</button></div></div>${buyerSide() ? `<div class="panel"><h2>Ask the seller</h2><p class="mini muted">Submit an enquiry with consent. Contact details are released after acceptance; they are not identity-verified.</p><form onsubmit="submitMarketEnquiry(event,'${p.id}')">${input('Your mobile', 'phone', '', 'tel', true, 'pattern="[6-9][0-9]{9}" maxlength="10"')}<label>Your message</label><textarea name="message" required maxlength="2000" placeholder="I would like the property documents and a site visit."></textarea><div class="checkrow" style="margin:14px 0"><input id="enquiryConsent" type="checkbox" required><label for="enquiryConsent">Share my name, message and mobile with this listing's seller firm to respond to this enquiry.</label></div><button class="btn full">Send enquiry</button></form></div><div class="row"><button class="btn outline grow" onclick="toggleCompare('${p.id}')">Compare</button><button class="btn secondary grow" onclick="propertyGrowthFromMarket('${p.id}')">Investment outlook</button></div>` : sellerControls(p)}`;
}
function sellerControls(p) {
  return `<div class="panel"><h2>Seller controls</h2>${sellerWrite() ? `<button class="btn secondary full" onclick="go('sellerEdit',{id:'${p.id}'})">Edit property & insight fields</button>` : ''}${sellerAdmin() ? p.published ? `<button class="btn outline full" style="margin-top:10px" onclick="publishMarket('${p.id}',false)">Withdraw buyer-facing listing</button>` : `<form onsubmit="event.preventDefault();publishMarket('${p.id}',true)"><div class="checkrow" style="margin:16px 0"><input id="publishConsent" type="checkbox" required><label for="publishConsent">I am authorized to advertise this property and have reviewed the buyer-facing facts. Private contact is released only through accepted enquiries.</label></div><button class="btn full">Publish to buyer catalogue</button></form>` : '<p class="mini muted">An owner or manager must approve publication and document sharing.</p>'}</div>${sellerAdmin() ? `<div class="panel"><h2>Private source documents</h2><p class="mini muted">Encrypted storage requires a configured server key. PDF/JPEG/PNG only, below 500 KiB. Files are not publicly linked or certified malware-free.</p><form onsubmit="uploadPrivateDocument(event,'${p.id}')">${select('Document type', 'label', ['Title document', 'Encumbrance record', 'Approval', 'RERA reference', 'Occupancy certificate', 'Layout', 'Other'], 'Title document')}<label>Private file</label><input name="documentFile" type="file" accept=".pdf,.jpg,.jpeg,.png" required><div class="space"></div><button class="btn outline full" ${Market.demo ? 'disabled' : ''}>Upload encrypted document</button></form>${Market.demo ? '<small>Demo mode does not upload or pretend to encrypt files.</small>' : ''}</div>` : ''}`;
}
function propertyGrowthFromMarket(id) {
  const p = Market.catalog.find(p => p.id === id) || Market.inventory.find(p => p.id === id);
  Growth.price = p.purpose === 'Sale' ? p.price : 5000000;
  Growth.label = p.purpose === 'Sale' ? 'Unverified seller asking price; edit your purchase assumption.' : 'Rental price is not a purchase price; enter your own assumption.';
  go('investment');
}
async function publishMarket(id, publish) {
  try {
    if (Market.demo) {
      const p = marketDemo.properties.find(p => p.id === id);
      if (publish && p.status !== 'Available') throw Error('Mark property Available before publication');
      p.published = publish;
      saveMarketDemo();
      Market.catalog = localCatalog();
    } else {
      const p = Market.inventory.find(p => p.id === id);
      await marketCall('POST', '/api/market/properties/' + id + '/' + (publish ? 'publish' : 'unpublish'), {
        version: p.version,
        authorizedToAdvertise: publish
      });
      await refreshMarket(false);
    }
    render();
    toast(publish ? 'Listing published' : 'Listing withdrawn');
  } catch (e) {
    toast(e.message);
  }
}
