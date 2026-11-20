// Firm settings, authentication, leads, visits, team, branches, reports, and activity.
// Browser document source; assembled in source-manifest.json order.
function firmPage() {
  if (!enterprise()) {
    welcomePage();
    return;
  }
  const leads = visibleLeads(),
    visits = visibleVisits(),
    due = leads.filter(l => l.followup && new Date(l.followup) < new Date() && !['Won', 'Lost'].includes(l.stage));
  $('app').innerHTML = `${statusStrip()}<div class="hero firmhero"><div class="eyebrow">REAL ESTATE FIRM WORKSPACE</div><h1>${esc(Firm.data.firm.name)}</h1><p>${esc(Firm.data.user.name)} • ${role()}. Shared property operations with clear staff responsibility.</p><button class="btn" onclick="${Firm.mode === 'demo' ? 'render()' : 'firmRefresh()'}">${Firm.mode === 'demo' ? 'View demo overview' : 'Refresh shared records'}</button></div>${Firm.mode === 'demo' ? `<div class="panel"><label>Preview staff access (demo only)</label><select onchange="demoRole(this.value)">${Firm.data.users.map(u => `<option value="${u.id}" ${u.id === Firm.data.user.id ? 'selected' : ''}>${esc(u.name)} • ${u.role}</option>`).join('')}</select><small>This selector simulates roles on one device. Live roles come only from the authenticated server.</small></div>` : ''}<div class="grid"><div class="stat"><div class="pillcount">${state.listings.length}</div><small>visible properties</small></div><div class="stat"><div class="pillcount">${leads.length}</div><small>buyer enquiries</small></div><div class="stat"><div class="pillcount">${due.length}</div><small>follow-ups due</small></div><div class="stat"><div class="pillcount">${visits.filter(v => ['Proposed', 'Confirmed'].includes(v.status)).length}</div><small>upcoming visit plans</small></div></div><div class="row sectionhead"><h2>Workspace actions</h2></div><div class="actiongrid">${[['home', 'home', 'Property inventory'], ['leads', 'legal', 'Enquiries & pipeline'], ['visits', 'pin', 'Site visits'], ['crda', 'crda', 'CRDA plot import'], ['map', 'map', 'Property map'], ['reports', 'saved', 'Firm reports']].map(([r, i, l]) => `<button class="actiontile" onclick="go('${r}')">${icon(i)}<strong>${l}</strong></button>`).join('')}</div><div class="panel" style="margin-top:17px"><h2>Follow-ups due</h2>${due.slice(0, 8).map(l => leadRow(l)).join('') || '<p class="muted">No pending overdue follow-ups in your visible records.</p>'}</div><div class="notice blue">${Firm.mode === 'demo' ? 'Offline demo changes do not create real staff accounts. Connect a deployed backend for independent sign-in on other devices.' : 'Your permissions are enforced on the server. Private legal checklists and imported CRDA references remain device-local.'}</div>`;
}
function welcomePage() {
  $('app').innerHTML = `<div class="hero firmhero"><div class="eyebrow">AGENT MART FIRMS • 3.1</div><h1>One firm.<br>One shared property workspace.</h1><p>Give every agent the right inventory, enquiry ownership and follow-up visibility.</p><button class="btn" style="background:#edb76f;color:#191658" onclick="go('firmSettings')">Connect your firm backend</button></div><div class="grid"><div class="stat"><div class="pillcount">4 roles</div><small>Owner • Manager • Agent • Viewer</small></div><div class="stat"><div class="pillcount">Team access</div><small>Independent staff sign-in</small></div></div><div class="panel" style="margin-top:17px"><h2>Explore the firm version</h2><p class="muted">Preview branches, property assignments, enquiry stages, follow-ups, site visits and reports with fictional records.</p><button class="btn full" onclick="startDemo()">Open offline firm demo</button></div><div class="panel"><h3>Connect for real multi-user access</h3><p class="mini muted">Deploy the included backend on an HTTPS server, enter its address, then create a firm account. The owner issues staff invitations; each staff member signs in independently on their phone.</p><div class="row"><button class="btn secondary grow" onclick="go('firmAuth',{mode:'login'})">Sign in</button><button class="btn outline grow" onclick="go('firmAuth',{mode:'register'})">Create firm</button></div></div><button class="btn outline full" onclick="exitFirm(false)">Continue with local property tools</button><p class="footertext">No live backend is preconfigured. Offline demo users are not real accounts.</p>`;
}
function settingsPage() {
  $('app').innerHTML = `${backbtn()}<div class="eyebrow">SHARED SERVER CONNECTION</div><h1>Connect firm backend</h1><div class="panel"><h3>Your HTTPS API origin</h3><p class="mini muted">Use the deployed server supplied by your developer. Example: https://api.yourfirm.in</p><form onsubmit="saveEndpoint(event)"><label for="endpoint">Backend URL</label><input id="endpoint" name="endpoint" type="url" required value="${esc(Firm.endpoint)}" placeholder="https://api.yourfirm.in"><div class="space"></div><button class="btn full">Save connection & test server</button></form><div id="connectionResult" class="tabnote"></div></div><div class="notice blue">The APK sends credentials only to the HTTPS origin you configure. Switching servers signs you out. There is no default owner password.</div><div class="panel"><h3>Server deployment</h3><p class="mini">The developer package includes the Python API, SQLite schema initialization, Docker deployment, HTTPS gateway configuration, authorization tests and operating notes. A server hostname and hosting account are required to run it across devices.</p></div>`;
}
async function saveEndpoint(e) {
  e.preventDefault();
  try {
    const u = new URL(e.target.endpoint.value.trim());
    if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash || u.pathname !== '/') throw Error('Enter only an HTTPS origin, with no path or credentials.');
    const origin = u.origin;
    if (window.AndroidApp?.configureBackend && !AndroidApp.configureBackend(origin)) throw Error('Android rejected this backend URL.');
    if (Firm.token) await exitFirm(false);
    Firm.endpoint = origin;
    localStorage.setItem('firm_endpoint_300', origin);
    const r = await firmCall('GET', '/api/health');
    if (r.service !== 'Agent Mart Firms') throw Error('This is not an Agent Mart Firms backend.');
    $('connectionResult').textContent = 'Connected to Agent Mart Firms ' + r.version;
    toast('Backend connection verified');
    go('firmAuth', {
      mode: 'login'
    });
  } catch (e) {
    $('connectionResult') && ($('connectionResult').textContent = e.message);
    toast(e.message);
  }
}
function authPage() {
  const mode = args.mode || 'login';
  $('app').innerHTML = `${backbtn()}<div class="eyebrow">${mode === 'register' ? 'OWNER ACCOUNT' : mode === 'join' ? 'STAFF INVITATION' : 'SECURE FIRM SIGN-IN'}</div><h1>${mode === 'register' ? 'Create your firm' : mode === 'join' ? 'Join your firm' : 'Sign in to your firm'}</h1><div class="chips">${[['login', 'Sign in'], ['register', 'Create firm'], ['join', 'Join invitation']].map(([x, l]) => `<button class="chip ${x === mode ? 'active' : ''}" onclick="args.mode='${x}';authPage()">${l}</button>`).join('')}</div><div class="notice blue">${Firm.endpoint ? esc(Firm.endpoint) : 'Set your HTTPS backend URL before creating accounts.'}</div><form class="panel" onsubmit="authenticate(event,'${mode}')">${mode === 'register' ? input('Firm / company name', 'firmName', '', 'text', true) : ''}${mode !== 'login' ? input('Your name', 'name', '', 'text', true) : ''}${input('Email address', 'email', '', 'email', true)}${input('Password (minimum 10 characters)', 'password', '', 'password', true, 'minlength="10" maxlength="200" autocomplete="' + (mode === 'login' ? 'current-password' : 'new-password') + '"')}${mode === 'join' ? input('Invitation code', 'inviteCode', '', 'text', true) : ''}<div class="space"></div><button class="btn full" type="submit">${mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create firm & owner account' : 'Accept invitation'}</button></form><button class="btn outline full" onclick="go('firmSettings')">Change backend connection</button><p class="footertext">Staff invitations are tied to the exact email address and expire in 72 hours. No email is sent automatically. Share the invitation code directly with the intended staff member.</p>`;
}
async function authenticate(e, mode) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    const connectionOrigin = Firm.endpoint,
      d = Object.fromEntries(new FormData(e.target)),
      r = await firmCall('POST', '/api/auth/' + (mode === 'register' ? 'register' : mode === 'join' ? 'join' : 'login'), d);
    if (Firm.endpoint !== connectionOrigin) throw Error('Backend changed during sign-in. Sign in again.');
    Firm.token = r.token;
    Firm.mode = 'live';
    Firm.data = {
      user: r.user
    };
    restoreLocal();
    loadPrivate();
    await firmRefresh(false);
    if (!Firm.data?.firm) throw Error('Signed in, but unable to load workspace. Retry refresh.');
    route = 'firm';
    args = {};
    stack = [];
    render();
    toast('Signed in to your firm');
  } catch (e) {
    toast(e.message);
  } finally {
    btn.disabled = false;
  }
}
async function exitFirm(navigate = true) {
  if (Firm.token) {
    try {
      await firmCall('POST', '/api/auth/logout');
    } catch (e) {}
  }
  Firm.token = '';
  Firm.data = null;
  Firm.mode = 'local';
  Firm.editVersion = null;
  Firm.branchFilter = '';
  Firm.retries.clear();
  restoreLocal();
  view = {
    q: '',
    type: 'All',
    purpose: 'All',
    mine: false,
    max: ''
  };
  route = navigate ? 'firm' : 'home';
  args = {};
  stack = [];
  render();
}
function morePage() {
  $('app').innerHTML = `${statusStrip()}<h1>Firm tools</h1><div class="panel linklist">${[['team', 'Team & roles'], ['branches', 'Branches'], ['reports', 'Firm reports'], ['activity', 'Activity history'], ['crda', 'CRDA plot references'], ['map', 'Property map'], ['legal', 'Legal search portals'], ['saved', 'Saved properties'], ['firmSettings', 'Backend connection'], ['firmPassword', 'Change password'], ['about', 'Source information']].filter(([r]) => !['activity'].includes(r) || manager()).map(([r, l]) => `<a href="#" onclick="event.preventDefault();go('${r}')">${l} →</a>`).join('')}</div><button class="btn danger full" onclick="exitFirm()">${Firm.mode === 'demo' ? 'Exit offline demo' : 'Sign out & clear shared session'}</button><p class="footertext">${Firm.mode === 'live' ? 'Sessions expire after 12 hours. Passwords and tokens are not saved in device storage.' : 'Demo data remains on this device for your next preview.'}</p>`;
}
function leadRow(l) {
  const p = Firm.data.properties.find(p => p.id === l.property_id),
    u = Firm.data.users.find(u => u.id === l.assigned_to);
  return `<div class="listrow" onclick="go('leadEdit',{id:'${l.id}'})"><div class="row"><strong>${esc(l.name)}</strong><span class="tag">${esc(l.stage)}</span></div><small>${esc(p?.title || 'Property removed')} • ${esc(u?.name || 'Unassigned')}</small><small>${l.followup ? 'Follow-up: ' + new Date(l.followup).toLocaleString('en-IN') : 'No follow-up scheduled'}</small></div>`;
}
function leadsPage() {
  if (!enterprise()) return welcomePage();
  if (role() === 'viewer') {
    $('app').innerHTML = empty('Buyer contacts are restricted', 'Your viewer role can browse property inventory and property reports.');
    return;
  }
  const stage = args.stage || 'All',
    rows = visibleLeads().filter(l => stage === 'All' || l.stage === stage);
  $('app').innerHTML = `${statusStrip()}<div class="row sectionhead"><div><div class="eyebrow">BUYER ENQUIRIES & FOLLOW-UPS</div><h1>Firm pipeline</h1></div><button class="btn" onclick="go('leadEdit')">+ Enquiry</button></div><div class="chips">${['All', ...['New', 'Contacted', 'Qualified', 'Visit planned', 'Negotiation', 'Won', 'Lost']].map(x => `<button class="chip ${stage === x ? 'active' : ''}" onclick="args.stage='${x}';leadsPage()">${x}</button>`).join('')}</div><div class="panel">${rows.map(leadRow).join('') || '<p class="muted">No enquiries in this stage.</p>'}</div><p class="footertext">Enquiries are entered by authorized staff. Public website enquiry intake and WhatsApp message ingestion are not connected.</p>`;
}
function localDatetime(s) {
  if (!s) return '';
  const d = new Date(s);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function leadEditor() {
  if (!enterprise() || !writable()) return leadsPage();
  const l = visibleLeads().find(l => l.id === args.id),
    pId = l?.property_id || args.propertyId || state.listings[0]?.id || '',
    assigned = l?.assigned_to || state.listings.find(p => p.id === pId)?.assignedTo || Firm.data.user.id;
  Firm.leadVersion = l?.version;
  $('app').innerHTML = `${backbtn()}${statusStrip()}<h1>${l ? 'Manage enquiry' : 'New buyer enquiry'}</h1><form class="panel" onsubmit="saveLead(event,'${l?.id || ''}')"><label>Property *</label><select name="propertyId" ${l ? 'disabled' : ''}>${state.listings.map(p => `<option value="${p.id}" ${p.id === pId ? 'selected' : ''}>${esc(p.title)}</option>`).join('')}</select>${!l ? input('Buyer name', 'name', '', 'text', true) + input('Buyer mobile', 'phone', '', 'tel', true, 'pattern="[6-9][0-9]{9}" maxlength="10"') : `<div class="facts">${fact('Buyer', l.name)}${fact('Mobile', l.phone || 'Fictional demo contact')}</div><label>Lead stage</label><select name="stage">${options(['New', 'Contacted', 'Qualified', 'Visit planned', 'Negotiation', 'Won', 'Lost'], l.stage)}</select>`}${staffSelect('Assigned staff', 'assignedTo', assigned, !manager())}${!l ? select('Source', 'source', ['Manual', 'Phone call', 'Referral', 'Walk-in', 'Website', 'WhatsApp'], 'Manual') : ''}<label>Next follow-up</label><input name="followup" type="datetime-local" value="${localDatetime(l?.followup)}"><label>Internal notes</label><textarea name="note" maxlength="2500">${esc(l?.note || '')}</textarea>${!l ? '<div class="checkrow" style="margin-top:15px"><input id="contactConsent" name="contactConsent" type="checkbox" required><label for="contactConsent">I have permission to store and share this buyer contact within this firm for this enquiry.</label></div>' : ''}<div class="space"></div><button class="btn full" type="submit">Save enquiry</button>${l ? `<button class="btn secondary full" type="button" style="margin-top:9px" onclick="go('visitEdit',{leadId:'${l.id}'})">Schedule site visit</button>` : ''}</form>`;
}
async function saveLead(e, id) {
  e.preventDefault();
  let b = e.target.querySelector('button[type="submit"]');
  b.disabled = true;
  try {
    const d = Object.fromEntries(new FormData(e.target));
    d.followup = d.followup ? new Date(d.followup).toISOString() : null;
    d.assignedTo = d.assignedTo || Firm.data.user.id;
    if (!id) d.contactConsent = $('contactConsent').checked;else d.version = Firm.leadVersion;
    await firmAction(id ? 'PATCH' : 'POST', id ? '/api/leads/' + id : '/api/leads', d);
    go('leads');
    toast('Enquiry saved');
  } catch (e) {
    toast(e.message);
  } finally {
    b.disabled = false;
  }
}
function visitsPage() {
  if (!enterprise() || role() === 'viewer') {
    $('app').innerHTML = empty('Visits are restricted', 'Ask the owner for an appropriate staff role.');
    return;
  }
  const rows = visibleVisits();
  $('app').innerHTML = `${statusStrip()}<div class="row sectionhead"><div><div class="eyebrow">SITE VISIT PLANNER</div><h1>Visits & inspections</h1></div><button class="btn" onclick="go('visitEdit')">+ Visit</button></div><div class="panel">${rows.map(v => {
    const l = Firm.data.leads.find(l => l.id === v.lead_id);
    return `<div class="listrow" onclick="go('visitEdit',{id:'${v.id}'})"><div class="row"><strong>${esc(l?.name || 'Buyer enquiry')}</strong><span class="tag">${esc(v.status)}</span></div><small>${new Date(v.scheduled).toLocaleString('en-IN')}</small><small>${esc(v.note)}</small></div>`;
  }).join('') || '<p class="muted">No visits scheduled.</p>'}</div><div class="notice blue">Staff records proposed and buyer-confirmed visits manually. A proposal is not automatic buyer confirmation. Rescheduling returns the plan to Proposed.</div>`;
}
function visitEditor() {
  if (!writable()) return visitsPage();
  const v = visibleVisits().find(x => x.id === args.id),
    leads = visibleLeads();
  Firm.visitVersion = v?.version;
  $('app').innerHTML = `${backbtn()}${statusStrip()}<h1>${v ? 'Update site visit' : 'Schedule a site visit'}</h1><form class="panel" onsubmit="saveVisit(event,'${v?.id || ''}')"><label>Buyer enquiry</label><select name="leadId" ${v ? 'disabled' : ''}>${leads.map(l => `<option value="${l.id}" ${l.id === (v?.lead_id || args.leadId) ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select><label>Visit date and time *</label><input name="scheduled" type="datetime-local" required value="${localDatetime(v?.scheduled)}">${v ? select('Recorded visit status', 'status', ['Proposed', 'Confirmed', 'Completed', 'Cancelled', 'No-show'], v.status) : ''}<label>Meeting point / notes</label><textarea name="note" maxlength="1500">${esc(v?.note || '')}</textarea><div class="space"></div><button class="btn full" ${!leads.length ? 'disabled' : ''}>Save visit</button></form><div class="notice">Confirmed means a staff member has recorded the buyer’s agreement. This app does not automatically obtain that agreement.</div>`;
}
async function saveVisit(e, id) {
  e.preventDefault();
  const b = e.target.querySelector('button');
  b.disabled = true;
  try {
    const d = Object.fromEntries(new FormData(e.target));
    d.scheduled = new Date(d.scheduled).toISOString();
    if (id) d.version = Firm.visitVersion;
    await firmAction(id ? 'PATCH' : 'POST', id ? '/api/visits/' + id : '/api/visits', d);
    go('visits');
    toast('Visit saved');
  } catch (e) {
    toast(e.message);
  } finally {
    b.disabled = false;
  }
}
function teamPage() {
  if (!enterprise()) return welcomePage();
  $('app').innerHTML = `${backbtn()}${statusStrip()}<h1>Team & access</h1><div class="panel">${Firm.data.users.map(u => `<div class="listrow"><div class="row"><div><strong>${esc(u.name)}</strong><small>${esc(u.email || '')} • ${esc(u.role)} • ${u.active ? 'Active' : 'Disabled'}</small></div>${role() === 'owner' && u.role !== 'owner' ? `<button class="btn ${u.active ? 'outline' : 'secondary'}" onclick="changeAccess('${u.id}',${u.active ? 0 : 1})">${u.active ? 'Disable' : 'Enable'}</button>` : ''}</div>${role() === 'owner' && u.role !== 'owner' ? `<select aria-label="Role for ${esc(u.name)}" onchange="changeRole('${u.id}',this.value)">${options(['manager', 'agent', 'viewer'], u.role)}</select>` : ''}</div>`).join('')}</div>${role() === 'owner' ? `<form class="panel" onsubmit="inviteStaff(event)"><h2>Invite staff member</h2>${input('Staff email', 'email', '', 'email', true)}${select('Role', 'role', ['manager', 'agent', 'viewer'], 'agent')}<div class="space"></div><button class="btn full">Generate invitation code</button><div id="inviteResult"></div></form>` : '<div class="notice blue">Only the firm owner can invite, disable or change staff roles.</div>'}<details><summary>Permission guide</summary><p class="mini">Owner: full firm access and team administration.<br>Manager: firm inventory, branches, assignment, enquiries, visits and reports.<br>Agent: assigned properties, own assigned enquiries and visits; no staff administration.<br>Viewer: read-only property inventory; buyer contact records are hidden.</p></details>`;
}
async function inviteStaff(e) {
  e.preventDefault();
  try {
    const d = Object.fromEntries(new FormData(e.target)),
      r = await firmAction('POST', '/api/invites', d);
    $('inviteResult').innerHTML = `<div class="notice ${Firm.mode === 'demo' ? '' : 'blue'}">${Firm.mode === 'demo' ? 'DEMO CODE - cannot create real accounts.' : 'Share this one-time code with ' + esc(r.email) + '. It expires in 72 hours.'}</div><textarea readonly>${esc(r.inviteCode)}</textarea><small>The code is shown only in this response. No email is sent automatically.</small>`;
  } catch (e) {
    toast(e.message);
  }
}
async function changeAccess(id, active) {
  if (!confirm((active ? 'Enable' : 'Disable') + ' this staff account? Active sessions will be revoked.')) return;
  try {
    await firmAction('PATCH', '/api/users/' + id, {
      active
    });
    render();
    toast('Staff access updated');
  } catch (e) {
    toast(e.message);
  }
}
async function changeRole(id, role) {
  try {
    await firmAction('PATCH', '/api/users/' + id, {
      role
    });
    render();
    toast('Role changed; staff must sign in again');
  } catch (e) {
    toast(e.message);
  }
}
function branchesPage() {
  $('app').innerHTML = `${backbtn()}${statusStrip()}<h1>Firm branches</h1><div class="panel">${Firm.data.branches.map(b => `<div class="listrow"><strong>${esc(b.name)}</strong><small>${Firm.data.properties.filter(p => p.branchId === b.id).length} visible properties</small></div>`).join('') || '<p class="muted">No branches created.</p>'}</div>${manager() ? `<form class="panel" onsubmit="addBranch(event)"><h3>Add branch</h3>${input('Branch name', 'name', '', 'text', true)}<div class="space"></div><button class="btn full">Create branch</button></form>` : ''}`;
}
async function addBranch(e) {
  e.preventDefault();
  try {
    await firmAction('POST', '/api/branches', {
      name: e.target.elements.namedItem('name').value
    });
    render();
    toast('Branch added');
  } catch (e) {
    toast(e.message);
  }
}
