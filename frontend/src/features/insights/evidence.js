// Property evidence, nearby places, plot search, and development context.
// Browser document source; assembled in source-manifest.json order.
function readLocalProjects() {
  try {
    return JSON.parse(localStorage.getItem('insight_projects_310') || '[]');
  } catch (e) {
    return [];
  }
}
// Plot evidence and deterministic investment scenarios are separate calculations.
const Insight = {
  report: null,
  busy: false,
  category: 'all',
  question: '',
  query: '',
  radius: 3000,
  modelText: '',
  projects: readLocalProjects(),
  cache: new Map()
};
const Growth = {
  price: 5000000,
  acquisition: 0,
  holding: 0,
  selling: 0,
  inflation: 0,
  rates: [-2, 5, 8],
  result: null,
  label: 'Illustrative purchase price; enter your own figure'
};
const insightOriginal = {
  render,
  header,
  home,
  detail,
  refDetail,
  firmPage,
  morePage
};
header = function () {
  insightOriginal.header();
};
home = function () {
  insightOriginal.home();
  $('app').insertAdjacentHTML('afterbegin', `<div class="row" style="margin-bottom:16px"><button class="btn grow" onclick="go('plotAI')">Plot intelligence</button><button class="btn secondary grow" onclick="go('investment')">10-year outlook</button></div>`);
};
render = function () {
  const custom = {
    plotAI: plotAIPage,
    investment: investmentPage,
    development: developmentPage
  };
  if (custom[route]) {
    header();
    custom[route]();
    return;
  }
  insightOriginal.render();
};
firmPage = function () {
  insightOriginal.firmPage();
  const hero = $('app').querySelector('.hero');
  if (hero) hero.insertAdjacentHTML('afterend', `<div class="insightentry"><div><span class="eyebrow">NEW • PLOT INTELLIGENCE</span><h3>Know the plot. Explore the surroundings.</h3><p>Plot-code research, nearby education & services, development evidence and 10-year scenarios.</p></div><div class="row"><button class="btn grow" onclick="go('plotAI')">Search a plot</button><button class="btn secondary grow" onclick="go('investment')">10-year outlook</button></div></div>`);
};
morePage = function () {
  insightOriginal.morePage();
  $('app').insertAdjacentHTML('afterbegin', `<div class="row" style="margin-bottom:16px"><button class="btn grow" onclick="go('plotAI')">Plot intelligence</button><button class="btn secondary grow" onclick="go('investment')">Investment outlook</button></div>`);
};
detail = function () {
  insightOriginal.detail();
  const p = state.listings.find(x => x.id === args.id);
  if (p) $('app').insertAdjacentHTML('beforeend', `<div class="panel"><h2>Plot insights & investment</h2><p class="muted">Explore nearby places and development evidence, then model your own 10-year assumptions.</p><div class="row"><button class="btn grow" onclick="propertyInsight('${p.id}')">Plot intelligence</button><button class="btn secondary grow" onclick="propertyGrowth('${p.id}')">10-year outlook</button></div></div>`);
};
refDetail = function () {
  insightOriginal.refDetail();
  const r = state.refs.find(r => r.id === args.id);
  if (r) $('app').insertAdjacentHTML('beforeend', `<button class="btn full" onclick="refInsight('${r.id}')">Explore nearby schools, colleges & developments</button>`);
};
function propertyInsight(id) {
  const p = state.listings.find(x => x.id === id);
  if (p.plotCode) Insight.query = p.plotCode;else Insight.query = '';
  Insight.report = null;
  go('plotAI');
  if (!p.plotCode) toast('Enter a CRDA plot code to resolve its official location.');
}
function propertyGrowth(id) {
  const p = state.listings.find(x => x.id === id);
  Growth.price = p.purpose === 'Rent' ? 5000000 : p.price || 5000000;
  Growth.label = p.purpose === 'Rent' ? 'Rental listing does not supply a purchase price. Enter your purchase assumption.' : (p.demo ? 'Fictional sample asking price: ' : 'Seller asking price, not verified market value: ') + p.title;
  go('investment');
}
function refInsight(id) {
  const r = state.refs.find(r => r.id === id);
  Insight.query = r.code;
  Insight.report = null;
  go('plotAI');
}
function km(m) {
  return m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(2) + ' km';
}
function haversine(lat, lon, la, lo) {
  const a = lat * Math.PI / 180,
    b = la * Math.PI / 180,
    d = (la - lat) * Math.PI / 180,
    e = (lo - lon) * Math.PI / 180,
    h = Math.sin(d / 2) ** 2 + Math.cos(a) * Math.cos(b) * Math.sin(e / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
function polyCentre(g) {
  const r = g?.rings?.[0];
  if (!r?.length) return null;
  const ps = r.slice(0, -1);
  if (!ps.length) return null;
  return {
    lat: ps.reduce((s, p) => s + p[1], 0) / ps.length,
    lon: ps.reduce((s, p) => s + p[0], 0) / ps.length
  };
}
function parsePlotRequest(text) {
  const code = canonical((text.match(/\b\d{1,3}-\d{1,4}-\d{1,5}-\d{1,5}-[a-z0-9]{1,8}\b/i) || [])[0] || '');
  const m = text.match(/\b([135])\s*(?:km|kilomet)/i);
  let category = /school|పాఠశాల/i.test(text) ? 'school' : /college|university|కాలేజీ|కళాశాల/i.test(text) ? 'education' : /hospital|ఆసుపత్రి/i.test(text) ? 'health' : /bus|rail|transport|బస్/i.test(text) ? 'transport' : 'all';
  return {
    code,
    radius: m ? +m[1] * 1000 : Insight.radius,
    category
  };
}
function plotAIPage() {
  const R = Insight.report;
  $('app').innerHTML = `${backbtn()}<div class="hero"><div class="eyebrow">PLOT INTELLIGENCE • SOURCE-LED RESEARCH</div><h1>One plot code.<br>A clearer local picture.</h1><p>Plot facts, nearby places, dated development references and an editable investment outlook.</p></div><form class="panel" onsubmit="runPlotSearch(event)"><label for="plotquery">Ask about a CRDA plot</label><textarea id="plotquery" maxlength="400" rows="2" placeholder="Schools near 13-535-2974-11-C18 within 3 km">${esc(Insight.query)}</textarea><div class="row"><div class="grow"><label>Search radius</label><select id="plotradius">${[1000, 3000, 5000].map(n => `<option value="${n}" ${n === Insight.radius ? 'selected' : ''}>${n / 1000} km</option>`).join('')}</select></div><button class="btn grow" style="align-self:end" ${Insight.busy ? 'disabled' : ''}>${Insight.busy ? 'Checking sources…' : 'Find plot insights'}</button></div><small>Understands a plot code and basic category/radius words. A language-model narrative is optional and requires your configured firm server.</small></form><div id="insightstatus" class="tabnote">${Insight.busy ? 'Loading plot identity and nearby evidence. External sources can take time.' : ''}</div>${R ? renderEvidence(R) : `<div class="grid"><div class="stat"><strong>Nearby essentials</strong><small style="display:block">Schools, colleges, health & transport</small></div><div class="stat"><strong>10-year scenarios</strong><small style="display:block">Editable growth, costs & inflation</small></div></div><div class="notice blue">No purchase price or appreciation is inferred from a plot code. Market value needs reliable comparable transactions and independent checks.</div><button class="btn outline full" onclick="go('investment')">Open investment scenario calculator</button>`}`;
  if (R) renderInsightMap();
}
async function publicJSON(path, params) {
  const ac = new AbortController(),
    tm = setTimeout(() => ac.abort(), 40000);
  try {
    const res = await fetch(path + '?' + new URLSearchParams(params), {
      signal: ac.signal
    });
    if (!res.ok) throw Error('Source request failed');
    const d = await res.json();
    if (d.error) throw Error(d.error.message || 'Source unavailable');
    return d;
  } finally {
    clearTimeout(tm);
  }
}
async function localEvidence(code, radius) {
  const d = await publicJSON('/crda-query', {
    where: `UPPER(plot_code)='${code}'`,
    outFields: FIELDS,
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json',
    resultRecordCount: '2'
  });
  if (d.features?.length !== 1) throw Error('No unique plot match in the official GIS. Check the exact code.');
  const r = normalize(d.features[0], 'CRDA GIS live lookup'),
    p = {
      code: r.code,
      village: r.village,
      district: r.district,
      mandal: r.mandal,
      areaSqYd: r.area,
      roadM: r.road,
      landUse: r.landUse,
      zoning: r.zoning,
      survey: r.survey,
      lat: r.lat,
      lon: r.lon,
      rings: r.rings,
      source: GIS,
      vintage: 'Layer name refers to Nov 2018; current ownership not established'
    };
  if (!coords(p.lat, p.lon)) throw Error('Source plot has no usable location');
  const R = {
    plot: p,
    radius,
    nearby: {
      places: [],
      provider: 'Unavailable'
    },
    developments: {
      projects: []
    },
    errors: [],
    fetchedAt: new Date().toISOString(),
    distanceMethod: 'Approximate straight-line centre-to-centre distance, not road travel distance',
    modelConfigured: false
  };
  const q = `[out:json][timeout:18];(nwr(around:${radius},${p.lat},${p.lon})[amenity~"^(school|college|university|hospital|clinic|bus_station|bank)$"];node(around:${radius},${p.lat},${p.lon})[highway=bus_stop];nwr(around:${radius},${p.lat},${p.lon})[railway=station];);out center tags 150;`;
  const outcomes = await Promise.allSettled([publicJSON('/nearby-query', {
    data: q
  }), publicJSON('/development-query', {
    where: '1=1',
    geometry: p.lon + ',' + p.lat,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    distance: String(radius),
    units: 'esriSRUnit_Meter',
    outFields: 'FID,Name,Category,Zoning,Theme_City,Area_Ac',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json'
  })]);
  if (outcomes[0].status === 'fulfilled' && !outcomes[0].value.remark) {
    const data = outcomes[0].value;
    R.nearby = {
      provider: 'OpenStreetMap',
      notice: 'Community map entries. Operating status and completeness are unverified.',
      places: (data.elements || []).map(x => {
        const l = x.center || x,
          t = x.tags || {},
          cat = t.amenity || (t.highway === 'bus_stop' ? 'bus_stop' : 'railway_station');
        return {
          id: x.type + '/' + x.id,
          name: t.name || t['name:en'] || t['name:te'] || 'Unnamed mapped ' + cat,
          category: cat,
          lat: l.lat,
          lon: l.lon,
          distanceM: coords(l.lat, l.lon) ? Math.round(haversine(p.lat, p.lon, l.lat, l.lon)) : Infinity,
          source: 'OpenStreetMap',
          url: 'https://www.openstreetmap.org/' + x.type + '/' + x.id
        };
      }).filter(x => x.distanceM <= radius).sort((a, b) => a.distanceM - b.distanceM).slice(0, 100)
    };
  } else R.errors.push('Nearby map service unavailable or incomplete. This does not mean no amenities exist.');
  if (outcomes[1].status === 'fulfilled') {
    R.developments = {
      source: 'https://gis.apcrda.org/server/rest/services/LPS_Portal/MapServer/13',
      notice: 'Historical land allocations as of February 2025; not construction or operational status.',
      projects: (outcomes[1].value.features || []).map(f => {
        const a = f.attributes || {},
          c = polyCentre(f.geometry);
        return c ? {
          id: 'crda-' + a.FID,
          name: a.Name || 'Unnamed allocation',
          category: a.Category || 'Allocation',
          zoning: a.Zoning,
          lat: c.lat,
          lon: c.lon,
          distanceM: Math.round(haversine(p.lat, p.lon, c.lat, c.lon)),
          sourceDate: '2025-02',
          status: 'Allocation reference; construction/operation unknown',
          source: 'https://gis.apcrda.org/server/rest/services/LPS_Portal/MapServer/13'
        } : null;
      }).filter(x => x && x.distanceM <= radius).sort((a, b) => a.distanceM - b.distanceM).slice(0, 50)
    };
  } else R.errors.push('Official development-reference layer unavailable.');
  return R;
}
async function runPlotSearch(e) {
  e.preventDefault();
  if (Insight.busy) return;
  Insight.query = $('plotquery').value.trim();
  Insight.radius = +$('plotradius').value;
  const parsed = parsePlotRequest(Insight.query);
  if (!parsed.code) {
    toast('Include an exact CRDA plot code, for example 13-535-2974-11-C18.');
    return;
  }
  Insight.radius = parsed.radius;
  Insight.category = parsed.category;
  Insight.modelText = '';
  Insight.busy = true;
  plotAIPage();
  try {
    const key = parsed.code + '|' + Insight.radius,
      cached = Insight.cache.get(key);
    let R;
    if (cached && Date.now() - cached.at < 600000) R = cached.report;else {
      R = Firm.mode === 'live' && Firm.token ? await firmCall('POST', '/api/intelligence/search', {
        plotCode: parsed.code,
        radius: Insight.radius
      }) : await localEvidence(parsed.code, Insight.radius);
      if (R.nearby.provider !== 'Google Maps') Insight.cache.set(key, {
        at: Date.now(),
        report: R
      });
    }
    Insight.report = R;
    Insight.busy = false;
    plotAIPage();
    toast('Plot evidence report ready');
  } catch (e) {
    Insight.busy = false;
    plotAIPage();
    $('insightstatus').textContent = e.message;
    toast('Unable to complete plot lookup. No data was invented.');
  }
}
function selectedPlaces() {
  const ps = Insight.report?.nearby?.places || [],
    cat = Insight.category;
  return ps.filter(p => cat === 'all' || cat === 'school' && p.category === 'school' || cat === 'education' && ['college', 'university'].includes(p.category) || cat === 'health' && ['hospital', 'clinic'].includes(p.category) || cat === 'transport' && ['bus_stop', 'bus_station', 'train_station', 'railway_station'].includes(p.category));
}
function firmProjects() {
  const p = Insight.report?.plot;
  if (!p) return [];
  const rows = enterprise() ? Firm.data.developments || [] : Insight.projects;
  return rows.map(x => ({
    ...x,
    distanceM: Math.round(haversine(p.lat, p.lon, x.lat, x.lon))
  })).filter(x => x.distanceM <= Insight.radius).sort((a, b) => a.distanceM - b.distanceM);
}
function dataHighlights(R) {
  const p = R.plot,
    rows = [];
  rows.push(`${fmt(p.areaSqYd)} sq yd; source land use: ${p.landUse || 'not supplied'}.`);
  if (p.roadM > 0) rows.push(`Source road-width field: ${fmt(p.roadM)} metres. Current road condition has not been checked.`);else rows.push('Road-width information is missing or zero; confirm access on site.');
  const schools = R.nearby.places.filter(x => x.category === 'school'),
    education = R.nearby.places.filter(x => ['college', 'university'].includes(x.category));
  if (R.nearby.provider !== 'Unavailable') {
    rows.push(`${schools.length} school and ${education.length} college/university map entries returned within ${R.radius / 1000} km. Results are capped and may be incomplete.`);
    if (schools[0]) rows.push(`Nearest returned school entry: ${schools[0].name}, approximately ${km(schools[0].distanceM)} straight-line.`);
  } else rows.push('Nearby place coverage could not be checked; do not interpret this as an absence of schools or services.');
  rows.push(`${R.developments.projects.length} historical allocation references returned nearby; their development and operating status is unknown.`);
  rows.push('Legal title, comparable transaction prices, access rights, flood/drainage conditions and project progress still require independent verification.');
  return rows;
}
function renderEvidence(R) {
  const p = R.plot,
    ps = selectedPlaces(),
    fp = firmProjects();
  return `<div class="refdetail"><span class="tag">OFFICIAL PLOT IDENTITY • NO PRICE FORECAST</span><h1>${esc(p.code)}</h1><p>${esc(p.village)} • ${esc(p.district)}</p><div class="price">${fmt(p.areaSqYd)} <small>sq yd</small></div><small>${esc(p.landUse || 'Land use not supplied')}</small></div><div class="panel"><h2>Data-based plot highlights</h2>${R.nearby.provider === 'Google Maps' ? '<p class="googlecredit" translate="no">Google Maps</p>' : ''}<ul class="insightlist">${dataHighlights(R).map(x => `<li>${esc(x)}</li>`).join('')}</ul><small>Generated from returned fields and explicit rules, not an independent valuation or an AI forecast.</small></div>${R.errors.map(x => `<div class="notice">${esc(x)}</div>`).join('')}<div id="insightmap" class="map"></div><p class="mini muted">${esc(R.distanceMethod)}. Pins are representative map locations; not road distances or verified entrances. Google Places results are listed separately and are not plotted on this OpenStreetMap base.</p><div class="panel"><h2>Nearby places</h2><div class="chips">${[['all', 'All'], ['school', 'Schools'], ['education', 'Colleges'], ['health', 'Health'], ['transport', 'Transport']].map(([c, l]) => `<button class="chip ${Insight.category === c ? 'active' : ''}" onclick="Insight.category='${c}';plotAIPage()">${l}</button>`).join('')}</div><small>${esc(R.nearby.provider)} • ${esc(R.nearby.notice || 'Availability unknown')}</small>${R.nearby.provider === 'Google Maps' ? '<p class="googlecredit" translate="no">Google Maps</p>' : ''}${ps.slice(0, 30).map(x => `<div class="placeitem"><div class="row"><strong>${esc(x.name)}</strong><span class="tag">${km(x.distanceM)}</span></div><small>${esc(x.category.replaceAll('_', ' '))} • ${esc(x.source)}</small><div class="row"><a href="${esc(x.url)}">Source entry ↗</a><a href="https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lon}">Road route ↗</a></div>${(x.attributions || []).map(a => `<small>${esc(a.provider || '')}${a.providerUri ? ' ' + esc(a.providerUri) : ''}</small>`).join('')}</div>`).join('') || '<p class="muted">No matching places were returned. Coverage may be incomplete.</p>'}<div class="row wrap">${['schools', 'colleges', 'hospitals'].map(q => `<a class="btn outline grow" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q + ' near ' + p.lat + ',' + p.lon)}">Find ${q} on Maps</a>`).join('')}</div></div><div class="panel"><h2>Nearby development evidence</h2><div class="notice">CRDA layer: February 2025 land allocations. These are not verified upcoming projects, construction progress or operating campuses.</div>${R.developments.projects.slice(0, 18).map(x => `<div class="placeitem"><div class="row"><strong>${esc(x.name)}</strong><span class="tag amber">${km(x.distanceM)}</span></div><small>${esc(x.category)} • ${esc(x.sourceDate)} reference</small><p class="mini">${esc(x.status)}</p><a href="${esc(x.source)}">Official layer metadata ↗</a></div>`).join('') || '<p class="muted">No nearby allocation references returned. This is not evidence that no development exists.</p>'}<h3 style="margin-top:22px">Firm / user sourced project updates</h3>${fp.map(x => `<div class="placeitem"><strong>${esc(x.title)}</strong><div class="row"><span class="tag">${esc(x.status)}</span><small>${km(x.distanceM)}</small></div><small>User/firm claim; not independently verified. Source date: ${esc(x.sourceDate || 'not supplied')}</small><p class="mini">${esc(x.note || '')}</p><a href="${esc(x.sourceUrl)}">Read source evidence ↗</a></div>`).join('') || '<p class="muted">No dated project updates have been added for this area.</p>'}<button class="btn secondary full" onclick="go('development')">Add a sourced development update</button></div><div class="panel"><h2>Optional AI narrative</h2><p class="mini muted">A configured firm AI service can explain the evidence. It does not calculate market value or predict appreciation.</p>${Insight.modelText ? `<div class="ainarrative">${esc(Insight.modelText).replace(/\n/g, '<br>')}</div>` : ''}<button class="btn outline full" onclick="requestNarrative(this)">Explain these sources with AI</button></div><div class="row wrap"><button class="btn grow" onclick="go('investment')">10-year investment scenarios</button><button class="btn secondary grow" onclick="shareInsights()">Share source summary</button></div><p class="footertext">Checked ${new Date(R.fetchedAt).toLocaleString('en-IN')}. ${esc(p.vintage)}. A refresh date does not verify present ownership, project completion or school quality.</p>`;
}
function renderInsightMap() {
  const R = Insight.report,
    el = $('insightmap');
  if (!R || !el) return;
  const p = R.plot,
    ref = {
      ...p,
      id: 'insightPlot',
      code: p.code
    };
  makeMap('insightmap', [], [ref], p.lat, p.lon, R.radius === 1000 ? 14 : R.radius === 3000 ? 13 : 12);
  maps.insightmap.insightReport = R;
  drawMap('insightmap');
}
const insightBaseDraw = drawMap;
drawMap = function (id) {
  insightBaseDraw(id);
  const m = maps[id],
    R = m?.insightReport,
    el = $(id);
  if (!R || !el) return;
  const box = el.getBoundingClientRect(),
    c = world(m.lat, m.lon, m.z),
    left = c[0] - box.width / 2,
    top = c[1] - box.height / 2;
  for (const x of (R.nearby.provider === 'Google Maps' ? [] : R.nearby.places).slice(0, 30)) {
    const q = world(x.lat, x.lon, m.z);
    if (q[0] - left < 0 || q[0] - left > box.width || q[1] - top < 0 || q[1] - top > box.height) continue;
    const dot = document.createElement('a');
    dot.className = 'poidot';
    dot.style.left = q[0] - left + 'px';
    dot.style.top = q[1] - top + 'px';
    dot.title = x.name;
    dot.textContent = ['school', 'college', 'university'].includes(x.category) ? 'E' : ['hospital', 'clinic'].includes(x.category) ? 'H' : 'T';
    dot.href = x.url;
    el.querySelector('.mapoverlay').appendChild(dot);
  }
  for (const x of [...R.developments.projects, ...firmProjects()].slice(0, 25)) {
    const q = world(x.lat, x.lon, m.z);
    if (q[0] - left < 0 || q[0] - left > box.width || q[1] - top < 0 || q[1] - top > box.height) continue;
    const a = document.createElement('a');
    a.className = 'poidot devdot';
    a.style.left = q[0] - left + 'px';
    a.style.top = q[1] - top + 'px';
    a.textContent = 'D';
    a.title = x.name || x.title;
    a.href = x.sourceUrl || x.source;
    el.querySelector('.mapoverlay').appendChild(a);
  }
  el.querySelector('.refpin')?.removeAttribute('onclick');
};
async function requestNarrative(b) {
  if (!Insight.report) return;
  if (Firm.mode !== 'live' || !Firm.token) {
    toast('Connect a deployed firm backend with an AI model configured. Data-based highlights already work.');
    return;
  }
  b.disabled = true;
  b.textContent = 'Generating source-grounded explanation…';
  try {
    const r = await firmCall('POST', '/api/intelligence/narrative', {
      plotCode: Insight.report.plot.code,
      radius: Insight.radius,
      question: Insight.query
    });
    Insight.modelText = r.enabled ? r.text : r.text + ' No AI narrative was generated.';
    plotAIPage();
  } catch (e) {
    toast(e.message);
    b.disabled = false;
    b.textContent = 'Explain these sources with AI';
  }
}
function shareInsights() {
  const R = Insight.report;
  if (!R) return;
  shareText('Plot source summary', `Plot ${R.plot.code}\n${R.plot.village}\n${dataHighlights(R).map(x => x.replace(/<[^>]+>/g, '')).join('\n')}\nSources: ${R.plot.source}\n${R.developments.source || ''}\nMap data: ${R.nearby.provider}\nChecked: ${R.fetchedAt}\nDistances are approximate straight-line distances. No valuation, return forecast or title verification is provided.`);
}
function developmentPage() {
  $('app').innerHTML = `${backbtn()}<div class="eyebrow">DATED PROJECT EVIDENCE</div><h1>Add development update</h1><div class="notice blue">Record a source and its date. The chosen status is a user/firm claim and will not be labelled independently verified.</div>${enterprise() && !manager() ? '<div class="notice">A manager must add shared development updates.</div>' : `<form class="panel" onsubmit="saveDevelopment(event)">${input('Project title', 'title', '', 'text', true)}<div class="grid">${input('Latitude', 'lat', Insight.report?.plot.lat, 'number', true, 'step="any" min="-85" max="85"')}${input('Longitude', 'lon', Insight.report?.plot.lon, 'number', true, 'step="any" min="-180" max="180"')}</div>${select('Status stated in your source', 'status', ['Proposed', 'Approved', 'Tendered', 'Under construction', 'Operational', 'Unknown'], 'Unknown')}${input('HTTPS evidence URL', 'sourceUrl', '', 'url', true)}${input('Source publication date', 'sourceDate', '', 'date', true)}<label>Evidence notes</label><textarea name="note" maxlength="1000"></textarea><div class="space"></div><button class="btn full">Save ${Firm.mode === 'live' ? 'shared' : 'local'} source record</button></form>`}`;
}
async function saveDevelopment(e) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  d.lat = +d.lat;
  d.lon = +d.lon;
  try {
    const u = new URL(d.sourceUrl);
    if (u.protocol !== 'https:' || u.username || u.password) throw Error('Use an HTTPS source URL without credentials.');
    d.sourceUrl = u.href;
    if (!coords(d.lat, d.lon)) throw Error('Enter valid coordinates');
    if (Firm.mode === 'live' && Firm.token) {
      await firmAction('POST', '/api/developments', d);
    } else {
      d.id = uid('dev');
      d.checkedAt = new Date().toISOString();
      if (Firm.mode === 'demo') {
        Firm.data.developments = Firm.data.developments || [];
        Firm.data.developments.push(d);
        saveDemo();
      } else {
        Insight.projects.push(d);
        localStorage.setItem('insight_projects_310', JSON.stringify(Insight.projects));
      }
    }
    toast('Source record added; status remains a user claim');
    go('plotAI');
  } catch (e) {
    toast(e.message);
  }
}
