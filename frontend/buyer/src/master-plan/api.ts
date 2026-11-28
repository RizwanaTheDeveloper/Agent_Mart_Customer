const root = 'https://gis.apcrda.org/server/rest/services/';
const plotFields = ['plot_code', 'plot_no', 'village', 'lpsvillage', 'rs_no', 'extn_sqyrd', 'area_sqm', 'lu_code', 'lu_desc', 'zoning', 'zone', 'gp_landuse', 'gp_zone', 'rd_width_m'];

export const planningLayers = [
  { id: 'plots', name: 'Plot boundaries and land use', service: 'LSP19Aug2026/MapServer', layer: 0, fields: plotFields, enabled: true },
  { id: 'roads', name: 'Master plan trunk roads', service: 'DEVELOPMENTPROMOTION/Road_Network/MapServer', layer: 8, fields: ['Rd_Name', 'Rd_Class', 'Rd_Width', 'zoning'], enabled: true },
  { id: 'boundary', name: 'Planning boundary', service: 'DEVELOPMENTPROMOTION/Road_Network/MapServer', layer: 4, fields: ['Id', 'Area'], enabled: false },
  { id: 'industrial', name: 'Industrial area', service: 'LPS_Portal/MapServer', layer: 10, fields: ['lu_desc', 'zoning', 'Category', 'FSI', 'Area_Acres'], enabled: false },
  { id: 'r5', name: 'R5 land', service: 'LPS_Portal/MapServer', layer: 11, fields: ['lu_desc', 'zoning', 'Category', 'FSI', 'Area_Acres'], enabled: false },
] as const;

export type PlanningFeature = { type: 'Feature'; properties: Record<string, string | number | null>; geometry: unknown };
export type PlanningCollection = { type: 'FeatureCollection'; features: PlanningFeature[]; exceededTransferLimit?: boolean };

export function mapImageUrl(id: string, bbox: number[], width: number, height: number) {
  const layer = planningLayers.find(item => item.id === id);
  if (!layer || bbox.length !== 4 || !bbox.every(Number.isFinite) || bbox[0] >= bbox[2] || bbox[1] >= bbox[3]) throw Error('Invalid map layer or extent.');
  if (![width, height].every(value => Number.isInteger(value) && value > 0 && value <= 1600)) throw Error('Invalid map size.');
  const parameters = new URLSearchParams({ f: 'image', bbox: bbox.join(','), bboxSR: '3857', imageSR: '3857', size: `${width},${height}`, format: 'png32', transparent: 'true', layers: `show:${layer.layer}` });
  return `${root}${layer.service}/export?${parameters}`;
}

async function sourceJson(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { signal, credentials: 'omit', redirect: 'error' });
  if (!response.ok) throw Error(`APCRDA source is unavailable (HTTP ${response.status}). Try again.`);
  const text = await response.text();
  if (text.length > 3_000_000) throw Error('The source response is too large. Narrow your search.');
  let data;
  try { data = JSON.parse(text); } catch { throw Error('APCRDA returned an unreadable response. Try again.'); }
  if (data.error) {
    if ([498, 499].includes(data.error.code)) throw Error('This APCRDA source requires authorization. No private GIS services are accessed.');
    throw Error('APCRDA could not complete this query. Try again.');
  }
  return data;
}

export async function planningRequest(input: Record<string, unknown>, signal?: AbortSignal) {
  const layer = planningLayers.find(item => item.id === input.layer);
  if (!layer) throw Error('Choose a supported planning layer.');
  const url = `${root}${layer.service}/${layer.layer}`;
  if (input.action === 'legend') {
    const data = await sourceJson(`${root}${layer.service}/legend?f=json`, signal);
    const entries = (data.layers as { layerId: number; legend: { label: string; imageData: string; contentType: string }[] }[] || []).find(item => item.layerId === layer.layer)?.legend || [];
    return { entries: entries.slice(0, 100).filter(item => item.contentType === 'image/png' && /^[A-Za-z0-9+/=]+$/.test(item.imageData) && item.imageData.length < 100000).map(item => ({ label: item.label || layer.name, image: `data:image/png;base64,${item.imageData}` })) };
  }
  let plotCode = '', partialMatch = false;
  const parameters = new URLSearchParams({ f: 'geojson', outFields: layer.fields.join(','), returnGeometry: 'true', outSR: '4326', resultRecordCount: '10' });
  if (input.action === 'plot') {
    // APCRDA plot codes are hyphenated, for example 13-535-2974-11-C18. Accept spaces, slashes, dots and underscores too.
    const code = (typeof input.code === 'string' ? input.code : '').trim().replace(/[\s/\\_.,]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase();
    if (layer.id !== 'plots' || !/^[A-Z\d-]{1,80}$/.test(code)) throw Error('Enter a plot code such as 13-535-2974-11-C18 (letters, numbers and hyphens).');
    plotCode = code;
    parameters.set('where', `UPPER(plot_code) = '${code}'`);
  } else if (input.action === 'identify') {
    const { lat, lon } = input;
    if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 85 || Math.abs(lon) > 180) throw Error('Choose valid map coordinates.');
    parameters.set('where', '1=1'); parameters.set('geometry', JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }));
    parameters.set('geometryType', 'esriGeometryPoint'); parameters.set('inSR', '4326'); parameters.set('spatialRel', 'esriSpatialRelIntersects');
  } else throw Error('Unsupported planning request.');
  let data = await sourceJson(`${url}/query?${parameters}`, signal);
  if (plotCode.length >= 4 && Array.isArray(data.features) && !data.features.length) {
    // No exact match: offer the closest plots whose code contains what was typed.
    parameters.set('where', `UPPER(plot_code) LIKE '%${plotCode}%'`);
    data = await sourceJson(`${url}/query?${parameters}`, signal);
    partialMatch = Boolean(data.features?.length);
  }
  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw Error('The source returned an unexpected map format.');
  // Project again after fetching: personal owner and registration fields never reach this view.
  const features = data.features.slice(0, 10).map((feature: PlanningFeature) => ({ type: 'Feature' as const, geometry: feature.geometry, properties: Object.fromEntries(layer.fields.map(field => {
    const value = feature.properties?.[field];
    return [field, typeof value === 'number' || typeof value === 'string' ? value : null];
  })) }));
  return { type: 'FeatureCollection' as const, features, partialMatch, exceededTransferLimit: Boolean(data.exceededTransferLimit), source: url, retrievedAt: new Date().toISOString() };
}
