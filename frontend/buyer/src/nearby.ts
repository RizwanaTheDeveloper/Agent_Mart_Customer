import { planningRequest } from './master-plan/api';
import { createReadCache } from './request-cache';

// Landmarks around a property, taken from OpenStreetMap through the public Overpass service.
// Public Overpass servers are tried one at a time; backups are used after a failure.
const servers = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

export const radii = [1000, 3000, 5000] as const;
export type Radius = (typeof radii)[number];

export type Place = { id: string; name: string; category: string; lat: number; lon: number; distanceM: number };

export const categories: Record<string, { label: string; icon: string }> = {
  school: { label: 'Schools', icon: 'school-outline' }, college: { label: 'Colleges', icon: 'school-outline' }, university: { label: 'Universities', icon: 'school-outline' },
  kindergarten: { label: 'Schools', icon: 'school-outline' },
  hospital: { label: 'Hospitals', icon: 'medkit-outline' }, clinic: { label: 'Clinics', icon: 'medkit-outline' }, pharmacy: { label: 'Pharmacies', icon: 'medical-outline' },
  bank: { label: 'Banks', icon: 'card-outline' }, bus_station: { label: 'Bus stations', icon: 'bus-outline' }, bus_stop: { label: 'Bus stops', icon: 'bus-outline' },
  railway_station: { label: 'Railway stations', icon: 'train-outline' }, place_of_worship: { label: 'Places of worship', icon: 'sparkles-outline' },
  marketplace: { label: 'Markets', icon: 'basket-outline' }, supermarket: { label: 'Supermarkets', icon: 'cart-outline' }, mall: { label: 'Malls', icon: 'bag-outline' },
  police: { label: 'Police stations', icon: 'shield-outline' }, fuel: { label: 'Fuel stations', icon: 'car-outline' }, park: { label: 'Parks', icon: 'leaf-outline' },
  library: { label: 'Libraries', icon: 'library-outline' }, cinema: { label: 'Cinemas', icon: 'film-outline' },
};

// Anything else that has a name is listed too, under a general heading.
const general: Record<string, { label: string; icon: string }> = {
  'x:amenity': { label: 'Other amenities', icon: 'location-outline' }, 'x:tourism': { label: 'Hotels and tourism', icon: 'bed-outline' }, 'x:historic': { label: 'Historic places', icon: 'flag-outline' },
  'x:shop': { label: 'Shops', icon: 'storefront-outline' }, 'x:leisure': { label: 'Sports and leisure', icon: 'football-outline' }, 'x:office': { label: 'Offices', icon: 'business-outline' },
  'x:food': { label: 'Restaurants and cafes', icon: 'restaurant-outline' },
};
export const categoryInfo = (key: string) => categories[key] || general[key] || general['x:amenity'];
const food = new Set(['restaurant', 'cafe', 'fast_food', 'food_court', 'bar', 'ice_cream', 'pub']);

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = (x: number) => (x * Math.PI) / 180, a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceText(meters: number) { return meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1)} km`; }

function query(lat: number, lon: number, radius: number) {
  const around = `(around:${radius},${lat},${lon})`;
  return `[out:json][timeout:25];(`
    + `nwr${around}[amenity~"^(school|college|university|kindergarten|hospital|clinic|pharmacy|bank|bus_station|place_of_worship|marketplace|police|fuel|library|cinema)$"];`
    + `node${around}[highway=bus_stop];nwr${around}[railway=station];nwr${around}[shop~"^(supermarket|mall)$"];nwr${around}[leisure=park];`
    + `nwr${around}[name][amenity];nwr${around}[name][tourism];nwr${around}[name][historic];nwr${around}[name][shop];nwr${around}[name][leisure];nwr${around}[name][office];`
    + `);out center tags 1000;`;
}

async function fromServer(server: string, body: string, signal: AbortSignal) {
  const response = await fetch(server, { method: 'POST', signal, headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: `data=${encodeURIComponent(body)}` });
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  const data = await response.json();
  // Overpass reports a busy or timed-out server in "remark" while still answering with partial or empty data.
  if (data.remark && /timed out|out of memory|too busy/i.test(String(data.remark))) throw Error('The server was too busy');
  if (!Array.isArray(data.elements)) throw Error('Unexpected response');
  return data.elements as { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[];
}

type Element = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
let preferred = 0;
const readLandmarks = createReadCache<Place[]>(5 * 60 * 1000);
const readBoundary = createReadCache<[number, number][][] | null>(5 * 60 * 1000);

// A single active request avoids broadcasting the same search to several providers.
// The overall budget keeps fallback latency bounded, including slow providers.
async function firstAnswer(body: string, outer?: AbortSignal): Promise<Element[]> {
  const order = servers.map((_, index) => servers[(index + preferred) % servers.length]);
  const deadline = Date.now() + 35000;
  let failure = 'no answer';
  for (const server of order) {
    if (outer?.aborted) throw Object.assign(Error('Cancelled'), { name: 'AbortError' });
    const remaining = deadline - Date.now(); if (remaining <= 0) break;
    const controller = new AbortController(), abort = () => controller.abort();
    outer?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, Math.min(20000, remaining));
    try {
      const elements = await fromServer(server, body, controller.signal);
      if (outer?.aborted) throw Object.assign(Error('Cancelled'), { name: 'AbortError' });
      preferred = servers.indexOf(server); return elements;
    } catch (error) {
      if (outer?.aborted) throw Object.assign(Error('Cancelled'), { name: 'AbortError' });
      failure = controller.signal.aborted ? 'timed out' : (error as Error).message;
    } finally { clearTimeout(timer); outer?.removeEventListener('abort', abort); }
  }
  throw Error(failure);
}

// Backup provider: Photon (OpenStreetMap search by Komoot). It matches on names, so it finds fewer unnamed places than Overpass.
const photonSearches: [string, string[]][] = [
  ['school', ['amenity:school', 'amenity:kindergarten']], ['college', ['amenity:college', 'amenity:university']], ['hospital', ['amenity:hospital', 'amenity:clinic']],
  ['pharmacy', ['amenity:pharmacy']], ['bank', ['amenity:bank']], ['bus', ['amenity:bus_station', 'highway:bus_stop']], ['railway station', ['railway:station']],
  ['temple', ['amenity:place_of_worship']], ['market', ['amenity:marketplace', 'shop:supermarket', 'shop:mall']], ['police', ['amenity:police']],
  ['petrol', ['amenity:fuel']], ['park', ['leisure:park']], ['library', ['amenity:library']], ['cinema', ['amenity:cinema']],
];
async function photonAround(lat: number, lon: number, radius: number, outer?: AbortSignal): Promise<Element[]> {
  const dLat = radius / 111000, dLon = radius / (111000 * Math.cos((lat * Math.PI) / 180)), box = `${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat}`;
  const controller = new AbortController(), abort = () => controller.abort();
  outer?.addEventListener('abort', abort);
  const timer = setTimeout(abort, 20000);
  try {
    const found = await Promise.all(photonSearches.map(async ([word, tags]) => {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(word)}&bbox=${box}&limit=40&lat=${lat}&lon=${lon}${tags.map(tag => '&osm_tag=' + encodeURIComponent(tag)).join('')}`;
      try { const response = await fetch(url, { signal: controller.signal }); return response.ok ? (await response.json()).features || [] : []; } catch { return []; }
    }));
    if (controller.signal.aborted && outer?.aborted) throw Object.assign(Error('Cancelled'), { name: 'AbortError' });
    const elements: Element[] = [];
    for (const feature of found.flat() as { properties: Record<string, string>; geometry: { coordinates: [number, number] } }[]) {
      const p = feature.properties, [x, y] = feature.geometry.coordinates;
      const tags: Record<string, string> = p.name ? { name: p.name } : {};
      if (p.osm_key) tags[p.osm_key] = p.osm_value;
      elements.push({ type: ({ N: 'node', W: 'way', R: 'relation' } as Record<string, string>)[p.osm_type] || 'node', id: Number(p.osm_id), lat: y, lon: x, tags });
    }
    return elements;
  } finally { clearTimeout(timer); outer?.removeEventListener('abort', abort); }
}

export async function landmarksAround(lat: number, lon: number, radius: number, outer?: AbortSignal): Promise<Place[]> {
  if (![lat, lon, radius].every(Number.isFinite) || Math.abs(lat) > 85 || Math.abs(lon) > 180 || !radii.includes(radius as Radius)) throw Error('Choose valid coordinates and a supported search radius.');
  const key = `${lat},${lon},${radius}`;
  return readLandmarks(key, signal => loadLandmarks(lat, lon, radius, signal), outer);
}

async function loadLandmarks(lat: number, lon: number, radius: number, outer?: AbortSignal): Promise<Place[]> {
  let elements: Element[];
  try { elements = await firstAnswer(query(lat, lon, radius), outer); }
  catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    // Overpass is down or busy: fall back to the Photon search service, which also serves OpenStreetMap data.
    try { elements = await photonAround(lat, lon, radius, outer); }
    catch (second) {
      if ((second as Error).name === 'AbortError') throw second;
      if (!elements!) elements = [];
    }
    if (!elements.length) throw Error(`The free map service that lists landmarks is busy or unavailable right now (${(error as Error).message}). Please try again in a minute.`);
  }
  const seen = new Set<string>(), places: Place[] = [];
  for (const element of elements) {
    const point = element.center || (element.lat !== undefined && element.lon !== undefined ? { lat: element.lat, lon: element.lon } : null), tags = element.tags || {};
    if (!point) continue;
    const category = tags.amenity || (tags.highway === 'bus_stop' ? 'bus_stop' : tags.railway === 'station' ? 'railway_station' : tags.shop || (tags.leisure === 'park' ? 'park' : ''));
    const name = tags.name || tags['name:en'] || tags['name:te'] || '';
    let kind = category;
    if (!categories[kind]) {
      if (!name) continue;
      kind = food.has(tags.amenity) ? 'x:food' : tags.amenity ? 'x:amenity' : tags.tourism ? 'x:tourism' : tags.historic ? 'x:historic' : tags.shop ? 'x:shop' : tags.leisure ? 'x:leisure' : tags.office ? 'x:office' : '';
      if (!kind) continue;
    }
    const distanceM = haversine(lat, lon, point.lat, point.lon);
    if (distanceM > radius) continue;
    const dedupe = `${kind}|${name}|${Math.round(point.lat * 2000)}|${Math.round(point.lon * 2000)}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    places.push({ id: `${element.type}/${element.id}`, name: name || `Unnamed ${categoryInfo(kind).label.replace(/s$/, '').toLowerCase()}`, category: kind, lat: point.lat, lon: point.lon, distanceM });
  }
  places.sort((a, b) => a.distanceM - b.distanceM);
  return places;
}

// The official APCRDA plot outline for a CRDA plot code, as longitude/latitude rings.
export async function plotBoundary(code: string): Promise<[number, number][][] | null> {
  const normalized = code.trim().replace(/[\s/\\_.,]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase();
  return readBoundary(normalized, signal => loadBoundary(normalized, signal));
}

async function loadBoundary(code: string, signal: AbortSignal): Promise<[number, number][][] | null> {
  const result = await planningRequest({ action: 'plot', layer: 'plots', code }, signal);
  const geometry = result.features[0]?.geometry as { type?: string; coordinates?: unknown } | undefined;
  if (!geometry?.coordinates) return null;
  const rings: [number, number][][] = [];
  if (geometry.type === 'Polygon') for (const ring of geometry.coordinates as [number, number][][]) rings.push(ring);
  else if (geometry.type === 'MultiPolygon') for (const polygon of geometry.coordinates as [number, number][][][]) for (const ring of polygon) rings.push(ring);
  return rings.length ? rings : null;
}
