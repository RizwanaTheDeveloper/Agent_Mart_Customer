// GPS, map geotagging, property facts, and summary approval.
// Browser document source; assembled in source-manifest.json order.
const Geo44 = {
  draft: null,
  gpsRequest: 0,
  watch: null,
  summary: null
};
const previousEditor44 = sellerEditor;
sellerEditor = function () {
  previousEditor44();
  const f = $('sellerStudio');
  if (!f) return;
  f.elements.namedItem('x_listingSchema').value = '4.4';
  const p = Market.edit || {},
    x = p.insights || {};
  Geo44.draft = {
    source: x.geoSource || (args.ref ? 'CRDA reference' : p.lat != null && p.lon != null ? 'Manual' : ''),
    accuracy: x.geoAccuracyM ?? null,
    time: x.geoCapturedAt || '',
    confirmed: x.geotagConfirmed === 'Yes'
  };
  const grid = f.elements.namedItem('lat').closest('.grid');
  grid.insertAdjacentHTML('afterend', `<div class="geopanel44"><h3>Geotag this property</h3><p class="mini muted">Use GPS only when you are at the property, or place its pin on the map. Buyers can see the saved coordinates.</p><div class="row"><button type="button" class="btn secondary grow" onclick="captureGPS44()">Use phone GPS</button><button type="button" class="btn outline grow" onclick="openGeotagMap44()">Choose / drag map pin</button></div><div id="geoStatus44" class="tabnote"></div><div id="geoPickMap44" class="map" hidden></div><div class="checkrow" style="margin-top:12px"><input id="geoConfirm44" type="checkbox" ${Geo44.draft.confirmed ? 'checked' : ''} onchange="Geo44.draft.confirmed=this.checked"><label for="geoConfirm44">I confirm this pin marks the listed property and may be shown to buyers.</label></div><small>GPS accuracy and seller confirmation do not verify legal boundaries or ownership.</small></div>`);
  for (const name of ['lat', 'lon']) f.elements.namedItem(name).addEventListener('input', () => {
    Geo44.draft = {
      source: 'Manual',
      accuracy: null,
      time: new Date().toISOString(),
      confirmed: false
    };
    $('geoConfirm44').checked = false;
    updateGeoStatus44();
  });
  updateGeoStatus44();
};
function updateGeoStatus44() {
  const f = $('sellerStudio');
  if (!f || !$('geoStatus44')) return;
  const la = f.elements.namedItem('lat').value,
    lo = f.elements.namedItem('lon').value,
    valid = coords(la, lo);
  $('geoConfirm44').required = valid;
  $('geoStatus44').textContent = valid ? `${Number(la).toFixed(7)}, ${Number(lo).toFixed(7)} · ${Geo44.draft.source || 'Manual'}${Geo44.draft.accuracy !== null ? ' · reported accuracy ±' + Math.round(Geo44.draft.accuracy) + ' m' : ''}` : 'No property pin selected. Coordinates are optional.';
}
function setGeo44(lat, lon, source, accuracy = null, time = new Date().toISOString()) {
  if (!$('sellerStudio') || !coords(lat, lon)) return;
  const f = $('sellerStudio');
  f.elements.namedItem('lat').value = Number(lat).toFixed(7);
  f.elements.namedItem('lon').value = Number(lon).toFixed(7);
  Geo44.draft = {
    source,
    accuracy,
    time,
    confirmed: false
  };
  $('geoConfirm44').checked = false;
  updateGeoStatus44();
}
function stopGPS44() {
  if (Geo44.watch !== null) {
    navigator.geolocation?.clearWatch(Geo44.watch);
    Geo44.watch = null;
  }
}
function captureGPS44() {
  if (!navigator.geolocation) {
    toast('GPS is unavailable. Choose a map pin or enter coordinates.');
    return;
  }
  stopGPS44();
  const request = ++Geo44.gpsRequest,
    form = $('sellerStudio');
  $('geoStatus44').textContent = 'Requesting phone location…';
  const done = () => {
    stopGPS44();
    clearTimeout(Geo44.timeout);
  };
  Geo44.watch = navigator.geolocation.watchPosition(position => {
    if (request !== Geo44.gpsRequest || $('sellerStudio') !== form) {
      done();
      return;
    }
    done();
    setGeo44(position.coords.latitude, position.coords.longitude, 'GPS', position.coords.accuracy, new Date(position.timestamp).toISOString());
    openGeotagMap44();
    toast('Review the GPS pin and confirm it marks the property.');
  }, error => {
    done();
    if (request !== Geo44.gpsRequest || $('sellerStudio') !== form) return;
    $('geoStatus44').textContent = error.code === 1 ? 'Location permission denied. Choose a map pin or allow location in Android settings.' : 'Location unavailable. Enable device location, retry, or choose a map pin.';
  }, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 20000
  });
  Geo44.timeout = setTimeout(() => {
    if (request === Geo44.gpsRequest) {
      done();
      if ($('sellerStudio') === form) $('geoStatus44').textContent = 'Location timed out. Retry or choose a map pin.';
    }
  }, 22000);
}
function openGeotagMap44() {
  const f = $('sellerStudio');
  if (!f) return;
  const el = $('geoPickMap44');
  el.hidden = false;
  const la = f.elements.namedItem('lat').value,
    lo = f.elements.namedItem('lon').value;
  makeMap('geoPickMap44', [], [], coords(la, lo) ? +la : 16.51, coords(la, lo) ? +lo : 80.47, 16, (lat, lon) => {
    setGeo44(lat, lon, 'Map pin');
    drawMap('geoPickMap44');
  });
  el.scrollIntoView({
    block: 'center',
    behavior: 'smooth'
  });
}
const drawBefore44 = drawMap;
drawMap = function (id) {
  drawBefore44(id);
  if (id !== 'geoPickMap44' || !$('sellerStudio')) return;
  const f = $('sellerStudio'),
    la = f.elements.namedItem('lat').value,
    lo = f.elements.namedItem('lon').value,
    m = maps[id],
    el = $(id);
  if (!coords(la, lo)) return;
  let marker = $('geoDrag44');
  if (!marker) {
    marker = document.createElement('button');
    marker.id = 'geoDrag44';
    marker.type = 'button';
    marker.className = 'geodrag44';
    marker.setAttribute('aria-label', 'Drag property pin');
    marker.innerHTML = icon('pin');
    el.appendChild(marker);
    marker.onpointerdown = e => {
      e.preventDefault();
      e.stopPropagation();
      marker.setPointerCapture(e.pointerId);
      marker.dragging = true;
    };
    marker.onpointermove = e => {
      if (!marker.dragging) return;
      e.preventDefault();
      e.stopPropagation();
      const r = el.getBoundingClientRect(),
        w = world(m.lat, m.lon, m.z),
        ll = unworld(w[0] + e.clientX - r.left - r.width / 2, w[1] + e.clientY - r.top - r.height / 2, m.z);
      setGeo44(ll[0], ll[1], 'Map pin');
      marker.style.left = e.clientX - r.left + 'px';
      marker.style.top = e.clientY - r.top + 'px';
    };
    marker.onpointerup = e => {
      e.preventDefault();
      e.stopPropagation();
      marker.dragging = false;
      drawMap(id);
    };
    marker.onpointercancel = () => marker.dragging = false;
  }
  const c = world(m.lat, m.lon, m.z),
    p = world(+la, +lo, m.z);
  marker.style.left = el.clientWidth / 2 + p[0] - c[0] + 'px';
  marker.style.top = el.clientHeight / 2 + p[1] - c[1] + 'px';
};
const saveBefore44 = saveCompleteProperty;
saveCompleteProperty = async function (e) {
  e.preventDefault();
  stopGPS44();
  Geo44.gpsRequest++;
  const f = e.target,
    valid = coords(f.elements.namedItem('lat').value, f.elements.namedItem('lon').value);
  if (valid && !$('geoConfirm44').checked) {
    toast('Confirm that the pin marks the listed property.');
    return;
  }
  for (const [key, value] of Object.entries({
    geoSource: valid ? Geo44.draft.source : '',
    geoAccuracyM: valid ? Geo44.draft.accuracy ?? '' : '',
    geoCapturedAt: valid ? Geo44.draft.time : '',
    geotagConfirmed: valid ? 'Yes' : ''
  })) {
    let input = f.elements.namedItem('x_' + key);
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'x_' + key;
      f.appendChild(input);
    }
    input.value = value;
  }
  await saveBefore44(e);
};
function summaryLang44() {
  return ['en', 'te', 'hi'].includes(Language43.code) ? Language43.code : 'en';
}
function localFacts44(p) {
  const lang = summaryLang44(),
    items = [`${p.type} · ${fmt(p.area)} ${p.unit} · ${p.village}, ${p.city}`, `${money(p.price)}${p.purpose === 'Rent' ? ' / month' : ''} · ${p.purpose}`];
  if (p.insights?.carpetArea) items.push(`${extraLabels.carpetArea}: ${fmt(p.insights.carpetArea)}`);
  items.push(lang === 'te' ? 'విక్రేత సమాచారం మాత్రమే. యాజమాన్యం, అనుమతులు, తెలియని వివరాలను పరిశీలించండి.' : lang === 'hi' ? 'केवल विक्रेता की जानकारी। स्वामित्व, अनुमोदन और अज्ञात विवरण की जांच करें।' : 'Seller facts only. Check ownership, approvals and missing details independently.');
  return items.map(x => '• ' + x).join('\n');
}
function summaryHtml44(s) {
  return `<span class="tag ${s.kind === 'ai' ? '' : 'gray'}">${s.kind === 'ai' ? 'AI-GENERATED SUMMARY' : 'LISTING-FACTS SUMMARY'}</span><p class="summarytext44">${esc(s.text)}</p><small>${s.approved ? 'Seller-approved summary' : 'Review before relying on this summary'} · ${esc(s.language || summaryLang44())}</small>`;
}
const propertyBefore44 = marketProperty;
marketProperty = async function () {
  await propertyBefore44();
  const p = Market.active,
    session = Firm.token;
  if (!['detail', 'marketProperty'].includes(route) || !p) return;
  Geo44.summary = null;
  if (!$('propertySummary44')) $('app').insertAdjacentHTML('beforeend', `<section class="panel" id="propertySummary44"><div class="row"><h2>Property summary</h2><span class="tag">${summaryLang44().toUpperCase()}</span></div><div id="summaryBody44">${summaryHtml44({
    text: localFacts44(p),
    kind: 'facts',
    language: summaryLang44(),
    approved: false
  })}</div><p class="mini muted">AI uses only supplied listing facts. It does not verify title, amenities, nearby places or future returns.</p><button class="btn secondary full" onclick="generateSummary44('${p.id}',this)">Generate AI summary</button><div id="summaryAction44"></div></section>`);
  if (coords(p.lat, p.lon) && !$('propertyGeo44')) {
    $('app').insertAdjacentHTML('beforeend', `<section class="panel" id="propertyGeo44"><h2>Property geotag</h2><div id="listingGeoMap44" class="map"></div><div class="facts">${fact('Latitude', Number(p.lat).toFixed(7))}${fact('Longitude', Number(p.lon).toFixed(7))}${fact('Geotag source', p.insights?.geoSource || 'Seller-entered coordinates')}${fact('GPS accuracy (m)', p.insights?.geoAccuracyM)}</div><p class="mini muted">A pin identifies a seller-stated location. It is not a surveyed boundary or ownership verification.</p><a class="btn outline full" href="${mapsURL(p)}">Open map / directions</a></section>`);
    makeMap('listingGeoMap44', [p], [], p.lat, p.lon, 16);
  }
  if (!Market.demo) {
    try {
      const r = await marketCall('GET', '/api/market/properties/' + p.id + '/summary?language=' + summaryLang44());
      if (Firm.token !== session || Market.active?.id !== p.id || !$('summaryBody44')) return;
      Geo44.summary = r.summary;
      $('summaryBody44').innerHTML = summaryHtml44(r.summary);
      showSummaryApproval44(p.id);
      if (!r.modelConfigured) $('summaryAction44').insertAdjacentHTML('afterbegin', '<p class="mini muted">AI service is not configured. The listing-facts summary remains available.</p>');
    } catch (e) {
      if ($('summaryAction44')) $('summaryAction44').textContent = e.message;
    }
  }
};
async function generateSummary44(id, b) {
  b.disabled = true;
  const session = Firm.token,
    lang = summaryLang44();
  try {
    let r;
    if (Market.demo) {
      r = {
        summary: {
          text: localFacts44(Market.active),
          kind: 'facts',
          language: lang,
          approved: false,
          sourceVersion: Market.active.version
        },
        notice: 'Offline demo: this summary is assembled from listing facts. No AI provider was called.'
      };
    } else r = await marketCall('POST', '/api/market/properties/' + id + '/summary', {
      language: lang
    });
    if (session !== Firm.token || Market.active?.id !== id || !$('summaryBody44')) return;
    Geo44.summary = r.summary;
    $('summaryBody44').innerHTML = summaryHtml44(r.summary);
    $('summaryAction44').textContent = r.notice || '';
    showSummaryApproval44(id);
  } catch (e) {
    toast(e.message);
  } finally {
    b.disabled = false;
  }
}
function showSummaryApproval44(id) {
  const s = Geo44.summary;
  if (!buyerSide() && sellerAdmin() && s?.id && !s.approved) $('summaryAction44').insertAdjacentHTML('beforeend', `<button class="btn outline full" onclick="approveSummary44('${id}',this)">Approve summary for buyers</button>`);
}
async function approveSummary44(id, b) {
  b.disabled = true;
  try {
    const r = await marketCall('POST', '/api/market/properties/' + id + '/summary/approve', {
      summaryId: Geo44.summary.id
    });
    Geo44.summary = r.summary;
    $('summaryBody44').innerHTML = summaryHtml44(r.summary);
    $('summaryAction44').textContent = 'Summary approved for this property version.';
  } catch (e) {
    toast(e.message);
  } finally {
    b.disabled = false;
  }
}
const renderBefore44 = render;
render = function () {
  if (route !== 'sellerEdit') {
    stopGPS44();
    Geo44.gpsRequest++;
  }
  renderBefore44();
};
for (const row of [['Geotag this property', 'ప్రాపర్టీకి జియోట్యాగ్ జోడించండి', 'संपत्ति को जियोटैग करें'], ['Use phone GPS', 'ఫోన్ GPS ఉపయోగించండి', 'फोन GPS इस्तेमाल करें'], ['Choose / drag map pin', 'మ్యాప్ పిన్ ఎంచుకోండి / జరపండి', 'नक्शे पर पिन चुनें / खींचें'], ['Property summary', 'ప్రాపర్టీ సారాంశం', 'संपत्ति सारांश'], ['Generate AI summary', 'AI సారాంశం రూపొందించండి', 'AI सारांश बनाएं'], ['Approve summary for buyers', 'కొనుగోలుదారులకు సారాంశం ఆమోదించండి', 'खरीदारों के लिए सारांश स्वीकृत करें'], ['Property geotag', 'ప్రాపర్టీ జియోట్యాగ్', 'संपत्ति जियोटैग'], ['Geotag source', 'జియోట్యాగ్ మూలం', 'जियोटैग स्रोत'], ['GPS accuracy (m)', 'GPS ఖచ్చితత్వం (మీ.)', 'GPS सटीकता (मी.)'], ['Open map / directions', 'మ్యాప్ / మార్గం తెరవండి', 'नक्शा / दिशा खोलें']]) add43(...row);

// Read-only public configuration, reporting and curated-reference access.
