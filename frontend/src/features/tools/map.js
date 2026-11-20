// Tile map rendering, markers, zoom, and coordinate selection.
// Browser document source; assembled in source-manifest.json order.
let maps = {};
function world(lat, lon, z) {
  let s = 256 * 2 ** z,
    sin = Math.sin(lat * Math.PI / 180);
  return [(lon + 180) / 360 * s, (.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s];
}
function unworld(x, y, z) {
  let s = 256 * 2 ** z;
  return [180 / Math.PI * Math.atan(Math.sinh(Math.PI * (1 - 2 * y / s))), x / s * 360 - 180];
}
function makeMap(id, listings, refs, lat = 16.51, lon = 80.47, z = 13, pick = null) {
  if (!$(id)) return;
  maps[id] = {
    id,
    listings,
    refs,
    lat,
    lon,
    z,
    pick
  };
  const el = $(id);
  el.innerHTML = '<div class="maptiles"></div><div class="mapoverlay"></div><div class="mapcontrols"><button type="button" aria-label="Zoom in" onclick="zoomMap(\'' + id + '\',1)">+</button><button type="button" aria-label="Zoom out" onclick="zoomMap(\'' + id + '\',-1)">−</button></div><div class="mapcaption">' + (pick ? 'Tap map to set a pin' : 'Drag to explore • tap a pin for details') + '</div><div class="mapcredit"><span class="mapstatus">Street tiles require internet</span><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a></div>';
  drawMap(id);
  let start = null;
  el.onpointerdown = e => {
    if (e.target.closest('button,a')) return;
    start = {
      x: e.clientX,
      y: e.clientY,
      lat: maps[id].lat,
      lon: maps[id].lon
    };
    el.setPointerCapture(e.pointerId);
  };
  el.onpointerup = e => {
    if (!start) return;
    let dx = e.clientX - start.x,
      dy = e.clientY - start.y;
    const m = maps[id];
    if (Math.abs(dx) + Math.abs(dy) > 8) {
      let w = world(start.lat, start.lon, m.z);
      [m.lat, m.lon] = unworld(w[0] - dx, w[1] - dy, m.z);
      m.lat = Math.max(-84, Math.min(84, m.lat));
      m.lon = (m.lon + 540) % 360 - 180;
      drawMap(id);
    } else if (m.pick) {
      let r = el.getBoundingClientRect(),
        w = world(m.lat, m.lon, m.z),
        ll = unworld(w[0] + e.clientX - r.left - r.width / 2, w[1] + e.clientY - r.top - r.height / 2, m.z);
      m.pick(...ll);
    }
    start = null;
  };
  el.onpointercancel = () => start = null;
}
function zoomMap(id, d) {
  let m = maps[id];
  m.z = Math.max(4, Math.min(19, m.z + d));
  drawMap(id);
}
function drawMap(id) {
  let m = maps[id],
    el = $(id);
  if (!el) return;
  const w = el.clientWidth,
    h = el.clientHeight,
    c = world(m.lat, m.lon, m.z),
    left = c[0] - w / 2,
    top = c[1] - h / 2,
    N = 2 ** m.z;
  let tiles = '';
  for (let x = Math.floor(left / 256); x <= Math.floor((left + w) / 256); x++) for (let y = Math.floor(top / 256); y <= Math.floor((top + h) / 256); y++) {
    if (y < 0 || y >= N) continue;
    tiles += `<img alt="" referrerpolicy="strict-origin-when-cross-origin" src="https://tile.openstreetmap.org/${m.z}/${(x % N + N) % N}/${y}.png" style="left:${x * 256 - left}px;top:${y * 256 - top}px" onload="this.closest('.map').querySelector('.mapstatus').textContent='Street map • zoom ${m.z}'" onerror="this.remove()">`;
  }
  el.querySelector('.maptiles').innerHTML = tiles;
  let polygons = '',
    pins = '';
  for (const r of m.refs) {
    if (r.rings?.length) {
      polygons += `<path d="${r.rings.map(ring => ring.map((p, i) => {
        let q = world(p[1], p[0], m.z);
        return `${i ? 'L' : 'M'}${q[0] - left},${q[1] - top}`;
      }).join(' ') + ' Z').join(' ')}" fill="#e8aa5350" fill-rule="evenodd" stroke="#b78234" stroke-width="2"/>`;
    }
    if (coords(r.lat, r.lon)) {
      let q = world(r.lat, r.lon, m.z);
      if (q[0] - left > -100 && q[0] - left < w + 100 && q[1] - top > -50 && q[1] - top < h + 50) pins += `<button class="refpin" aria-label="Plot ${esc(r.code)}" style="left:${q[0] - left}px;top:${q[1] - top}px" onclick="go('ref',{id:'${r.id}'})">${esc(r.code)}</button>`;
    }
  }
  for (const p of m.listings) {
    if (!coords(p.lat, p.lon)) continue;
    let q = world(p.lat, p.lon, m.z);
    if (q[0] - left > -100 && q[0] - left < w + 100 && q[1] - top > -50 && q[1] - top < h + 50) pins += `<button style="left:${q[0] - left}px;top:${q[1] - top}px" onclick="go('detail',{id:'${p.id}'})">${p.demo ? 'DEMO • ' : ''}${money(p.price)}</button>`;
  }
  if (m.pick && coords($('f_lat')?.value, $('f_lon')?.value)) {
    let q = world(+$('f_lat').value, +$('f_lon').value, m.z);
    polygons += `<circle cx="${q[0] - left}" cy="${q[1] - top}" r="9" fill="#221d76" stroke="white" stroke-width="3"/>`;
  }
  el.querySelector('.mapoverlay').innerHTML = `<svg>${polygons}</svg>${pins}`;
}
function pickMap() {
  const el = $('pickmap');
  el.hidden = false;
  const la = $('f_lat'),
    lo = $('f_lon');
  makeMap('pickmap', [], [], coords(la.value, lo.value) ? +la.value : 16.51, coords(la.value, lo.value) ? +lo.value : 80.47, 15, (lat, lon) => {
    la.value = lat.toFixed(7);
    lo.value = lon.toFixed(7);
    drawMap('pickmap');
    toast('Approximate pin selected. Verify exact boundaries independently.');
  });
  el.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}
function mapPage() {
  const mode = args.mode || 'all',
    ls = mode === 'refs' ? [] : state.listings.filter(p => p.status === 'Available'),
    rs = mode === 'listings' ? [] : state.refs;
  let focus = args.ref ? state.refs.find(r => r.id === args.ref) : null;
  if (!focus && args.id) focus = state.listings.find(p => p.id === args.id);
  const initial = focus || rs.find(r => coords(r.lat, r.lon)) || ls.find(p => coords(p.lat, p.lon));
  $('app').innerHTML = `<div class="eyebrow">PROPERTY & PLOT EXPLORER</div><h1>${t('Explore on the map', 'మ్యాప్‌లో చూడండి')}</h1><div class="chips">${[['all', 'All pins'], ['listings', 'Property listings'], ['refs', 'CRDA boundaries']].map(([x, l]) => `<button class="chip ${mode === x ? 'active' : ''}" onclick="args.mode='${x}';mapPage()">${l}</button>`).join('')}</div><div id="mainmap" class="map"></div><div class="notice blue">Teal: local property listings. Gold: imported CRDA reference plots, not sale offers. Official GIS boundaries are source information, not a ground survey.</div><div class="panel"><h3>Located records</h3><small>${ls.filter(p => coords(p.lat, p.lon)).length} listing pins • ${rs.filter(r => coords(r.lat, r.lon)).length} reference plots</small>${rs.slice(0, 15).map(r => `<div class="listrow" onclick="go('ref',{id:'${r.id}'})"><strong>${esc(r.code)}</strong><small>${esc(r.village)} • ${fmt(r.area)} sq yd</small></div>`).join('')}${ls.slice(0, 8).map(p => `<div class="listrow" onclick="go('detail',{id:'${p.id}'})"><strong>${esc(p.title)}</strong><small>${p.demo ? 'Sample • ' : ''}${esc(p.village)} • ${money(p.price)}</small></div>`).join('')}</div>`;
  makeMap('mainmap', ls, rs, initial?.lat || 16.51, initial?.lon || 80.47, focus ? 18 : 13);
}
