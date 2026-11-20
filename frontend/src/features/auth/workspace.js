// Buyer and seller workspace chooser, role authentication, and follow-ups.
// Browser document source; assembled in source-manifest.json order.
const Roles42 = {
  query: '',
  filter: 'all',
  busy: false
};
const interestStages = ['New interest', 'Contacted', 'Documents requested', 'Visit planning', 'Negotiation', 'Completed', 'Not proceeding'];
const rolesBase = {
  render,
  header,
  home,
  threadMarket,
  marketLogout,
  startMarketDemo,
  classicDashboard
};
function hasRoleAccount() {
  return !!Market.user && (Market.demo || !!Firm.token);
}
function rolesEntry() {
  Market.side = '';
  $('app').innerHTML = `<div class="workspacegrid"><div class="rolewelcome"><span class="eyebrow">AGENT MART</span><h1>Your property journey.<br><em>Choose your workspace.</em></h1><p>Buyers discover and track interest. Sellers and owners list property and manage follow-ups.</p></div><div class="workspacechoices"><section class="rolechoice buyerchoice"><div class="rolechoicehead"><span class="rolebadge">${icon('search')}</span><div><h2>Buyer</h2><small>Find the right plot, flat or property</small></div></div><ul><li>Browse published listings across seller firms</li><li>Save, compare and mark interest</li><li>Track seller responses, documents and visits</li></ul><div class="rolebuttons"><button class="btn" onclick="openRoleAuth('buyer','login')">Buyer login</button><button class="btn outline" onclick="openRoleAuth('buyer','register')">Create buyer account</button></div><button class="demolink" onclick="startMarketDemo('buyer')">View buyer demo →</button></section><section class="rolechoice sellerchoice"><div class="rolechoicehead"><span class="rolebadge">${icon('home')}</span><div><h2>Seller / Property owner</h2><small>Individual owners and real estate firms</small></div></div><ul><li>Create, edit and publish your listings</li><li>Manage interested buyers and next follow-ups</li><li>Control visits, source documents and firm access</li></ul><div class="rolebuttons"><button class="btn" onclick="openRoleAuth('seller','login')">Seller / owner login</button><button class="btn outline" onclick="openRoleAuth('seller','register')">Create seller account</button></div><button class="demolink" onclick="startMarketDemo('seller')">View seller / owner demo →</button></section></div><div class="entryfooter"><button onclick="go('firmSettings')">${icon('crda')} Connect your backend</button><p>Demo records are fictional. Real accounts require the hosted HTTPS backend. The same email cannot be both a buyer and seller account in this pilot.</p></div></div>`;
}
function openRoleAuth(side, mode) {
  Market.side = side;
  go('marketAuth', {
    side,
    mode
  });
}
marketAuthPage = function () {
  const side = args.side || 'buyer',
    mode = args.mode || 'login',
    seller = side === 'seller';
  Market.side = side;
  $('app').innerHTML = `${backbtn()}<div class="authwelcome"><span class="tag">${seller ? 'SELLER / OWNER' : 'BUYER'}</span><h1>${mode === 'login' ? 'Welcome back.' : mode === 'join' ? 'Join your real estate firm.' : 'Create your ' + (seller ? 'seller' : 'buyer') + ' account.'}</h1><p>${seller ? 'Manage your own inventory and interested buyers.' : 'Explore listings across all connected seller firms.'}</p></div><div class="chips">${[['login', 'Login'], ['register', 'Create account'], ...(seller ? [['join', 'Staff invitation']] : [])].map(([m, l]) => `<button class="chip ${mode === m ? 'active' : ''}" onclick="args.mode='${m}';marketAuthPage()">${l}</button>`).join('')}</div><form class="panel" onsubmit="roleAuthenticate(event,'${side}','${mode}')">${mode !== 'login' ? input('Your full name', 'name', '', 'text', true) : ''}${seller && mode === 'register' ? `${select('Account type', 'accountType', ['Individual property owner', 'Real estate firm'], 'Individual property owner')}${input('Owner / business display name', 'firmName', '', 'text', true)}` : ''}${input('Email', 'email', '', 'email', true)}${input(mode === 'login' ? 'Password' : 'New passphrase (15+ characters)', 'password', '', 'password', true, `minlength="${mode === 'login' ? 10 : 15}" maxlength="200" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}"`)}${mode !== 'login' ? input('Confirm passphrase', 'confirmPassword', '', 'password', true, 'minlength="15" maxlength="200"') : ''}${mode === 'join' ? input('One-time staff invitation', 'inviteCode', '', 'text', true) : ''}${mode === 'login' ? input('Authenticator / recovery code, if enabled', 'otp', '', 'text', false, 'autocomplete="one-time-code"') : ''}<div class="space"></div><button class="btn full" type="submit">${mode === 'login' ? 'Login to ' + (seller ? 'seller / owner' : 'buyer') + ' dashboard' : mode === 'join' ? 'Join firm' : 'Create ' + (seller ? 'seller / owner' : 'buyer') + ' account'}</button></form><p class="tabnote">${Firm.endpoint ? 'Connected server: ' + esc(Firm.endpoint) : 'Connect a deployed backend to create real accounts. You can explore a demo now.'}</p><div class="row"><button class="btn secondary grow" onclick="startMarketDemo('${side}')">${seller ? 'Seller / owner' : 'Buyer'} demo</button><button class="btn outline grow" onclick="go('firmSettings')">Backend settings</button></div><p class="footertext">Account login does not verify property ownership. New seller registrations become the owner of their own workspace. Staff access requires an owner-issued invitation.</p>`;
};
async function roleAuthenticate(e, side, mode) {
  e.preventDefault();
  const f = e.target;
  if (mode !== 'login' && f.elements.namedItem('password').value !== f.elements.namedItem('confirmPassword').value) {
    toast('The passphrases do not match.');
    return;
  }
  await marketAuthenticate(e, side, mode);
}
classicAdd = function () {
  if (!hasRoleAccount()) {
    openRoleAuth('seller', 'login');
    return;
  }
  if (buyerSide()) {
    toast('Only a seller or owner account can list property.');
    return;
  }
  go('sellerEdit');
};
header = function () {
  if (!hasRoleAccount()) {
    $('header').innerHTML = `<div class="mark">${icon('home')}</div><div class="brand"><strong>Agent Mart</strong><small>BUY • SELL • INSIGHTS</small></div><button class="iconbtn" aria-label="Choose buyer or seller" onclick="route='roleEntry';args={};render()">${icon('account')}</button>`;
    $('nav').innerHTML = '';
    return;
  }
  rolesBase.header();
  $('header').querySelector('.brand small').textContent = buyerSide() ? 'BUYER • DISCOVER & TRACK' : 'SELLER / OWNER • MY INVENTORY';
  if (buyerSide()) $('header').querySelector('[aria-label="Add property"]')?.remove();
  $('header').insertAdjacentHTML('beforeend', `<button class="iconbtn interestbell" aria-label="${buyerSide() ? 'My interests' : 'Interested buyers'}" onclick="go('marketRequests')">${icon('legal')}</button>`);
};
home = function () {
  if (!hasRoleAccount()) {
    rolesEntry();
    return;
  }
  rolesBase.home();
  const hero = $('app').querySelector('.classicintro');
  if (hero) {
    hero.querySelector('.eyebrow').textContent = buyerSide() ? 'BUYER DASHBOARD • PROPERTY DISCOVERY' : 'SELLER / OWNER • PROPERTY INVENTORY';
    hero.querySelector('h1').innerHTML = buyerSide() ? 'Find your property.<br><em>Track every interest.</em>' : 'Your property listings.<br><em>Your buyer follow-ups.</em>';
    hero.querySelector('p').textContent = buyerSide() ? 'Explore published properties from all seller firms.' : 'Create private listings, review them and publish to buyers.';
    hero.querySelector('.introactions').innerHTML = buyerSide() ? `<button class="btn" onclick="go('marketRequests')">My interests (${Market.requests.length})</button><button class="textaction" onclick="go('saved')">Saved properties →</button>` : `<button class="btn" onclick="classicAdd()">+ Add property</button><button class="textaction" onclick="go('marketRequests')">Interested buyers →</button>`;
  }
  if (buyerSide()) {
    const status = $('app').querySelector('.classicstatus');
    if (status) status.innerHTML = `<span>${Market.demo ? 'DEMO BUYER • FICTIONAL LISTINGS' : 'ALL SELLER FIRMS • PUBLISHED LISTINGS'}</span><button onclick="go('marketRequests')">My interests →</button>`;
  } else {
    const status = $('app').querySelector('.classicstatus');
    if (status) status.innerHTML = `<span>${Market.demo ? 'DEMO OWNER' : 'MY FIRM INVENTORY'}</span><button onclick="go('sellerHome')">Dashboard →</button>`;
  }
};
function isFollowupDue(r) {
  const f = r.followUp;
  return ['Pending', 'Accepted'].includes(r.status) && f?.nextAt && !['Completed', 'Not proceeding'].includes(f.stage) && new Date(f.nextAt) <= new Date();
}
requestsMarket = async function () {
  const session = Firm.token;
  if (marketLive()) await refreshMarket(false);
  if (route !== 'marketRequests' || session !== Firm.token) return;
  const all = Market.requests,
    q = Roles42.query.toLowerCase(),
    rows = all.filter(r => (!q || [r.propertyTitle, r.buyerName, r.interestStage].join(' ').toLowerCase().includes(q)) && (Roles42.filter === 'all' || Roles42.filter === 'due' ? Roles42.filter !== 'due' || isFollowupDue(r) : r.status === Roles42.filter));
  $('app').innerHTML = `<div class="eyebrow">${buyerSide() ? 'BUYER DASHBOARD' : 'SELLER / OWNER DASHBOARD'}</div><h1>${buyerSide() ? 'My property interests' : 'Interested buyers & follow-ups'}</h1><p class="muted">${buyerSide() ? 'Track your requests, seller responses and visit proposals.' : 'Respond to new interest, set a stage and keep the next action visible.'}</p><div class="interestcounts"><div><strong>${all.length}</strong><small>Total</small></div><div><strong>${all.filter(r => r.status === 'Pending').length}</strong><small>Awaiting response</small></div><div><strong>${buyerSide() ? all.filter(r => r.buyerConfirmedVisit).length : all.filter(isFollowupDue).length}</strong><small>${buyerSide() ? 'Confirmed visits' : 'Follow-ups due'}</small></div></div><form class="searchline classicsearch" onsubmit="event.preventDefault();Roles42.query=this.elements.namedItem('q').value;requestsMarket()"><input name="q" aria-label="Search interests" value="${esc(Roles42.query)}" placeholder="Property${buyerSide() ? '' : ' or buyer'} name"><button class="btn">Search</button></form><div class="chips">${[['all', 'All'], ['Pending', 'New'], ['Accepted', 'Active'], ...(!buyerSide() ? [['due', 'Follow-ups due']] : []), ['Closed', 'Closed'], ['Declined', 'Declined']].map(([k, l]) => `<button class="chip ${Roles42.filter === k ? 'active' : ''}" onclick="Roles42.filter='${k}';requestsMarket()">${l}</button>`).join('')}</div>${rows.map(r => `<article class="interestcard"><div class="row"><span class="tag ${isFollowupDue(r) ? 'amber' : ''}">${esc(r.status)}</span><small>${new Date(r.created).toLocaleDateString('en-IN')}</small></div><h3>${esc(r.propertyTitle)}</h3>${!buyerSide() ? `<p>${esc(r.buyerName)}</p>` : ''}<div class="intereststage">${esc(r.interestStage || r.followUp?.stage || 'New interest')}</div>${!buyerSide() && r.followUp?.nextAt ? `<small class="${isFollowupDue(r) ? 'due' : ''}">Next follow-up: ${new Date(r.followUp.nextAt).toLocaleString('en-IN')}</small>` : ''}${r.visit ? `<small>Site visit: ${new Date(r.visit.scheduled).toLocaleString('en-IN')} · ${esc(r.visit.status)}</small>` : ''}<button class="btn secondary full" onclick="go('marketThread',{id:'${r.id}'})">${buyerSide() ? 'Open interest & seller response' : 'Open buyer & next action'} →</button></article>`).join('') || empty(buyerSide() ? 'No matching interests' : 'No matching buyers', buyerSide() ? 'Open a property and tap I am interested.' : 'Publish your listings to receive buyer interest.')}<p class="footertext">${buyerSide() ? 'The seller controls their response. Interest is not a booking, reservation or ownership transfer.' : 'Private follow-up notes are visible only to authorized firm staff. Stages are shared with the interested buyer. Follow-up reminders are shown in this dashboard; push delivery is not configured.'}</p>`;
};
function followupPanel(r) {
  const f = r.followUp || {},
    when = f.nextAt ? new Date(new Date(f.nextAt).getTime() - new Date(f.nextAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
  return `<section class="panel followupform" id="followupPanel"><h2>Next buyer follow-up</h2><p class="mini muted">The stage is visible to the buyer. Your notes and next follow-up time stay inside the seller firm.</p><form onsubmit="saveRoleFollowup(event,'${r.id}')">${select('Buyer interest stage', 'stage', interestStages, f.stage || r.interestStage || 'New interest')}<label>Next follow-up date & time (optional)</label><input name="nextAt" type="datetime-local" value="${when}"><label>Private firm note</label><textarea name="note" maxlength="2000" placeholder="Documents to request, call outcome or next task">${esc(f.note || '')}</textarea><small>Clear the date for Completed / Not proceeding. This records a task; no call or notification is sent automatically.</small><div class="space"></div><button class="btn full">Save follow-up</button></form>${r.followUpHistory?.length ? `<details><summary>Follow-up history (${r.followUpHistory.length})</summary>${r.followUpHistory.map(h => `<div class="listrow"><strong>${esc(h.stage)}</strong><small>${new Date(h.created).toLocaleString('en-IN')}</small><p class="mini">${esc(h.note || 'No note')}</p></div>`).join('')}</details>` : ''}</section>`;
}
async function saveRoleFollowup(e, id) {
  e.preventDefault();
  const b = e.target.querySelector('button');
  b.disabled = true;
  try {
    const d = Object.fromEntries(new FormData(e.target));
    d.nextAt = d.nextAt ? new Date(d.nextAt).toISOString() : null;
    d.version = Market.thread.version;
    if (Market.demo) {
      const r = marketDemo.requests.find(r => r.id === id);
      if (d.nextAt && new Date(d.nextAt) <= new Date()) throw Error('Choose a future follow-up time.');
      if (['Completed', 'Not proceeding'].includes(d.stage) && d.nextAt) throw Error('Clear the next follow-up for a completed interest.');
      r.followUp = {
        stage: d.stage,
        nextAt: d.nextAt,
        note: d.note,
        updated: new Date().toISOString()
      };
      r.interestStage = d.stage;
      r.version++;
      r.followUpHistory = [{
        stage: d.stage,
        next_at: d.nextAt,
        note: d.note,
        created: new Date().toISOString(),
        actor_id: Market.user.id
      }, ...(r.followUpHistory || [])];
      saveMarketDemo();
    } else await marketCall('POST', '/api/market/requests/' + id + '/follow-up', d);
    await refreshMarket(false);
    await threadMarket();
    toast('Follow-up saved');
  } catch (e) {
    toast(e.message);
  } finally {
    b.disabled = false;
  }
}
threadMarket = async function () {
  const id = args.id,
    session = Firm.token;
  await rolesBase.threadMarket();
  if (route !== 'marketThread' || args.id !== id || Firm.token !== session || !Market.thread) return;
  const r = Market.thread,
    head = $('app').querySelector('.conversation');
  if (buyerSide()) {
    head?.insertAdjacentHTML('beforebegin', `<div class="interestprogress"><strong>Interest progress: ${esc(r.interestStage || 'New interest')}</strong><small>Request ${esc(r.status.toLowerCase())}${r.buyerConfirmedVisit ? ' · Site visit confirmed by you' : ''}</small></div>`);
  } else if (['Pending', 'Accepted'].includes(r.status)) {
    const form = $('app').querySelector('form');
    if (form) form.insertAdjacentHTML('beforebegin', followupPanel(r));else $('app').insertAdjacentHTML('beforeend', followupPanel(r));
  }
  if (['Pending', 'Accepted'].includes(r.status)) $('app').insertAdjacentHTML('beforeend', `<button class="btn outline full" onclick="closeRoleInterest('${r.id}')">${buyerSide() ? 'Withdraw this interest' : 'Close this interest'}</button>`);
};
async function closeRoleInterest(id) {
  if (!confirm('Close this interest? Future messages and document access stop; existing copies cannot be recalled.')) return;
  try {
    if (Market.demo) {
      const r = marketDemo.requests.find(r => r.id === id);
      r.status = 'Closed';
      r.version++;
      saveMarketDemo();
    } else await marketCall('POST', '/api/market/requests/' + id + '/close', {
      version: Market.thread.version
    });
    await refreshMarket(false);
    threadMarket();
  } catch (e) {
    toast(e.message);
  }
}
const roleProperty = marketProperty;
marketProperty = async function () {
  await roleProperty();
  if (!['detail', 'marketProperty'].includes(route)) return;
  if (buyerSide()) {
    const form = $('app').querySelector('form[onsubmit^="submitMarketEnquiry"]');
    if (form) {
      form.querySelector('button').textContent = 'I am interested';
      form.querySelector('textarea').placeholder = 'I am interested in this property. Please contact me and share the relevant details.';
    }
  }
};
classicDashboard = function () {
  rolesBase.classicDashboard();
  const due = Market.requests.filter(isFollowupDue),
    panel = $('app').querySelector('.actiongrid');
  if (panel) panel.insertAdjacentHTML('beforebegin', `<button class="followupcallout" onclick="Roles42.filter='due';go('marketRequests')"><span>${icon('legal')} Buyer follow-ups due</span><strong>${due.length} →</strong></button>`);
  $('app').insertAdjacentHTML('beforeend', `<button class="btn secondary full" style="margin-top:12px" onclick="classicAdd()">+ Add a property listing</button>`);
};
classicAccount = function () {
  if (!hasRoleAccount()) {
    rolesEntry();
    return;
  }
  accountMarket();
  $('app').insertAdjacentHTML('afterbegin', `<div class="classictools"><button onclick="go('home')">${icon('home')} ${buyerSide() ? 'Browse all sellers' : 'My property listings'}</button><button onclick="go('${buyerSide() ? 'marketRequests' : 'sellerHome'}')">${icon('legal')} ${buyerSide() ? 'My interests' : 'Seller dashboard'}</button></div>`);
};
const roleRender = render;
render = function () {
  if (Market.user && !Market.demo && !Firm.token) {
    Market.user = null;
    Market.side = '';
    Market.catalog = [];
    Market.inventory = [];
    Market.requests = [];
  }
  if (!hasRoleAccount()) {
    if (!['roleEntry', 'marketAuth', 'firmSettings', 'about'].includes(route)) {
      route = 'roleEntry';
      args = {};
    }
    if (route === 'roleEntry') {
      header();
      rolesEntry();
      return;
    }
  }
  if (hasRoleAccount() && buyerSide() && ['edit', 'sellerEdit', 'sellerInventory', 'sellerHome', 'team', 'branches', 'reports', 'activity', 'leads', 'leadEdit', 'visits', 'visitEdit', 'firmMore'].includes(route)) {
    route = 'home';
    args = {};
    toast('Buyer accounts can browse and enquire. Seller tools require a seller account.');
  }
  roleRender();
  header();
};
function seedRoleInterestDemo() {
  if (marketDemo.requests.length || localStorage.getItem('role42_demo_seeded')) return;
  const ps = marketDemo.properties.filter(p => p.published);
  for (let i = 0; i < Math.min(2, ps.length); i++) {
    const accepted = i === 1;
    marketDemo.requests.push({
      id: 'role42sample' + i,
      propertyId: ps[i].id,
      propertyTitle: ps[i].title,
      buyerName: 'Customer',
      status: accepted ? 'Accepted' : 'Pending',
      version: 1,
      created: new Date().toISOString(),
      messages: [{
        id: 'role42msg' + i,
        sender_id: 'demoBuyer',
        body: 'Fictional demo interest: please share details and source documents.',
        created: new Date().toISOString()
      }],
      documents: [],
      interestStage: accepted ? 'Contacted' : 'New interest',
      followUp: accepted ? {
        stage: 'Contacted',
        nextAt: new Date(Date.now() - 3600000).toISOString(),
        note: 'Fictional private seller task: request relevant property documents.',
        updated: new Date().toISOString()
      } : undefined
    });
  }
  localStorage.setItem('role42_demo_seeded', '1');
  saveMarketDemo();
}
startMarketDemo = function (side) {
  Roles42.query = '';
  Roles42.filter = 'all';
  rolesBase.startMarketDemo(side);
  seedRoleInterestDemo();
  Market.requests = marketDemo.requests;
  if (side === 'buyer') {
    route = 'home';
    state.listings = Market.catalog;
  }
  render();
};
marketLogout = async function () {
  await rolesBase.marketLogout();
  Roles42.query = '';
  Roles42.filter = 'all';
  route = 'roleEntry';
  args = {};
  stack = [];
  render();
};
route = 'roleEntry';
args = {};
stack = [];
render();

// Shared schema drives seller forms and the backend allowlist.
