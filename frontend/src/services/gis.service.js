function normalize(f, source = 'File import', date = new Date().toISOString()) {
  const a = f.attributes || f.properties || f,
    get = (...keys) => {
      for (const k of keys) {
        let v = a[k];
        if (v === undefined) {
          const key = Object.keys(a).find(x => x.toLowerCase() === k.toLowerCase());
          v = a[key];
        }
        if (v !== undefined && v !== null && v !== '') return v;
      }
      return '';
    };
  const code = canonical(get('plot_code', 'plotCode', 'plot code'));
  if (!code || !/^\d{1,3}-\d{1,4}-\d{1,5}-\d{1,5}-[A-Z0-9]{1,8}$/.test(code)) throw Error('Missing or invalid CRDA plot code');
  let rings = [];
  if (f.geometry?.rings) rings = f.geometry.rings;else if (f.geometry?.type === 'Polygon') rings = f.geometry.coordinates;else if (f.geometry?.type === 'MultiPolygon') rings = f.geometry.coordinates.flat();
  rings = rings.slice(0, 30).map(r => r.slice(0, 2000).map(p => [Number(p[0]), Number(p[1])])).filter(r => r.length >= 4 && r.every(p => coords(p[1], p[0])));
  let lat = num(get('latitude', 'lat')),
    lon = num(get('longitude', 'lon', 'lng'));
  if (!coords(lat, lon) && rings.length) {
    const r = rings[0].slice(0, -1);
    lon = r.reduce((s, p) => s + p[0], 0) / r.length;
    lat = r.reduce((s, p) => s + p[1], 0) / r.length;
  }
  if (!coords(lat, lon)) {
    lat = null;
    lon = null;
  }
  let area = num(get('extn_sqyrd', 'area_sqyd', 'areaSqYd')),
    sqm = num(get('area_sqm', 'areaSqm'));
  if (area !== null && area <= 0) area = null;
  if (sqm !== null && sqm <= 0) sqm = null;
  if (area === null && sqm !== null) area = sqm / 0.83612736;
  return {
    id: 'r' + hash(code),
    code,
    plotNo: clean(get('plot_no', 'plotNo')),
    area,
    areaSqm: sqm,
    village: clean(get('lpsvillage', 'village')),
    district: clean(get('district')),
    mandal: clean(get('mandal')),
    survey: clean(get('rs_no', 'survey')),
    landUse: clean(get('lu_desc', 'landUse')),
    zoning: clean(get('zoning')),
    road: num(get('rd_width_m', 'roadWidthM')),
    township: clean(get('township')),
    colony: clean(get('colony')),
    block: clean(get('block')),
    lat,
    lon,
    rings,
    source,
    importedAt: date
  };
}
if (!state.seeded && window.CRDA_SNAPSHOT) {
  for (const f of CRDA_SNAPSHOT.features) {
    try {
      state.refs.push(normalize(f, 'CRDA GIS snapshot', CRDA_SNAPSHOT.fetchedAt));
    } catch (e) {}
  }
  state.seeded = true;
  persist();
}
