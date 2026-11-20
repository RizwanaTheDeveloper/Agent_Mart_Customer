// CRDA GIS lookup, CSV import, export, and reference details.
// Browser document source; assembled in source-manifest.json order.
function crda() {
  const q = args.q || '',
    rs = state.refs.filter(r => !q || [r.code, r.village, r.survey].join(' ').toLowerCase().includes(q.toLowerCase()));
  $('app').innerHTML = `<div class="hero"><div class="eyebrow">CRDA PLOT REFERENCE DESK</div><h1>${t('Import plot data. Fill details faster.', 'CRDA ప్లాట్ వివరాలు దిగుమతి చేయండి.')}</h1><p>Plot identity, area, village and GIS boundaries. No owner IDs or private contact data imported.</p></div><div class="grid"><div class="stat"><div class="pillcount">${state.refs.length}</div><small>reference plots saved</small></div><div class="stat"><div class="pillcount">${state.imports.length}</div><small>completed import batches</small></div></div><div class="notice">Reference catalogue only. CRDA records do not imply that a plot is for sale or that a seller owns it. Dataset vintage and last import time are shown per plot.</div><div class="panel"><h2>Auto-import from official GIS</h2><p class="muted mini">Exact plot code or village search. Each batch fetches up to 100 records, with resume for more.</p><label>CRDA plot code</label><input id="syncCode" value="${esc(sync.code)}" placeholder="e.g. 13-535-2974-11-C18"><label>Or village / LPS village</label><input id="syncVillage" value="${esc(sync.village)}" placeholder="e.g. Thullur"><div class="space"></div><button id="fetchbtn" class="btn full" ${sync.busy ? 'disabled' : ''} onclick="fetchGIS(false)">${sync.busy ? 'Fetching official records…' : 'Fetch & preview plot data'}</button>${sync.auto ? '<button class="btn danger full" style="margin-top:8px" onclick="stopSync()">Stop automatic continuation</button>' : ''}${sync.offset && !sync.done ? `<button class="btn secondary full" style="margin-top:9px" onclick="fetchGIS(true)">Fetch next batch • offset ${sync.offset}</button>` : ''}<small>Source: APCRDA GIS, LSP19Aug2026 / layer 0. Layer name references Nov 2018. A recent fetch does not mean all records are current.</small><div id="syncstatus" class="tabnote">${sync.done ? 'Last search complete.' : sync.loaded ? 'Last fetch: ' + sync.loaded + ' records.' : ''}</div></div><details><summary>Import CSV / GeoJSON / ArcGIS JSON</summary><p class="mini muted">File must contain plot_code. Optional columns: village, district, mandal, rs_no, extn_sqyrd, rd_width_m, latitude, longitude. Geometry must use WGS84 (EPSG:4326).</p><input type="file" accept=".csv,.json,.geojson,text/csv,application/json" onchange="readImport(this)"><label>Or paste records</label><textarea id="importText" placeholder="plot_code,village,extn_sqyrd,latitude,longitude"></textarea><button class="btn secondary full" onclick="parseImport($('importText').value)">Preview pasted data</button><button class="btn outline full" style="margin-top:8px" onclick="shareTemplate()">Copy / share CSV template</button></details><form class="searchline" onsubmit="event.preventDefault();args.q=this.q.value;crda()"><input name="q" value="${esc(q)}" placeholder="Search saved plot codes or villages"><button class="btn" aria-label="Search saved CRDA plots">${icon('search')}</button></form><div class="row sectionhead"><h2>Imported plot references</h2><span class="count">${rs.length} results</span></div><div class="panel">${rs.slice(0, 100).map(r => `<div class="listrow" onclick="go('ref',{id:'${r.id}'})"><div class="row"><strong>${esc(r.code)}</strong><span class="tag amber">REFERENCE</span></div><small>${esc(r.village || 'Village not supplied')} • ${fmt(r.area)} sq yd</small><small>${esc(r.source)} • ${new Date(r.importedAt).toLocaleDateString('en-IN')}</small></div>`).join('') || empty('No imported plots', 'Fetch a plot code or import a file to start.')}</div>${rs.length > 100 ? '<p class="muted">Showing first 100. Refine the search to find another plot.</p>' : ''}<details><summary>Import history & data export</summary>${state.imports.slice(0, 10).map(x => `<div class="history">${esc(x.source)}<br>${x.added} added • ${x.updated} updated • ${x.rejected} rejected<br><small>${new Date(x.at).toLocaleString('en-IN')}</small></div>`).join('') || '<p class="muted">Bundled GIS snapshot is separate from user imports.</p>'}<button class="btn secondary full" onclick="exportRefs()">Share plot references as JSON</button></details><button class="btn outline full" onclick="go('about')">Source & privacy information</button>`;
}
function sqlValue(s) {
  return clean(s).replace(/'/g, "''");
}
async function fetchGIS(next) {
  if (sync.busy) return;
  const code = canonical($('syncCode')?.value ?? sync.code),
    village = clean($('syncVillage')?.value ?? sync.village);
  if (!code && !village) {
    toast('Enter a plot code or village.');
    return;
  }
  if (code && !/^\d{1,3}-\d{1,4}-\d{1,5}-\d{1,5}-[A-Z0-9]{1,8}$/.test(code)) {
    toast('Enter the exact CRDA plot code from your record.');
    return;
  }
  if (next && (sync.code !== code || sync.village !== village)) {
    toast('Filters changed. Fetch the first batch for this search.');
    return;
  }
  if (!next) {
    sync.offset = 0;
    sync.done = false;
  }
  sync.code = code;
  sync.village = village;
  sync.busy = true;
  crda();
  let where = code ? `UPPER(plot_code)='${sqlValue(code)}'` : `(UPPER(village) LIKE '%${sqlValue(village.toUpperCase()).replace(/[%_]/g, '')}%' OR UPPER(lpsvillage) LIKE '%${sqlValue(village.toUpperCase()).replace(/[%_]/g, '')}%')`;
  const params = new URLSearchParams({
    where,
    outFields: FIELDS,
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: '100',
    resultOffset: String(sync.offset),
    orderByFields: 'objectid ASC',
    f: 'json'
  });
  try {
    const abort = new AbortController(),
      tm = setTimeout(() => abort.abort(), 35000);
    let d;
    try {
      const res = await fetch('/crda-query?' + params, {
        signal: abort.signal
      });
      if (!res.ok) throw Error('Official GIS request failed');
      d = await res.json();
    } finally {
      clearTimeout(tm);
    }
    if (d.error) throw Error(d.error.message || 'GIS service rejected this request');
    if (!Array.isArray(d.features)) throw Error('Unexpected GIS response. Import a file instead.');
    sync.loaded = d.features.length;
    if (!d.features.length) {
      sync.done = true;
      sync.busy = false;
      crda();
      toast('No plot records matched this search.');
      return;
    }
    preview = prepare(d.features, 'CRDA GIS live import');
    preview.nextOffset = sync.offset + d.features.length;
    preview.complete = !d.exceededTransferLimit;
    sync.busy = false;
    if (sync.auto && sync.remaining > 0) {
      sync.remaining--;
      applyImport();
    } else {
      sync.auto = false;
      go('preview');
    }
  } catch (e) {
    sync.busy = false;
    sync.auto = false;
    crda();
    $('syncstatus').textContent = e.name === 'AbortError' ? 'Service timed out. Retry or use file import.' : e.message;
    toast('Could not complete live import. No records were changed.');
  }
}
function prepare(rows, source) {
  const records = [],
    errors = [],
    seen = new Set();
  let duplicates = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      const r = normalize(rows[i], source);
      if (seen.has(r.code)) {
        duplicates++;
        continue;
      }
      seen.add(r.code);
      records.push(r);
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e.message}`);
    }
  }
  return {
    records,
    errors,
    duplicates,
    source,
    total: rows.length,
    updated: records.filter(r => state.refs.some(x => x.code === r.code)).length
  };
}
function parseCSV(text) {
  const rows = [];
  let row = [],
    val = '',
    quote = false;
  for (let i = 0; i < text.length; i++) {
    let c = text[i];
    if (c === '"') {
      if (quote && text[i + 1] === '"') {
        val += '"';
        i++;
      } else quote = !quote;
    } else if (c === ',' && !quote) {
      row.push(val);
      val = '';
    } else if ((c === '\n' || c === '\r') && !quote) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(val);
      if (row.some(v => v.trim())) rows.push(row);
      row = [];
      val = '';
    } else val += c;
  }
  if (quote) throw Error('CSV has an unclosed quote');
  row.push(val);
  if (row.some(v => v.trim())) rows.push(row);
  if (rows.length < 2) throw Error('CSV needs a header and at least one record');
  const keys = rows.shift().map(x => x.replace(/^\uFEFF/, '').trim());
  return rows.map(r => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ''])));
}
function parseImport(text) {
  try {
    if (!text.trim()) throw Error('Paste or select a data file first');
    if (text.length > 2 * 1024 * 1024) throw Error('File is too large. Use batches below 2 MB.');
    let rows;
    if (/^[\[{]/.test(text.trim())) {
      const d = JSON.parse(text);
      rows = Array.isArray(d) ? d : d.features || d.records;
      if (!Array.isArray(rows)) throw Error('JSON must be an array or contain features/records');
      if (d.spatialReference && !['4326', 4326].includes(d.spatialReference.wkid)) throw Error('Export the file in EPSG:4326 before importing');
    } else rows = parseCSV(text);
    if (rows.length > 1000) throw Error('Use batches of at most 1,000 records');
    preview = prepare(rows, 'User file import');
    go('preview');
  } catch (e) {
    toast(e.message);
  }
}
async function readImport(el) {
  const f = el.files[0];
  if (!f) return;
  if (f.size > 2 * 1024 * 1024) {
    toast('Choose a file below 2 MB.');
    return;
  }
  try {
    parseImport(await f.text());
  } catch (e) {
    toast('Unable to read this file.');
  }
}
function previewPage() {
  if (!preview) {
    route = 'crda';
    crda();
    return;
  }
  const p = preview;
  $('app').innerHTML = `${backbtn()}<div class="eyebrow">REVIEW BEFORE IMPORT</div><h1>Plot migration preview</h1><p class="muted">${esc(p.source)}. Only whitelisted plot facts and coordinates are retained.</p><div class="grid"><div class="stat"><div class="pillcount">${p.records.length - p.updated}</div><small>new references</small></div><div class="stat"><div class="pillcount">${p.updated}</div><small>existing references to update</small></div></div><div class="notice">${p.errors.length} invalid rows • ${p.duplicates} duplicate rows skipped. No sale listings will be created. Existing property prices, contacts and private legal notes remain independent.</div><div class="panel scroll"><table class="previewtable"><thead><tr><th>Plot code</th><th>Village / area</th><th>Map</th></tr></thead><tbody>${p.records.slice(0, 30).map(r => `<tr><td>${esc(r.code)}</td><td>${esc(r.village)}<br>${fmt(r.area)} sq yd</td><td>${coords(r.lat, r.lon) ? 'Located' : 'No pin'}</td></tr>`).join('')}</tbody></table></div>${p.records.length > 30 ? '<small>Preview shows 30 rows; all valid rows in this batch will import.</small>' : ''}${p.errors.length ? `<details><summary>Rejected rows</summary><p class="mini">${p.errors.slice(0, 20).map(esc).join('<br>')}</p></details>` : ''}${p.nextOffset !== undefined && !p.complete && !sync.code ? '<div class="panel checkrow"><input type="checkbox" id="continueBatches"><label for="continueBatches">Automatically import up to four more batches for this village (500 plots maximum per run). Existing references will update.</label></div>' : ''}<button class="btn full" ${!p.records.length ? 'disabled' : ''} onclick="applyImport()">Import ${p.records.length} valid reference plots</button><button class="btn outline full" style="margin-top:10px" onclick="back()">Cancel without changes</button>`;
}
function applyImport() {
  if (!preview) return;
  if ($('continueBatches')?.checked) {
    sync.auto = true;
    sync.remaining = 4;
  }
  const p = preview;
  let index = new Map(state.refs.map(r => [r.code, r]));
  for (const r of p.records) index.set(r.code, r);
  state.refs = [...index.values()];
  state.imports.unshift({
    at: new Date().toISOString(),
    source: p.source,
    added: p.records.length - p.updated,
    updated: p.updated,
    rejected: p.errors.length
  });
  state.imports = state.imports.slice(0, 30);
  if (!persist()) return;
  if (p.nextOffset !== undefined) {
    sync.offset = p.nextOffset;
    sync.done = p.complete;
  }
  preview = null;
  route = 'crda';
  args = {};
  render();
  window.scrollTo(0, 0);
  toast('Plot reference batch imported successfully');
  if (sync.auto && !sync.done && sync.remaining > 0) setTimeout(() => {
    if (sync.auto) fetchGIS(true);
  }, 150);else sync.auto = false;
}
function shareTemplate() {
  shareText('CRDA plot CSV template', 'plot_code,village,district,mandal,rs_no,extn_sqyrd,rd_width_m,latitude,longitude\nReplace with your authorized record values; geometry must be WGS84.\nDo not include Aadhaar, owner names or phone numbers.');
}
function exportRefs() {
  const rows = state.refs.map(r => ({
    plot_code: r.code,
    village: r.village,
    district: r.district,
    mandal: r.mandal,
    rs_no: r.survey,
    extn_sqyrd: r.area,
    rd_width_m: r.road,
    latitude: r.lat,
    longitude: r.lon,
    geometry: r.rings.length ? {
      rings: r.rings
    } : undefined
  }));
  shareText('Agent Mart plot reference export', JSON.stringify({
    spatialReference: {
      wkid: 4326
    },
    records: rows
  }, null, 2));
}
function refDetail() {
  const r = state.refs.find(x => x.id === args.id);
  if (!r) {
    $('app').innerHTML = empty('Plot unavailable', 'Return to CRDA plots.');
    return;
  }
  $('app').innerHTML = `${backbtn()}<div class="refdetail"><span class="tag amber">CRDA REFERENCE • NOT A SALE OFFER</span><h1 class="break">${esc(r.code)}</h1><p>${esc(r.village || 'Village not supplied')} • ${esc(r.district)}</p><div class="price">${fmt(r.area)} <small>sq yd</small></div><small>${esc(r.landUse || 'Land use not supplied')}</small></div><div class="panel"><h2>Imported plot facts</h2><div class="facts">${fact('Plot number', r.plotNo)}${fact('Survey references', r.survey)}${fact('Township', r.township)}${fact('Colony / block', [r.colony, r.block].join(' / '))}${fact('District', r.district)}${fact('Mandal', r.mandal)}${fact('GIS area', r.areaSqm ? fmt(r.areaSqm) + ' sq m' : null)}${fact('Road width', r.road ? fmt(r.road) + ' m' : 'Not supplied / zero in source')}${fact('Zoning', r.zoning)}${fact('Data source', r.source)}</div></div><div class="panel"><h2>Plot boundary & location</h2>${coords(r.lat, r.lon) ? `<div id="refmap" class="map" style="height:320px"></div><a class="btn outline full" href="${mapsURL(r)}">Open coordinates in Google Maps</a><small>${r.rings.length ? 'Gold boundary: imported polygon.' : 'No polygon supplied; only coordinate shown.'} A GIS boundary is not a physical survey.</small>` : '<p class="muted">No WGS84 coordinates supplied. You can add a pin when creating your listing.</p>'}</div><div class="notice blue">Imported ${new Date(r.importedAt).toLocaleString('en-IN')}. ${r.source.startsWith('CRDA') ? 'Official layer: LSP19Aug2026; layer name sde.sde.LPS_Plots_Nov2018_FC.' : 'User-imported source; not independently authenticated.'} An import date does not establish present ownership, availability or title.</div><div class="row wrap"><button class="btn grow" onclick="go('edit',{ref:'${r.id}'})">Use to create property draft</button><button class="btn secondary grow" onclick="go('legal',{ref:'${r.id}'})">Legal search</button></div><p class="footertext">Only plot facts and coordinates are stored. Owner names, Aadhaar and private contact fields are excluded.</p><a class="btn outline full" href="${GIS}">View official GIS layer metadata</a>`;
  if (coords(r.lat, r.lon)) makeMap('refmap', [], [r], r.lat, r.lon, 18);
}
function aboutPage() {
  $('app').innerHTML = `${backbtn()}<div class="eyebrow">AGENT MART PROPERTY • 2.0</div><h1>Data & app information</h1><div class="panel"><h3>Focused property prototype</h3><p>Property listings, full details, street maps, legal-search tools and CRDA reference import. No farm marketplace, CRM or commission modules.</p><p class="mini muted">Properties, reference imports, saved items and checklists are stored on this device. There is no live multi-user listing backend or government certification.</p></div><div class="panel linklist"><h3>Official data sources</h3><a href="${GIS}">APCRDA GIS plot layer<small>LSP19Aug2026 / layer 0; plot_code, village, area and WGS84 geometry. Source layer name references Nov 2018.</small></a>${PORTALS.map(([l, u]) => `<a href="${u}">${l} ↗</a>`).join('')}<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors<small>Live street tiles require internet. No offline tile bulk download.</small></a></div><div class="panel"><h3>Data safeguards</h3><p class="mini">Import uses a fixed allowlist of plot attributes. Aadhaar, owner names, phone numbers and private document contents are never requested by the live connector. CSV/JSON imports also discard unknown fields.</p><p class="mini">Public GIS data is a reference, not evidence of seller authority or a clear title. Official legal portals may require login and CAPTCHA. The app opens these in your external browser.</p></div><div class="notice">Prototype signing key and package are separate from the earlier Agent Mart app. This build installs alongside it. Do not use sample listings as genuine offers.</div>`;
}
render();
function stopSync() {
  sync.auto = false;
  toast("Automatic continuation stopped");
}

// Firm workspace. Live records are held in memory; demo data has a separate store.
