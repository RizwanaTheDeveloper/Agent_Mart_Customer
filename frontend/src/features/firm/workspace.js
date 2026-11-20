function restoreLocal() {
  try {
    state = JSON.parse(localStorage.getItem(KEY)) || state;
  } catch (e) {}
  lastGood = JSON.stringify(state);
}
function useFirmView() {
  if (!enterprise() || !Firm.data) return;
  let rows = Firm.data.properties || [];
  if (Firm.mode === 'demo' && role() === 'agent') rows = rows.filter(p => p.assignedTo === Firm.data.user.id);
  state.listings = rows;
}
persist = function () {
  if (!enterprise()) return original.persist();
  try {
    const base = JSON.parse(localStorage.getItem(KEY) || lastGood);
    base.refs = state.refs;
    base.imports = state.imports;
    base.lang = state.lang;
    base.seeded = state.seeded;
    localStorage.setItem(KEY, JSON.stringify(base));
    localStorage.setItem(privateKey(), JSON.stringify({
      saved: state.saved,
      checks: state.checks,
      notes: state.notes
    }));
    if (Firm.mode === 'demo') saveDemo();
    return true;
  } catch (e) {
    toast('Device storage is full. Export reference data and remove unused photos.');
    return false;
  }
};
function loadPrivate() {
  let p = {};
  try {
    p = JSON.parse(localStorage.getItem(privateKey()) || '{}');
  } catch (e) {}
  state.saved = p.saved || [];
  state.checks = p.checks || {};
  state.notes = p.notes || {};
}
async function firmRefresh(redraw = true) {
  if (!Firm.token || Firm.busy) return;
  Firm.busy = true;
  const sessionToken = Firm.token;
  try {
    const d = await firmCall('GET', '/api/sync');
    if (Firm.token !== sessionToken || Firm.mode !== 'live') return;
    Firm.data = d;
    Firm.lastSync = new Date().toISOString();
    Firm.stale = false;
    useFirmView();
    if (redraw) render();
  } catch (e) {
    Firm.stale = true;
    toast(e.message);
  } finally {
    Firm.busy = false;
  }
}
function statusStrip() {
  return `<div class="firmstrip ${Firm.mode === 'demo' ? 'demostrip' : ''}"><span>${Firm.mode === 'demo' ? 'OFFLINE FIRM DEMO' : 'SHARED FIRM WORKSPACE'} • ${esc(role().toUpperCase())}</span><span>${Firm.mode === 'demo' ? 'Simulated access' : Firm.stale ? 'Connection lost' : 'Synced ' + (Firm.lastSync ? new Date(Firm.lastSync).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  }) : '')}</span></div>`;
}
header = function () {
  original.header();
  $('header').querySelector('.brand strong').textContent = 'Agent Mart Firms';
  $('header').querySelector('.brand small').textContent = enterprise() ? Firm.data.firm.name : 'PROPERTY • TEAMS • WORKSPACE';
  const plus = $('header').querySelector('button[aria-label="Add property"]');
  if (enterprise() && !writable()) plus.style.display = 'none';
  $('header').insertAdjacentHTML('beforeend', `<button class="iconbtn" aria-label="Firm workspace" onclick="go('firm')">${icon('crda')}</button>`);
  if (enterprise()) {
    const active = ['firm', 'home', 'leads', 'visits', 'firmMore'].includes(route) ? route : ['leadEdit'].includes(route) ? 'leads' : route === 'visitEdit' ? 'visits' : ['detail', 'edit'].includes(route) ? 'home' : 'firmMore';
    $('nav').innerHTML = [['firm', 'home', 'Dashboard'], ['home', 'search', 'Properties'], ['leads', 'legal', 'Enquiries'], ['visits', 'pin', 'Visits'], ['firmMore', 'crda', 'More']].map(([r, i, l]) => `<button class="${active === r ? 'active' : ''}" onclick="go('${r}')">${icon(i)}<span>${l}</span></button>`).join('');
  }
};
render = function () {
  header();
  const extra = {
    firm: firmPage,
    firmAuth: authPage,
    firmSettings: settingsPage,
    firmMore: morePage,
    leads: leadsPage,
    leadEdit: leadEditor,
    visits: visitsPage,
    visitEdit: visitEditor,
    team: teamPage,
    branches: branchesPage,
    reports: reportsPage,
    activity: activityPage,
    firmPassword: passwordPage
  };
  if (extra[route]) {
    try {
      extra[route]();
    } catch (e) {
      console.error(e);
      $('app').innerHTML = empty('Workspace unavailable', 'Refresh your connection and try again.');
    }
    return;
  }
  original.render();
  if (enterprise() && !$('app').querySelector('.firmstrip')) $('app').insertAdjacentHTML('afterbegin', statusStrip());
};
home = function () {
  if (!enterprise()) {
    original.home();
    return;
  }
  const rows = filterListings().filter(p => (!view.mine || p.assignedTo === Firm.data.user.id) && (!Firm.branchFilter || p.branchId === Firm.branchFilter));
  $('app').innerHTML = `${statusStrip()}<div class="row sectionhead"><div><div class="eyebrow">SHARED PROPERTY INVENTORY</div><h1>${esc(Firm.data.firm.name)}</h1></div>${writable() ? '<button class="btn" onclick="go(\'edit\')">+ Property</button>' : ''}</div><form class="searchline" onsubmit="event.preventDefault();setFilter('q',this.q.value)"><input name="q" value="${esc(view.q)}" placeholder="Property, village, survey or plot code"><button class="btn" aria-label="Search">${icon('search')}</button></form><div class="chips">${['All', 'Plot', 'Apartment', 'House', 'Commercial', 'Farm land'].map(x => `<button class="chip ${view.type === x ? 'active' : ''}" onclick="setFilter('type','${x}')">${x}</button>`).join('')}</div><div class="grid"><select aria-label="Branch filter" onchange="Firm.branchFilter=this.value;home()"><option value="">All branches</option>${Firm.data.branches.map(b => `<option value="${b.id}" ${Firm.branchFilter === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select><select aria-label="Purpose filter" onchange="setFilter('purpose',this.value)">${options(['All', 'Sale', 'Rent'], view.purpose)}</select></div><p class="tabnote">${rows.length} visible records. ${role() === 'agent' ? 'Only properties assigned to you.' : role() === 'viewer' ? 'Read-only property access; buyer contacts are hidden.' : 'Managers can assign inventory and branch ownership.'}</p><div class="cards">${rows.map(card).join('') || empty('No assigned properties', 'Add inventory or ask your manager to assign a property.')}</div><p class="footertext">${Firm.mode === 'demo' ? 'Fictional firm demo stored on this device.' : 'Shared inventory uses your configured firm backend. The sync view is capped at 1,000 records per entity.'}</p>`;
};
const originalFilter = filterListings;
filterListings = function () {
  if (!enterprise()) return originalFilter();
  return state.listings.filter(p => (view.type === 'All' || p.type === view.type) && (view.purpose === 'All' || p.purpose === view.purpose) && (!view.max || p.price <= Number(view.max)) && (!view.q || [p.title, p.village, p.city, p.plotCode, p.survey].join(' ').toLowerCase().includes(view.q.toLowerCase())));
};
detail = function () {
  original.detail();
  if (!enterprise()) return;
  const p = state.listings.find(x => x.id === args.id);
  if (!p) return;
  if (Firm.mode === 'live' && p.hasPhoto && !p.photo) {
    firmCall('GET', '/api/properties/' + p.id + '/photo').then(r => {
      p.photo = r.photo;
      p.hasPhoto = !!r.photo;
      if (route === 'detail' && args.id === p.id) detail();
    }).catch(e => toast('Property photo unavailable'));
  }
  const user = Firm.data.users.find(x => x.id === p.assignedTo),
    branch = Firm.data.branches.find(x => x.id === p.branchId);
  $('app').insertAdjacentHTML('beforeend', `<div class="panel"><h2>Firm assignment</h2><div class="facts">${fact('Assigned staff', user?.name)}${fact('Branch', branch?.name)}${fact('Record version', p.version || 1)}${fact('Workspace', Firm.data.firm.name)}</div>${writable() ? `<button class="btn full" style="margin-top:12px" onclick="go('leadEdit',{propertyId:'${p.id}'})">Add buyer enquiry for this property</button>` : ''}</div>`);
  if (!writable()) $('app').querySelectorAll('button[onclick^="go(\'edit\'"]').forEach(b => b.remove());
  $('app').querySelectorAll('.notice.blue').forEach(n => {
    if (n.textContent.includes('Device-local')) n.textContent = 'Shared firm listing. Property facts remain seller supplied and are not title certification.';
  });
};
edit = function () {
  if (enterprise() && !writable()) {
    toast('Your role has read-only property access');
    go('home');
    return;
  }
  original.edit();
  if (!enterprise()) return;
  const p = state.listings.find(x => x.id === args.id);
  Firm.editVersion = p?.version || null;
  Firm.editSnapshot = p ? JSON.parse(JSON.stringify(p)) : null;
  const form = $('propertyForm');
  form.insertAdjacentHTML('afterbegin', `<div class="panel"><h2>Firm assignment</h2>${staffSelect('Assigned staff', 'assignedTo', p?.assignedTo || Firm.data.user.id, !manager())}${branchSelect(p?.branchId || '', !manager())}<small>Assignment controls are enforced by the server in connected mode.</small></div>`);
  form.querySelector('button[type="submit"]').textContent = 'Save shared property';
  form.querySelectorAll('button').forEach(b => {
    if (b.textContent.includes('Delete this local')) {
      b.textContent = 'Delete shared property';
      if (!manager()) b.remove();
    }
  });
  $('app').querySelector('.notice.blue').textContent = Firm.mode === 'demo' ? 'Offline demo. Changes affect only the fictional workspace on this device.' : 'Changes save to your firm server. Version conflicts prevent overwriting another staff member’s edit.';
};
function staffSelect(label, name, value, disabled = false) {
  return `<label>${label}</label><select name="${name}" ${disabled ? 'disabled' : ''}>${Firm.data.users.filter(u => u.active && u.role !== 'viewer').map(u => `<option value="${u.id}" ${u.id === value ? 'selected' : ''}>${esc(u.name)} • ${u.role}</option>`).join('')}</select>`;
}
function branchSelect(value, disabled = false) {
  return `<label>Branch</label><select name="branchId" ${disabled ? 'disabled' : ''}><option value="">Unassigned branch</option>${Firm.data.branches.map(b => `<option value="${b.id}" ${b.id === value ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select>`;
}
saveProperty = async function (e) {
  if (!enterprise()) return original.saveProperty(e);
  e.preventDefault();
  const button = e.target.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const d = Object.fromEntries(new FormData(e.target));
    for (const k of ['price', 'area', 'lat', 'lon', 'road', 'bhk']) d[k] = num(d[k]);
    d.photo = photoDraft;
    if (Firm.editSnapshot?.hasPhoto && !photoDraft) delete d.photo;
    d.plotCode = canonical(d.plotCode);
    d.assignedTo = d.assignedTo || Firm.editSnapshot?.assignedTo || Firm.data.user.id;
    d.branchId = d.branchId === undefined ? Firm.editSnapshot?.branchId || null : d.branchId || null;
    if (Firm.editVersion) d.version = Firm.editVersion;
    const result = await firmAction(Firm.editVersion ? 'PATCH' : 'POST', Firm.editVersion ? '/api/properties/' + args.id : '/api/properties', d);
    toast('Shared property saved');
    go('detail', {
      id: result.id
    });
  } catch (e) {
    toast(e.message);
  } finally {
    button.disabled = false;
  }
};
deleteProperty = async function (id) {
  if (!enterprise()) return original.deleteProperty(id);
  if (!confirm('Delete this shared property for the firm? Existing lead history remains.')) return;
  try {
    await firmAction('DELETE', '/api/properties/' + id, {
      version: Firm.editVersion
    });
    go('home');
    toast('Shared property deleted');
  } catch (e) {
    toast(e.message);
  }
};
function freshDemo() {
  const users = [{
    id: 'do',
    name: 'Ravi Kumar',
    email: 'owner@example.invalid',
    role: 'owner'
  }, {
    id: 'dm',
    name: 'Saira Rao',
    email: 'manager@example.invalid',
    role: 'manager'
  }, {
    id: 'da',
    name: 'Harish Reddy',
    email: 'agent@example.invalid',
    role: 'agent'
  }, {
    id: 'db',
    name: 'Anusha Devi',
    email: 'agent2@example.invalid',
    role: 'agent'
  }, {
    id: 'dv',
    name: 'Viewer account',
    email: 'viewer@example.invalid',
    role: 'viewer'
  }].map(x => ({
    ...x,
    firm_id: 'df',
    active: 1
  }));
  const properties = DEMOS.map((p, i) => ({
    ...p,
    id: 'dp' + i,
    assignedTo: i % 2 ? 'db' : 'da',
    branchId: i % 2 ? 'b2' : 'b1',
    version: 1
  }));
  const leads = [{
    id: 'dl1',
    property_id: 'dp0',
    assigned_to: 'da',
    name: 'DEMO • Lakshmi',
    phone: '',
    stage: 'New',
    source: 'Walk-in',
    note: 'Fictional enquiry; request documents before a site visit.',
    followup: new Date(Date.now() - 3600000).toISOString(),
    version: 1
  }, {
    id: 'dl2',
    property_id: 'dp1',
    assigned_to: 'db',
    name: 'DEMO • Suresh',
    phone: '',
    stage: 'Visit planned',
    source: 'Referral',
    note: 'Fictional buyer. Discuss suitable inspection time.',
    followup: null,
    version: 1
  }];
  return {
    firm: {
      id: 'df',
      name: 'Amaravati Realty • DEMO'
    },
    user: users[0],
    users,
    properties,
    leads,
    visits: [{
      id: 'dvisit1',
      lead_id: 'dl2',
      assigned_to: 'db',
      scheduled: new Date(Date.now() + 86400000).toISOString(),
      status: 'Proposed',
      note: 'Fictional visit proposal; buyer confirmation not yet recorded.',
      version: 1
    }],
    branches: [{
      id: 'b1',
      name: 'Amaravati Office'
    }, {
      id: 'b2',
      name: 'Vijayawada Office'
    }],
    audit: []
  };
}
function startDemo() {
  restoreLocal();
  let d;
  try {
    d = JSON.parse(localStorage.getItem('firm_demo_300'));
  } catch (e) {}
  Firm.data = d?.users ? d : freshDemo();
  Firm.data.user = Firm.data.users.find(u => u.id === Firm.demoUser) || Firm.data.users[0];
  Firm.mode = 'demo';
  Firm.token = '';
  loadPrivate();
  useFirmView();
  go('firm');
}
function saveDemo() {
  localStorage.setItem('firm_demo_300', JSON.stringify(Firm.data));
}
function demoRole(id) {
  Firm.demoUser = id;
  Firm.data.user = Firm.data.users.find(u => u.id === id);
  useFirmView();
  loadPrivate();
  render();
}
function demoAudit(action, id) {
  Firm.data.audit.unshift({
    id: uid('audit'),
    actor_id: Firm.data.user.id,
    action,
    entity_id: id,
    created: new Date().toISOString()
  });
  Firm.data.audit = Firm.data.audit.slice(0, 100);
}
async function firmAction(method, path, data) {
  if (Firm.mode === 'demo') {
    const r = demoAction(method, path, data);
    saveDemo();
    useFirmView();
    return r;
  }
  const sig = method + path + JSON.stringify(data);
  let key = Firm.retries.get(sig) || uid('op');
  Firm.retries.set(sig, key);
  try {
    const r = await firmCall(method, path, data, key);
    Firm.retries.delete(sig);
    await firmRefresh(false);
    return r;
  } catch (e) {
    if (e.status === 409) await firmRefresh(false);
    throw e;
  }
}
function demoAction(m, path, d) {
  const D = Firm.data;
  if (!writable()) throw Error('Read-only role');
  let id = path.split('/').pop();
  if (path === '/api/properties' && m === 'POST') {
    const p = {
      ...d,
      id: uid('dp'),
      version: 1,
      demo: true
    };
    D.properties.unshift(p);
    demoAudit('property.created', p.id);
    return p;
  }
  if (path.startsWith('/api/properties/')) {
    let p = D.properties.find(x => x.id === id);
    if (!p) throw Error('Property unavailable');
    if (role() === 'agent' && p.assignedTo !== D.user.id) throw Error('Property not assigned to you');
    if (d.version !== p.version) throw Error('Record changed. Refresh before editing.');
    if (m === 'DELETE') {
      if (!manager()) throw Error('Manager access required');
      D.properties = D.properties.filter(x => x.id !== id);
    } else {
      if (!manager() && d.assignedTo !== p.assignedTo) throw Error('Manager access required');
      Object.assign(p, d, {
        version: p.version + 1,
        demo: true
      });
    }
    demoAudit('property.updated', id);
    return {
      id
    };
  }
  if (path === '/api/branches') {
    if (!manager()) throw Error('Manager access required');
    let b = {
      id: uid('b'),
      name: d.name
    };
    D.branches.push(b);
    demoAudit('branch.created', b.id);
    return b;
  }
  if (path === '/api/leads') {
    let l = {
      id: uid('dl'),
      property_id: d.propertyId,
      assigned_to: d.assignedTo,
      name: d.name,
      phone: d.phone,
      stage: 'New',
      source: d.source,
      note: d.note,
      followup: d.followup,
      version: 1
    };
    D.leads.unshift(l);
    demoAudit('lead.created', l.id);
    return l;
  }
  if (path.startsWith('/api/leads/')) {
    let l = D.leads.find(x => x.id === id);
    if (role() === 'agent' && l.assigned_to !== D.user.id) throw Error('Lead not assigned to you');
    if (l.version !== d.version) throw Error('Record changed');
    Object.assign(l, d, {
      assigned_to: d.assignedTo || l.assigned_to,
      version: l.version + 1
    });
    demoAudit('lead.updated', id);
    return l;
  }
  if (path === '/api/visits') {
    let l = D.leads.find(x => x.id === d.leadId);
    let v = {
      id: uid('visit'),
      lead_id: l.id,
      assigned_to: l.assigned_to,
      scheduled: d.scheduled,
      note: d.note,
      status: 'Proposed',
      version: 1
    };
    D.visits.unshift(v);
    demoAudit('visit.proposed', v.id);
    return v;
  }
  if (path.startsWith('/api/visits/')) {
    let v = D.visits.find(x => x.id === id);
    if (role() === 'agent' && v.assigned_to !== D.user.id) throw Error('Visit not assigned to you');
    if (v.version !== d.version) throw Error('Record changed');
    Object.assign(v, d, {
      version: v.version + 1
    });
    demoAudit('visit.updated', id);
    return v;
  }
  if (path === '/api/invites') {
    if (role() !== 'owner') throw Error('Owner access required');
    return {
      inviteCode: 'DEMO-ONLY-' + uid(''),
      email: d.email,
      role: d.role,
      expiresInHours: 72
    };
  }
  if (path.startsWith('/api/users/')) {
    if (role() !== 'owner') throw Error('Owner access required');
    let u = D.users.find(x => x.id === id);
    if (u.role === 'owner') throw Error('Cannot change owner');
    Object.assign(u, d);
    demoAudit('team.access_changed', id);
    return {
      ok: true
    };
  }
  throw Error('Demo operation unavailable');
}
function visibleLeads() {
  if (!enterprise() || role() === 'viewer') return [];
  return Firm.data.leads.filter(l => role() !== 'agent' || l.assigned_to === Firm.data.user.id);
}
function visibleVisits() {
  if (!enterprise() || role() === 'viewer') return [];
  return Firm.data.visits.filter(v => role() !== 'agent' || v.assigned_to === Firm.data.user.id);
}
