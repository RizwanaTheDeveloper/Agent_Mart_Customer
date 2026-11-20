// Parcel presentation layer. Existing transport, permissions and persistence stay authoritative.
const Parcel = { catalogueMode: 'grid', fileTab: 'overview' };
paths.today = 'M4 5h16v16H4ZM8 3v4M16 3v4M4 10h16M8 14h3M8 17h6';
paths.property = 'M3 21h18M5 21V9l7-6 7 6v12M9 21v-6h6v6M9 11h1M14 11h1';
paths.activity = 'M4 4h16v13H9l-5 4ZM8 8h8M8 12h5';
paths.workspace = 'M3 4h7v7H3ZM14 4h7v7h-7ZM3 15h7v6H3ZM14 15h7v6h-7Z';

function parcelHeading(kicker, title, description, action = '') {
  return `<div class="parcel-pagehead"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p class="muted">${description}</p></div>${action}</div>`;
}
function parcelMode() {
  return '';
}
function parcelRequestRows(requests, emptyTitle = 'Nothing needs your attention') {
  return requests.length ? requests.map(r => `<button class="parcel-task" onclick="go('marketThread',{id:'${esc(r.id)}'})"><span class="parcel-taskicon">${icon(r.visit ? 'pin' : 'activity')}</span><span class="parcel-taskcopy"><strong>${esc(r.propertyTitle)}</strong><small>${esc(r.visit ? 'Site visit · ' + new Date(r.visit.scheduled).toLocaleString('en-IN') : r.interestStage || 'New interest')}</small></span><span class="tag ${!buyerSide() && isFollowupDue(r) ? 'amber' : 'gray'}">${esc(!buyerSide() && isFollowupDue(r) ? 'Follow-up due' : r.status)}</span></button>`).join('') : `<div class="parcel-quiet">${icon('today')}<h3>${emptyTitle}</h3><p>Enquiries and visit updates will appear here.</p></div>`;
}
function parcelSummary(label, value, destination, hint) {
  return `<button class="parcel-summary" onclick="go('${destination}')"><span>${label}</span><strong>${value}</strong><small>${hint}</small></button>`;
}
function parcelToday() {
  const buyer = buyerSide(), requests = Market.requests || [], properties = buyer ? Market.catalog : Market.inventory;
  const active = requests.filter(r => ['Pending', 'Accepted'].includes(r.status));
  const due = requests.filter(isFollowupDue), drafts = properties.filter(p => !p.published);
  const visits = requests.filter(r => r.visit && !['Cancelled', 'Completed'].includes(r.visit.status)).sort((a, b) => new Date(a.visit.scheduled) - new Date(b.visit.scheduled));
  const firstName = (Market.user.name || 'there').split(/[\s•]/)[0];
  const saved = properties.filter(p => Market.saved.includes(p.id));
  $('app').innerHTML = `${parcelMode()}${parcelHeading(buyer ? 'YOUR PROPERTY JOURNEY' : 'YOUR BUSINESS AT A GLANCE', `A clearer view, ${esc(firstName)}.`, buyer ? 'A little closer to your next place. Pick up where you left off.' : 'Your listings, conversations and next steps. All in perspective.', `<button class="btn" onclick="${buyer ? "go('home')" : 'classicAdd()'}">${icon(buyer ? 'search' : 'plus')}${buyer ? 'Explore properties' : 'Add property'}</button>`)}
    <div class="parcel-summaries">${buyer ? parcelSummary('Your shortlist', Market.saved.length, 'saved', 'Places worth a closer look') + parcelSummary('Active conversations', active.length, 'marketRequests', 'Keep your decisions moving') + parcelSummary('Site visits', visits.length, 'parcelVisits', 'Plan your next look around') : parcelSummary('Published listings', properties.filter(p => p.published).length, 'home', '') + parcelSummary('Follow-ups due', due.length, 'marketRequests', 'Make the next conversation count') + parcelSummary('Private drafts', drafts.length, 'home', 'Review before you publish')}</div>
    <div class="parcel-dashboard"><div class="parcel-primary"><section class="parcel-section"><div class="parcel-sectionhead"><div><span class="eyebrow">${buyer ? 'KEEP THE CONVERSATION GOING' : 'PRIORITY INBOX'}</span><h2>Your next steps</h2></div><button class="textaction" onclick="go('marketRequests')">View activity</button></div>${parcelRequestRows((buyer ? active : [...due, ...active.filter(r => !due.includes(r))]).slice(0, 3))}</section>
    <section class="parcel-section"><div class="parcel-sectionhead"><div><span class="eyebrow">${buyer ? 'ROOM TO DISCOVER' : ''}</span><h2>${buyer ? saved.length ? 'From your shortlist' : 'Places to consider' : 'Recent inventory'}</h2></div><button class="textaction" onclick="go('${buyer && saved.length ? 'saved' : 'home'}')">View all</button></div><div class="cards classiccards parcel-previewcards">${(buyer && saved.length ? saved : properties).slice(0, 2).map(card).join('') || empty('A fresh start', buyer ? 'Published properties will appear here.' : 'Add your first property to begin.')}</div></section></div>
    <aside class="parcel-agenda"><section class="parcel-agendasection"><div class="eyebrow">ON THE HORIZON</div><h2>Visit agenda</h2>${visits.length ? parcelRequestRows(visits.slice(0, 3)) : `<div class="parcel-calendarart">${icon('today')}</div><h3>No visits scheduled</h3><p class="muted">${buyer ? 'Find a place you like, then arrange a visit through your enquiry.' : 'Visit proposals and confirmations appear with your buyer conversations.'}</p>`}<button class="btn outline full" onclick="go('parcelVisits')">Open visit agenda</button></section>
    <section class="parcel-research"><span class="eyebrow">LOOK A LITTLE DEEPER</span><h2>Good decisions start with good questions.</h2><p>Explore the location, review the records and understand what is still missing.</p><button class="btn secondary" onclick="go('parcelWorkspace')">Open research tools</button><div class="parcel-researchart" aria-hidden="true">${parcelArtwork('Plot')}</div></section></aside></div>
    ${!buyer ? `<section class="parcel-section"><div class="parcel-sectionhead"><h2>Workspace actions</h2></div><div class="parcel-toolgrid">${parcelTools(true)}</div></section>` : ''}`;
}
function parcelTools(firmOnly = false) {
  const tools = firmOnly ? [
    ['team', 'account', 'Team & access', 'People, invitations and responsibilities'], ['branches', 'workspace', 'Branches', 'Organize your firm locations'],
    ['reports', 'activity', 'Firm reports', 'Understand workspace performance'], ['leads', 'legal', 'Firm leads', 'Assignments and follow-up stages'],
    ['visits', 'pin', 'Firm site visits', 'Manage your team’s visit schedule'], ['activity', 'today', 'Firm activity', 'Review changes across the workspace']
  ] : [
    ['map', 'map', 'Property map', 'See the geography behind your search'], ['legal', 'legal', 'Legal checklist', 'Review records and unanswered questions'],
    ['crda', 'crda', 'CRDA references', 'Look up plot references and import data'], ['plotAI', 'search', 'Plot & area research', 'Nearby places and location context'],
    ['investment', 'activity', 'Investment scenarios', 'Explore editable future-value assumptions'], ['classicAccount', 'account', 'Account & preferences', 'Your profile, settings and security']
  ];
  return tools.map(([r, i, title, description]) => `<button class="parcel-tool" aria-label="${title}" onclick="go('${r}')"><span class="parcel-toolicon">${icon(i)}</span><strong>${title}</strong><small>${description}</small></button>`).join('');
}
function parcelWorkspace() {
  $('app').innerHTML = `${parcelHeading('A PLACE FOR THE DETAILS', 'Your workspace.', 'Research a location, review the evidence or manage your account.')}<section class="parcel-section"><h2>Research & personal tools</h2><div class="parcel-toolgrid">${parcelTools()}</div></section>${!buyerSide() ? `<section class="parcel-section"><h2>Firm management</h2><div class="parcel-toolgrid">${parcelTools(true)}</div></section>` : ''}<div class="parcel-source-note">${icon('legal')}<p>Reference data, seller statements and independently verified records are different things. Review the source and coverage of each record.</p></div>`;
}
function parcelVisits() {
  const visits = Market.requests.filter(r => r.visit).sort((a, b) => new Date(a.visit.scheduled) - new Date(b.visit.scheduled));
  $('app').innerHTML = `${parcelHeading('SEE IT FOR YOURSELF', 'Your visit agenda.', 'Open a visit to see the conversation, proposal and confirmation.')}<section class="parcel-section">${parcelRequestRows(visits, 'Your agenda is open')}</section><button class="btn" onclick="go('marketRequests')">Open all conversations</button>`;
}

// Architectural illustrations remain clearly distinguished from property photographs.
function parcelArtwork(type = 'Plot') {
  const flat = type === 'Apartment' || type === 'House';
  return `<svg viewBox="0 0 600 350" role="img" aria-label="${flat ? 'Architectural building' : 'Agent Mart plan'} illustration, not a property photograph"><defs><pattern id="parcel-grid-${flat ? 'flat' : 'land'}" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#b5b4ce" stroke-width=".6"/></pattern></defs><rect width="600" height="350" fill="${flat ? '#e8e7df' : '#dad9eb'}"/><rect width="600" height="350" fill="url(#parcel-grid-${flat ? 'flat' : 'land'})"/>${flat ? `<path d="M110 270 310 320 490 240 290 190Z" fill="#bab9d4"/><path d="M200 265V100l115-45 110 43v165l-110 43Z" fill="#f8f6ef" stroke="#605e8a"/><path d="m315 55 110 43v165l-110 43Z" fill="#b8b7d1" stroke="#605e8a"/>${[0, 1, 2, 3].map(i => `<path d="m220 ${115 + i * 34} 72-27v19l-72 27ZM337 ${96 + i * 34}l65 24v19l-65-24Z" fill="#62608e"/>`).join('')}<path d="M315 55v251M200 100l115 45 110-47" fill="none" stroke="#605e8a"/>` : `<path d="M-20 270 610 58M135 370 336-20" stroke="#eeedfb" stroke-width="35"/><path d="m253 168 158-54 75 106-156 52Z" fill="#9a98c2" stroke="#494775" stroke-width="2"/><path d="m269 174 137-46 63 84-136 45Z" fill="none" stroke="#f9f8ed" stroke-width="2" stroke-dasharray="6 5"/><path d="m411 114 68-23 76 105-69 24ZM330 272l155-52 48 66-156 52Z" fill="none" stroke="#7371a2"/><circle cx="125" cy="96" r="34" fill="#aba9d2"/><circle cx="108" cy="113" r="21" fill="#8b88be"/><circle cx="523" cy="69" r="23" fill="#aba9d2"/><path d="m366 168 0 44m-22-22h44" stroke="#484674" stroke-width="1.5"/>`}<path d="M38 42v45m-7-31 7-14 7 14" fill="none" stroke="#42406b" stroke-width="1.5"/><text x="34" y="32" fill="#42406b" font-family="sans-serif" font-size="12">N</text><path d="M460 316h100m-100-5v10m100-10v10" stroke="#605e8a"/><text x="38" y="319" fill="#42406b" font-family="sans-serif" font-size="11" letter-spacing="2">${flat ? 'BUILT PERSPECTIVES' : 'A DIFFERENT PERSPECTIVE'}</text></svg>`;
}
illustration = p => parcelArtwork(p.type);
assetArt = p => parcelArtwork(p.type);

card = function (p) {
  const saved = classicSaved().includes(p.id), compare = Market.compare.includes(p.id), seller = !buyerSide();
  return `<article class="card classiccard parcel-property"><div class="visual"><button class="parcel-coverbutton" aria-label="Open ${esc(p.title)}" onclick="go('detail',{id:'${esc(p.id)}'})">${p.photo ? `<img src="${esc(p.photo)}" alt="Seller supplied property photograph">` : parcelArtwork(p.type)}</button><span class="tag ${p.demo || Market.demo ? 'amber' : 'gray'}">${p.demo || Market.demo ? 'Fictional sample' : seller ? p.published ? 'Published' : 'Private draft' : 'Seller published'}</span>${!p.photo ? '<small>Illustration</small>' : ''}${!seller ? `<button class="savefloat ${saved ? 'is-saved' : ''}" aria-label="Save property" aria-pressed="${saved}" onclick="classicSave('${esc(p.id)}')">${icon('saved')}</button>` : ''}</div><div class="cardbody"><div class="categoryline">${esc(p.type === 'Apartment' ? 'Apartment' : p.type)} · ${esc(p.purpose)}</div><h3><button onclick="go('detail',{id:'${esc(p.id)}'})">${esc(p.title)}</button></h3><small>${icon('pin')} ${esc(p.village)}, ${esc(p.city || p.district)}</small><div class="meta"><span>${fmt(p.area)} ${esc(p.unit)}</span><span>${p.bhk ? esc(p.bhk) + ' BHK' : esc(p.facing || 'Facing not supplied')}</span></div><div class="row"><div class="price">${money(p.price)}${p.purpose === 'Rent' ? '<small> /mo</small>' : ''}</div><button class="btn secondary" onclick="go('detail',{id:'${esc(p.id)}'})">View details</button></div><div class="classiccardlinks"><button onclick="go('classicDossier',{id:'${esc(p.id)}'})">Property insights</button>${seller ? `<button onclick="go('legal',{id:'${esc(p.id)}'})">Legal checks</button>` : `<button aria-pressed="${compare}" onclick="toggleCompare('${esc(p.id)}')">${compare ? 'Selected' : 'Compare'} ${icon(compare ? 'legal' : 'plus')}</button>`}</div></div></article>`;
};

home = function () {
  if (!hasRoleAccount()) { rolesEntry(); return; }
  const buyer = buyerSide(), rows = classicRows();
  $('app').innerHTML = `${parcelMode()}${parcelHeading(buyer ? 'FIND YOUR NEXT CHAPTER' : '', buyer ? 'A place to call yours.' : 'Inventory, in perspective.', buyer ? 'Explore the possibilities. Look closer at what matters.' : 'Prepare, review and publish your property listings.', buyer ? '' : '<button class="btn" onclick="classicAdd()">' + icon('plus') + 'Add property</button>')}
    <form class="parcel-search" onsubmit="classicSearch(event)"><label class="parcel-searchfield"><span>${icon('search')} Search location or property</span><input name="q" aria-label="Search properties" value="${esc(view.q)}" placeholder="City, village, project or plot code"></label><label><span>Purpose</span><select aria-label="Purpose" onchange="setFilter('purpose',this.value)">${options(['All', 'Sale', 'Rent'], view.purpose)}</select></label><label><span>Budget up to</span><input aria-label="Maximum budget" type="number" min="0" value="${esc(view.max)}" placeholder="Any budget (INR)" onchange="setFilter('max',this.value)"></label><button class="btn" aria-label="Search">${icon('search')} Search</button></form>
    <div class="parcel-explorebar"><div class="chips">${['All', 'Plot', 'Apartment', 'House', 'Commercial', 'Farm land'].map(x => `<button class="chip ${view.type === x ? 'active' : ''}" onclick="setFilter('type','${x}')">${x === 'Apartment' ? 'Flats' : x === 'All' ? 'All property' : x}</button>`).join('')}</div><button class="textaction" onclick="view.q='';view.max='';view.type='All';view.purpose='All';home()">Clear filters</button></div>
    <div class="parcel-sectionhead"><div><h2>${buyer ? 'Explore properties' : 'Your listings'}</h2><small>${rows.length} ${Market.demo ? 'sample' : 'visible'} results${view.q ? ' for “' + esc(view.q) + '”' : ''}</small></div><div class="parcel-resultcontrols"><select class="classicsort" aria-label="Sort properties" onchange="Classic.sort=this.value;home()">${[['recent', 'Default order'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['area', 'Area by type / unit']].map(([v, l]) => `<option value="${v}" ${Classic.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select><div class="parcel-viewtoggle" aria-label="Property view"><button aria-label="Grid view" aria-pressed="${Parcel.catalogueMode === 'grid'}" onclick="Parcel.catalogueMode='grid';home()">${icon('workspace')}</button><button aria-label="List view" aria-pressed="${Parcel.catalogueMode === 'list'}" onclick="Parcel.catalogueMode='list';home()">${icon('activity')}</button><button aria-label="Map view" onclick="go('map')">${icon('map')}</button></div></div></div>
    <div class="cards classiccards ${Parcel.catalogueMode === 'list' ? 'parcel-listview' : ''}">${rows.map(card).join('') || empty('No matching properties', 'Try another location, budget or property type.')}</div>
    ${buyer && Market.compare.length ? `<div class="parcel-comparebar"><span>${Market.compare.length} of 3 properties selected</span><button class="btn" onclick="go('marketCompare')">Compare properties</button></div>` : ''}<div class="parcel-source-note">${icon('legal')}<p>Look beyond the listing. Seller facts and asking prices are not independent verification. <button class="textaction" onclick="go('parcelWorkspace')">Explore research tools</button></p></div>`;
};

const parcelSavedBefore = savedPage;
savedPage = function () {
  parcelSavedBefore();
  $('app').insertAdjacentHTML('afterbegin', '<div class="parcel-pagehead"><p class="muted">Keep your possibilities together. Compare the details before deciding.</p><button class="btn" onclick="go(\'marketCompare\')">Compare selected (' + Market.compare.length + ')</button></div>');
};

// Reuse the existing forms and handlers inside a task-oriented property file.
const parcelPropertyBefore = marketProperty;
marketProperty = async function () {
  const id = args.id;
  await parcelPropertyBefore();
  if (!['detail', 'marketProperty'].includes(route) || args.id !== id || !Market.active || !$('propertyCover')) return;
  const app = $('app'), nodes = [...app.children];
  if ($('parcel-file-tabs')) return;
  Parcel.fileTab = 'overview';
  const masthead = document.createElement('section');
  masthead.className = 'parcel-filehead';
  const cover = $('propertyCover');
  const identity = document.createElement('div');
  identity.className = 'parcel-fileidentity';
  const eyebrow = document.createElement('div');
  eyebrow.className = 'eyebrow'; eyebrow.textContent = 'PROPERTY DECISION FILE'; identity.appendChild(eyebrow);
  const tabs = document.createElement('div'); tabs.id = 'parcel-file-tabs'; tabs.className = 'parcel-filetabs';
  tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Property decision file');
  const panels = {};
  for (const [key, label] of [['overview', 'Overview'], ['location', 'Location'], ['evidence', 'Evidence'], ['activity', 'Activity']]) {
    tabs.insertAdjacentHTML('beforeend', `<button id="parcel-tab-${key}" type="button" role="tab" aria-controls="parcel-panel-${key}" aria-selected="${key === 'overview'}" onclick="parcelFileTab('${key}')">${label}</button>`);
    const panel = document.createElement('section'); panel.id = 'parcel-panel-' + key; panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', 'parcel-tab-' + key); panel.hidden = key !== 'overview'; panels[key] = panel;
  }
  let afterCover = false, bodyStarted = false;
  for (const node of nodes) {
    if (node === cover) { afterCover = true; continue; }
    if (!afterCover) continue;
    if (node.matches('.panel,.notice,.featurefacts')) bodyStarted = true;
    if (node.id === 'classicDetailActions') { panels.evidence.appendChild(node); continue; }
    if (!bodyStarted) { identity.appendChild(node); continue; }
    const title = node.querySelector('h2')?.textContent || '';
    if (title.includes('Location')) panels.location.appendChild(node);
    else if (title.includes('Ask the seller') || title.includes('Seller controls')) panels.activity.appendChild(node);
    else if (/document|Report this listing/i.test(title) || node.matches('.notice')) panels.evidence.appendChild(node);
    else panels.overview.appendChild(node);
  }
  masthead.append(cover, identity); app.insertBefore(masthead, app.querySelector('.back')?.nextSibling || app.firstChild);
  app.append(tabs, ...Object.values(panels));
  panels.evidence.insertAdjacentHTML('afterbegin', `<div class="parcel-sectionhead"><div><h2>Understand the evidence</h2><p class="muted">Seller statements, source records and missing information, kept in context.</p></div></div><button class="btn outline" onclick="go('legal',{id:'${esc(id)}'})">Open legal checklist</button>`);
  const related = Market.requests.filter(r => r.propertyId === id);
  if (related.length) panels.activity.insertAdjacentHTML('afterbegin', parcelRequestRows(related));
  scheduleLanguage43();
};
function parcelFileTab(key) {
  if (!['overview', 'location', 'evidence', 'activity'].includes(key)) return;
  Parcel.fileTab = key;
  document.querySelectorAll('#parcel-file-tabs [role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.id === 'parcel-tab-' + key)));
  document.querySelectorAll('[id^="parcel-panel-"]').forEach(p => p.hidden = p.id !== 'parcel-panel-' + key);
}

// Keep one form and every field mounted while guiding the seller through smaller steps.
const parcelEditorBefore = sellerEditor;
sellerEditor = function () {
  parcelEditorBefore();
  const form = $('sellerStudio');
  if (!form) return;
  $('app').querySelector('.formsteps43')?.remove();
  const originalPanels = [...form.children].filter(el => el.matches('.panel,details'));
  const groups = originalPanels.length === 7 ? [[0], [1], [2, 3, 4], [5, 6]] : originalPanels.map((_, i) => [i]);
  const panels = groups.map(indices => {
    const group = document.createElement('section');
    form.insertBefore(group, originalPanels[indices[0]]);
    indices.forEach(i => group.appendChild(originalPanels[i]));
    return group;
  });
  panels.forEach((el, index) => { el.dataset.parcelStep = String(index); el.id = 'parcel-editor-step-' + index; });
  const rail = document.createElement('div'); rail.className = 'parcel-editorrail'; rail.id = 'parcel-editor-rail';
  rail.setAttribute('role', 'group'); rail.setAttribute('aria-label', 'Listing steps');
  rail.innerHTML = ['Property basics', 'Location', 'Detailed facts', 'Media & review'].map((label, index) => `<button type="button" aria-controls="parcel-editor-step-${index}" onclick="parcelEditorStep(${index})"><span>${index + 1}</span>${label}</button>`).join('');
  form.before(rail);
  const footer = document.createElement('div'); footer.className = 'parcel-editorfooter'; footer.id = 'parcel-editor-footer';
  footer.innerHTML = '<button type="button" class="btn outline" onclick="parcelEditorStep(Parcel.editorStep-1)">Previous step</button><span class="muted">Your changes stay in this form until saved.</span><button type="button" class="btn" onclick="parcelEditorNext()">Continue</button>';
  form.after(footer);
  form.addEventListener('invalid', e => {
    if (form.querySelector(':invalid') !== e.target) return;
    const section = e.target.closest('[data-parcel-step]');
    if (section) parcelEditorStep(Number(section.dataset.parcelStep), false);
  }, true);
  parcelEditorStep(0, false);
};
function parcelEditorStep(index, focus = true) {
  const form = $('sellerStudio');
  if (!form) return;
  const panels = [...form.querySelectorAll('[data-parcel-step]')];
  if (index < 0 || index >= panels.length) return;
  Parcel.editorStep = index;
  panels.forEach((panel, i) => { panel.hidden = i !== index; if (i === index) panel.querySelectorAll('details').forEach(details => { details.open = true; }); });
  $('parcel-editor-rail').querySelectorAll('button').forEach((button, i) => {
    if (i === index) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
  });
  form.querySelector(':scope > button').hidden = index !== panels.length - 1;
  const buttons = $('parcel-editor-footer').querySelectorAll('button');
  buttons[0].disabled = index === 0;
  buttons[1].hidden = index === panels.length - 1;
  if (focus) {
    $('parcel-editor-rail').scrollIntoView({ block: 'start' });
    $('parcel-editor-rail').querySelectorAll('button')[index].focus({ preventScroll: true });
  }
}
function parcelEditorNext() {
  const panel = $('parcel-editor-step-' + Parcel.editorStep);
  for (const field of panel.querySelectorAll('input,select,textarea')) {
    if (!field.checkValidity()) { field.reportValidity(); return; }
  }
  parcelEditorStep(Parcel.editorStep + 1);
}
document.addEventListener('keydown', e => {
  if (!e.target.matches('#parcel-file-tabs [role="tab"]') || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const tabs = [...document.querySelectorAll('#parcel-file-tabs [role="tab"]')];
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (tabs.indexOf(e.target) + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[next].click(); tabs[next].focus();
});

const parcelRolesBefore = rolesEntry;
rolesEntry = function () {
  parcelRolesBefore();
  const welcome = $('app').querySelector('.rolewelcome');
  welcome.innerHTML = '<span class="eyebrow">THE PROPERTY DECISION WORKSPACE</span><h1>Find your place.<br><em>See the whole picture.</em></h1><p>A thoughtful space to discover property, understand the details and take your next step.</p><div class="parcel-entryart">' + parcelArtwork('Apartment') + '</div>';
  $('app').querySelector('.workspacechoices').insertAdjacentHTML('afterbegin', '<div class="parcel-choiceintro"><div class="eyebrow">MAKE YOURSELF AT HOME</div><h2>Choose your workspace</h2><p class="muted">A different perspective for every side of property.</p></div>');
};

header = function () {
  const signedIn = hasRoleAccount(), buyer = signedIn && buyerSide();
  document.body.classList.toggle('parcel-signed-in', signedIn);
  document.body.dataset.parcelRoute = route;
  document.title = 'Agent Mart · Property Workspace';
  const title = route === 'parcelToday' || route === 'sellerHome' ? 'Property' : route === 'home' ? buyer ? 'Explore' : 'Inventory' : ['saved', 'marketCompare'].includes(route) ? 'Shortlist' : ['marketRequests', 'marketThread', 'parcelVisits'].includes(route) ? 'Activity' : ['detail', 'marketProperty'].includes(route) ? 'Property file' : 'Workspace';
  $('header').innerHTML = `<button class="parcel-brand" aria-label="Agent Mart home" onclick="go('${signedIn ? 'parcelToday' : 'roleEntry'}')"><span class="mark">${icon('crda')}</span><strong>Agent Mart<span>PROPERTY, IN PERSPECTIVE</span></strong></button><div class="parcel-breadcrumb">Your workspace <span>/</span> ${signedIn ? title : 'Welcome'}</div><div class="parcel-headeractions"><button id="languageButton43" class="languagebutton43" aria-label="Choose language" onclick="chooseLanguage43()">EN</button>${signedIn ? `${!buyer ? `<button class="iconbtn" aria-label="Add property" onclick="classicAdd()">${icon('plus')}</button>` : ''}<button class="avatarbtn" aria-label="Account and firm dashboard" onclick="go('classicAccount')">${esc(Market.user.name.slice(0, 1))}</button>` : ''}</div>`;
  if (!signedIn) { $('nav').innerHTML = ''; scheduleLanguage43(); return; }
  const items = buyer ? [['parcelToday', 'property', 'Property'], ['home', 'search', 'Explore'], ['saved', 'saved', 'Shortlist'], ['marketRequests', 'activity', 'Activity'], ['parcelWorkspace', 'workspace', 'Workspace']] : [['parcelToday', 'property', 'Property'], ['home', 'home', 'Inventory'], ['marketRequests', 'activity', 'Enquiries'], ['parcelWorkspace', 'workspace', 'Workspace']];
  const active = ['parcelToday', 'sellerHome'].includes(route) ? 'parcelToday' : ['home', 'detail', 'marketProperty', 'sellerEdit', 'sellerInventory'].includes(route) ? 'home' : ['saved', 'marketCompare'].includes(route) ? 'saved' : ['marketRequests', 'marketThread', 'parcelVisits'].includes(route) ? 'marketRequests' : 'parcelWorkspace';
  $('nav').innerHTML = `<div class="parcel-navlabel">${buyer ? 'PERSONAL WORKSPACE' : 'SELLER WORKSPACE'}</div><div class="parcel-navitems">${items.map(([r, i, label]) => `<button class="${active === r ? 'active' : ''}" ${active === r ? 'aria-current="page"' : ''} aria-label="${label}" onclick="go('${r}')">${icon(i)}<span>${label}</span>${r === 'saved' && Market.saved.length ? `<small>${Market.saved.length}</small>` : ''}</button>`).join('')}</div><div class="parcel-navbottom"><button class="parcel-navaccount" onclick="go('classicAccount')">${icon('account')}<span>${esc(Market.user.name.split('•')[0].trim())}<small>${Market.demo ? 'Customer account' : buyer ? 'Buyer account' : 'Seller account'}</small></span></button></div>`;
  scheduleLanguage43();
};
const parcelRenderBefore = render;
render = function () {
  if (hasRoleAccount() && ['parcelToday', 'parcelWorkspace', 'parcelVisits', 'sellerHome'].includes(route)) {
    stopGPS44();
    Geo44.gpsRequest++;
    header();
    if (route === 'parcelWorkspace') parcelWorkspace();
    else if (route === 'parcelVisits') parcelVisits();
    else parcelToday();
    renderPlatformBanner45();
    scheduleLanguage43();
    return;
  }
  parcelRenderBefore();
};
const parcelDemoBefore = startMarketDemo;
startMarketDemo = function (side) {
  parcelDemoBefore(side);
  route = 'parcelToday'; args = {}; stack = []; render();
};
// Add translations for the new navigation while retaining the existing language engine.
[['Property', 'ఆస్తి', 'संपत्ति'], ['Explore', 'అన్వేషించండి', 'खोजें'], ['Shortlist', 'ఎంపికలు', 'चयन'], ['Activity', 'కార్యకలాపాలు', 'गतिविधि'], ['Workspace', 'కార్యస్థలం', 'कार्यक्षेत्र'], ['Inventory', 'జాబితాలు', 'सूची'], ['Enquiries', 'విచారణలు', 'पूछताछ'], ['Overview', 'అవలోకనం', 'अवलोकन'], ['Location', 'స్థానం', 'स्थान'], ['Evidence', 'ఆధారాలు', 'साक्ष्य']].forEach(row => add43(...row));
render();
