async function marketCall(method, path, data = {}) {
  const sensitive = path.startsWith('/api/security/') || path.endsWith('/ticket'),
    sig = method + path + JSON.stringify(data);
  let key = !sensitive && method === 'POST' ? Market.retry.get(sig) || uid('op') : '';
  if (key) Market.retry.set(sig, key);
  const r = await firmCall(method, path, data, key);
  Market.retry.delete(sig);
  return r;
}
async function refreshMarket(redraw = true) {
  if (Market.busy || !marketLive()) return;
  Market.busy = true;
  const session = Firm.token;
  try {
    if (buyerSide()) {
      const [d, cat] = await Promise.all([marketCall('GET', '/api/buyer/dashboard'), marketCall('GET', '/api/market/catalog?' + new URLSearchParams(Market.filter))]);
      if (session !== Firm.token) return;
      Market.requests = d.requests;
      Market.saved = d.saved;
      Market.profile = d.profile;
      Market.catalog = cat.properties;
      state.listings = Market.catalog;
    } else {
      await firmRefresh(false);
      if (session !== Firm.token) return;
      if (Market.user.role === 'viewer') {
        Market.inventory = Firm.data.properties;
        Market.requests = [];
      } else {
        const d = await marketCall('GET', '/api/seller/dashboard');
        Market.inventory = d.properties;
        Market.requests = d.requests;
      }
      state.listings = Market.inventory;
    }
    if (redraw) render();
  } catch (e) {
    toast(e.message);
  } finally {
    Market.busy = false;
  }
}
setInterval(() => {
  if (marketLive() && !document.hidden && ['home', 'saved', 'buyerHome', 'sellerHome', 'catalog', 'sellerInventory', 'marketSaved', 'marketRequests'].includes(route)) refreshMarket();
}, 30000);
async function marketLogout() {
  try {
    if (Firm.token) await firmCall('POST', '/api/auth/logout');
  } catch (e) {}
  Firm.token = '';
  Firm.mode = 'local';
  Firm.data = null;
  Market.user = null;
  Market.demo = false;
  Market.side = '';
  Market.active = null;
  Market.thread = null;
  Market.setup = null;
  Market.recovery = [];
  Market.requests = [];
  Market.catalog = [];
  Market.inventory = [];
  Market.retry.clear();
  Market.compare = [];
  Market.saved = [];
  Market.security = null;
  restoreLocal();
  route = 'portal';
  args = {};
  stack = [];
  render();
}
header = function () {
  if (!Market.side) {
    $('header').innerHTML = `<div class="mark">${icon('home')}</div><div class="brand"><strong>Agent Mart</strong><small>PROPERTY • EVIDENCE • PEOPLE</small></div><button class="iconbtn" aria-label="Connection settings" onclick="go('firmSettings')">${icon('crda')}</button>`;
    $('nav').innerHTML = '';
    return;
  }
  const isb = buyerSide();
  $('header').innerHTML = `<div class="mark">${icon('home')}</div><div class="brand"><strong>Agent Mart</strong><small>${isb ? 'BUYER' : 'SELLER'} ${Market.demo ? '• DEMO' : 'WORKSPACE'}</small></div><button class="iconbtn" aria-label="Notifications and enquiries" onclick="go('marketRequests')">${icon('legal')}</button><button class="avatarbtn" aria-label="Account" onclick="go('marketAccount')">${esc((Market.user?.name || 'A').slice(0, 1))}</button>`;
  const tabs = isb ? [['buyerHome', 'home', 'Home'], ['catalog', 'search', 'Explore'], ['marketSaved', 'saved', 'Saved'], ['marketRequests', 'legal', 'Enquiries'], ['marketAccount', 'crda', 'Account']] : [['sellerHome', 'home', 'Overview'], ['sellerInventory', 'search', 'Inventory'], ['marketRequests', 'legal', 'Enquiries'], ['plotAI', 'map', 'Insights'], ['marketAccount', 'crda', 'Account']];
  $('nav').innerHTML = tabs.map(([r, i, l]) => `<button class="${route === r ? 'active' : ''}" onclick="go('${r}')">${icon(i)}<span>${l}</span></button>`).join('');
  document.body.dataset.side = Market.side;
};
render = function () {
  if (Market.user && !Market.demo && !Firm.token) {
    Market.user = null;
    Market.side = '';
    route = 'portal';
  }
  if (route === 'firm') {
    route = Market.user ? buyerSide() ? 'buyerHome' : 'sellerHome' : 'portal';
  }
  if (route === 'firmAuth') {
    route = 'marketAuth';
    args = {
      side: Market.side || 'seller',
      mode: args.mode || 'login'
    };
  }
  const pages = {
    portal: portalPage,
    marketAuth: marketAuthPage,
    buyerHome: buyerHome,
    sellerHome: sellerHome,
    catalog: catalogPage,
    sellerInventory: sellerInventory,
    marketProperty: marketProperty,
    marketSaved: savedMarket,
    marketCompare: compareMarket,
    marketRequests: requestsMarket,
    marketThread: threadMarket,
    sellerEdit: sellerEditor,
    marketAccount: accountMarket,
    marketSecurity: securityMarket,
    dossier: dossierPage
  };
  if (pages[route]) {
    header();
    if (window.AndroidApp?.setSecureScreen) AndroidApp.setSecureScreen(['marketAuth', 'marketSecurity', 'marketThread'].includes(route));
    try {
      pages[route]();
    } catch (e) {
      console.error(e);
      $('app').innerHTML = empty('Unable to open this view', 'Your server records have not been changed.');
    }
    return;
  }
  if (buyerSide() && ['team', 'branches', 'activity', 'firmMore', 'reports', 'edit', 'leadEdit', 'visits'].includes(route)) {
    header();
    $('app').innerHTML = empty('Seller workspace is private', 'Buyer accounts cannot access firm administration.');
    return;
  }
  if (window.AndroidApp?.setSecureScreen) AndroidApp.setSecureScreen(['firmPassword'].includes(route));
  marketBase.render();
};
