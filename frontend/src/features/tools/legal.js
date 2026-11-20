// Legal checklist, notes, and identity copying.
// Browser document source; assembled in source-manifest.json order.
const PORTALS = [['CRDA plot / mutation lookup', 'https://crda.ap.gov.in/apcrdav2/Views/KnowYourPlot.aspx', 'Plot code lookup on official portal; CAPTCHA is entered there.'], ['AP encumbrance certificate search', 'https://registration.ec.ap.gov.in/ecSearch', 'Search the required property and period on the official portal.'], ['AP MeeBhoomi revenue records', 'https://meebhoomi.ap.gov.in/', 'Check revenue identifiers against your documents.'], ['AP Registration department', 'https://registration.ap.gov.in/', 'Registration information and department services.'], ['AP RERA project search', 'https://rera.ap.gov.in/RERA/Views/index.html', 'Use where RERA registration applies.']];
const CHECKS = ['Plot identity & boundaries', 'Seller authority and title documents', 'Encumbrance records', 'Revenue / mutation records', 'Land use and approvals', 'Taxes, dues and disputes', 'Independent professional review'];
function legal() {
  const p = state.listings.find(x => x.id === args.id),
    r = state.refs.find(x => x.id === args.ref),
    item = p || r,
    id = item?.id;
  const ck = state.checks[id] || {},
    done = Object.values(ck).filter(x => x === 'Reviewed').length;
  let query = args.q || '';
  const matches = query ? state.refs.filter(x => [x.code, x.village, x.survey].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0, 25) : [];
  $('app').innerHTML = `${id ? backbtn() : ''}<div class="eyebrow">IDENTITY • RECORDS • DOCUMENTS</div><h1>${t('Legal search', 'లీగల్ సెర్చ్')}</h1><p class="muted">Find plot references and open the official record searches.</p><div class="panel"><h3>Search imported CRDA references</h3><form class="searchline" onsubmit="event.preventDefault();args.q=this.q.value;legal()"><input name="q" value="${esc(query)}" placeholder="Plot code, village or survey number" aria-label="Legal reference search"><button class="btn">Search</button></form>${query ? matches.map(x => `<div class="listrow" onclick="go('ref',{id:'${x.id}'})"><strong>${esc(x.code)}</strong><small>${esc(x.village)} • survey ${esc(x.survey || 'not supplied')}</small></div>`).join('') || '<p class="muted">No cached reference matches. Use CRDA plots to fetch the plot code.</p>' : '<small>Searches only the reference records saved on this device.</small>'}</div>${item ? `<div class="panel"><h3>Identifiers for your search</h3><div class="facts">${fact('Plot code', p?.plotCode || r?.code)}${fact('Village', item.village)}${fact('Survey / subdivision', item.survey)}${fact('District / mandal', [item.district, item.mandal].filter(Boolean).join(' / '))}</div><button class="btn secondary full" style="margin-top:12px" onclick="copyIdentity()">Copy identifiers</button></div>` : ''}<div class="notice">These searches do not issue a title clearance. Official portals may require login or CAPTCHA. Complete those steps in your browser; this app does not bypass them.</div><div class="panel linklist"><h2>Official search portals</h2>${PORTALS.map(([l, u, d]) => `<a href="${u}"><strong>${esc(l)} ↗</strong><small>${esc(d)}</small></a>`).join('')}</div>${id ? `<div class="panel"><h2>My private due-diligence checklist</h2><small>${done}/${CHECKS.length} marked reviewed. This tracks your own review, not a legal verdict.</small><div class="legalprogress"><span style="width:${done / CHECKS.length * 100}%"></span></div>${CHECKS.map((l, i) => `<div class="checkitem"><label>${l}</label><select onchange="setCheck('${id}',${i},this.value)">${options(['Not started', 'Requested', 'Reviewed'], ck[i] || 'Not started')}</select></div>`).join('')}<label>Private review notes</label><textarea id="legalnote" maxlength="4000" placeholder="Document references, questions and professional-review notes">${esc(state.notes[id] || '')}</textarea><button class="btn full" style="margin-top:12px" onclick="saveNote('${id}')">Save private notes</button></div>` : `<div class="panel"><h3>Start with a property</h3><p class="muted">Open a listing or CRDA reference to see its identifiers and save a private review checklist.</p><button class="btn secondary" onclick="go('home')">Browse properties</button></div>`}`;
}
function setCheck(id, i, v) {
  (state.checks[id] ??= {})[i] = v;
  persist();
  const notes = $('legalnote')?.value;
  legal();
  if (notes !== undefined) $('legalnote').value = notes;
  toast('Checklist updated');
}
function saveNote(id) {
  state.notes[id] = $('legalnote').value;
  if (persist()) toast('Private notes saved on device');
}
function copyIdentity() {
  const p = state.listings.find(x => x.id === args.id) || state.refs.find(x => x.id === args.ref);
  if (!p) return;
  let text = `Plot: ${p.plotCode || p.code || 'Not supplied'}\nVillage: ${p.village || ''}\nSurvey: ${p.survey || ''}\nDistrict: ${p.district || ''}\nMandal: ${p.mandal || ''}`;
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('Identifiers copied')).catch(() => shareText('Property identifiers', text));else shareText('Property identifiers', text);
}
