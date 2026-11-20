// Platform configuration, parcel loading, reports, and integration banner.
// Browser document source; assembled in source-manifest.json order.
const PlatformClient45 = {
  config: null,
  pending: false
};
async function loadPlatformConfig45() {
  if (!Firm.endpoint || PlatformClient45.pending) return;
  PlatformClient45.pending = true;
  const endpoint = Firm.endpoint;
  try {
    const r = await firmCall('GET', '/api/platform/public-config');
    if (endpoint !== Firm.endpoint) return;
    PlatformClient45.config = r;
    renderPlatformBanner45();
  } catch (e) {} finally {
    PlatformClient45.pending = false;
  }
}
function renderPlatformBanner45() {
  document.querySelectorAll('.platformBanner45').forEach(e => e.remove());
  if (!['home', 'sellerHome', 'roleEntry'].includes(route) || !PlatformClient45.config) return;
  const side = Market.user ? buyerSide() ? 'buyer' : 'seller' : 'all';
  const notices = PlatformClient45.config.announcements.filter(a => a.audience === 'all' || a.audience === side);
  if (notices.length) $('app').insertAdjacentHTML('afterbegin', notices.map(a => `<div class="notice blue platformBanner45"><strong>${esc(a.title)}</strong><p>${esc(a.body)}</p></div>`).join(''));
}
const platformRender45 = render;
render = function () {
  platformRender45();
  renderPlatformBanner45();
  if (['home', 'sellerHome', 'roleEntry'].includes(route) && !Market.demo) loadPlatformConfig45();
};
const propertyRender45 = marketProperty;
marketProperty = async function () {
  await propertyRender45();
  if (!['detail', 'marketProperty'].includes(route) || !Market.active || !buyerSide()) return;
  if (!$('reportListing45')) $('app').insertAdjacentHTML('beforeend', `<section class="panel" id="reportListing45"><h2>Report this listing</h2><p class="mini muted">Tell the platform about misleading information, incorrect location or a document concern. Reports do not establish that a violation occurred.</p><form onsubmit="submitReport45(event,'${Market.active.id}')">${select('Report category', 'category', ['Misleading listing', 'Wrong location', 'Duplicate', 'Contact issue', 'Document concern', 'Other'], 'Misleading listing')}<label>Describe the issue</label><textarea name="description" required minlength="10" maxlength="2000"></textarea><div class="space"></div><button class="btn outline full">Submit report</button></form><div id="reportReceipt45"></div></section>`);
};
async function submitReport45(e, id) {
  e.preventDefault();
  const b = e.target.querySelector('button');
  b.disabled = true;
  try {
    if (Market.demo) {
      $('reportReceipt45').textContent = 'Fictional demo report recorded on this screen. No platform case was created.';
      return;
    }
    const r = await marketCall('POST', '/api/reports', {
      ...Object.fromEntries(new FormData(e.target)),
      propertyId: id
    });
    $('reportReceipt45').textContent = 'Report received. Reference: ' + r.id;
    toast('Report submitted to platform moderation');
  } catch (e) {
    toast(e.message);
  } finally {
    b.disabled = false;
  }
}
const crdaBefore45 = crda;
crda = function () {
  crdaBefore45();
  $('app').insertAdjacentHTML('beforeend', `<div class="panel"><h2>Platform-curated parcel references</h2><p class="mini muted">Import references reviewed by the platform team. These are not sale listings or ownership verification.</p><button class="btn outline full" onclick="loadPlatformParcels45(this)">Load platform references (first 100)</button></div>`);
};
async function loadPlatformParcels45(b) {
  if (Market.demo || !Firm.endpoint) {
    toast('Connect your backend to load platform references.');
    return;
  }
  b.disabled = true;
  try {
    const r = await firmCall('GET', '/api/platform/public-parcels?limit=100&offset=0');
    let count = 0;
    for (const f of r.features) {
      try {
        const p = normalize(f, 'Platform-curated reference');
        const index = state.refs.findIndex(x => x.code === p.code);
        if (index >= 0) state.refs[index] = p;else state.refs.push(p);
        count++;
      } catch (e) {}
    }
    persist();
    toast(count + ' platform references loaded; ' + r.total + ' available on the server.');
    crda();
  } catch (e) {
    toast(e.message);
  } finally {
    b.disabled = false;
  }
}
setInterval(() => {
  if (!document.hidden && ['home', 'sellerHome', 'roleEntry'].includes(route) && !Market.demo) loadPlatformConfig45();
}, 60000);
const aboutBefore45 = aboutPage;
aboutPage = function () {
  aboutBefore45();
  const label = $('app').querySelector('.eyebrow');
  if (label) label.textContent = 'AGENT MART • 4.5';
  $('app').insertAdjacentHTML('beforeend', '<div class="panel"><h2>Platform administration</h2><p>Platform listing moderation, account access controls, announcements and buyer reporting use the updated backend. Demo mode is fictional.</p></div>');
};
