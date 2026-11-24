import { STOPS_SERVICE, STOPS_FALLBACK } from './config.js';

const CACHE_KEY = 'septaBusStops.v1';
const CACHE_DAYS = 7;
const FIELDS = ['stopid', 'stopname', 'lineabbr', 'direction', 'mode', 'lat', 'lon'];

// attributes can come back in any case (stopid / StopId / STOPID).
function lowerKeys(obj) {
  const out = {};
  for (const k in obj) out[k.toLowerCase()] = obj[k];
  return out;
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'ArcGIS error');
  return data;
}

async function fetchAllRows(onProgress) {
  const info = await getJSON(`${STOPS_SERVICE}?f=json`);
  const pageSize = Math.min(info.maxRecordCount || 1000, 2000);
  const available = new Set((info.fields || []).map((f) => f.name.toLowerCase()));
  const outFields = FIELDS.filter((f) => available.size === 0 || available.has(f));
  const oidField = info.objectIdField || 'objectid';

  const countData = await getJSON(`${STOPS_SERVICE}/query?where=1%3D1&returnCountOnly=true&f=json`);
  const total = countData.count;

  const offsets = [];
  for (let o = 0; o < total; o += pageSize) offsets.push(o);

  let done = 0;
  const pages = await Promise.all(
    offsets.map(async (offset) => {
      const params = new URLSearchParams({
        where: '1=1',
        outFields: outFields.join(','),
        returnGeometry: 'true',
        outSR: '4326',
        orderByFields: oidField,
        resultOffset: offset,
        resultRecordCount: pageSize,
        f: 'json',
      });
      const data = await getJSON(`${STOPS_SERVICE}/query?${params}`);
      done += 1;
      onProgress?.(done, offsets.length);
      return data.features.map((f) => ({ ...lowerKeys(f.attributes), _geom: f.geometry }));
    }),
  );
  return pages.flat();
}

function rowsToStops(rows) {
  const isBus = (m) => /bus|trackless/i.test(m || '');
  const hasMode = rows.some((r) => r.mode);
  const busRows = hasMode ? rows.filter((r) => isBus(r.mode)) : rows;
  // if the mode labels are something unexpected, keep everything rather than show nothing.
  const use = busRows.length ? busRows : rows;

  const byId = new Map();
  for (const r of use) {
    const id = r.stopid != null ? String(Math.round(Number(r.stopid))) : null;
    const lon = r._geom?.x ?? r.lon;
    const lat = r._geom?.y ?? r.lat;
    if (!id || lon == null || lat == null) continue;
    let s = byId.get(id);
    if (!s) {
      s = { stopId: id, name: (r.stopname || '').trim(), lon, lat, routes: new Set() };
      byId.set(id, s);
    }
    if (r.lineabbr != null && r.lineabbr !== '') s.routes.add(String(r.lineabbr).trim());
  }

  const routeSort = (a, b) => {
    const na = parseInt(a, 10), nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
    return a.localeCompare(b, undefined, { numeric: true });
  };

  return {
    type: 'FeatureCollection',
    features: [...byId.values()].map((s) => ({
      type: 'Feature',
      id: Number(s.stopId),
      geometry: { type: 'Point', coordinates: [+Number(s.lon).toFixed(6), +Number(s.lat).toFixed(6)] },
      properties: {
        stopId: s.stopId,
        name: s.name || `Stop ${s.stopId}`,
        // Mapbox flattens arrays in properties, so store routes as a string.
        routes: [...s.routes].sort(routeSort).join(','),
      },
    })),
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { savedAt, data } = JSON.parse(raw);
    if (Date.now() - savedAt > CACHE_DAYS * 864e5) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    /* storage full or blocked: fine, just refetch next time */
  }
}

export async function loadStops(onProgress) {
  const cached = readCache();
  if (cached) return { geojson: cached, source: 'cache' };

  try {
    const rows = await fetchAllRows(onProgress);
    const geojson = rowsToStops(rows);
    if (!geojson.features.length) throw new Error('No stops returned');
    writeCache(geojson);
    return { geojson, source: 'service' };
  } catch (err) {
    console.warn('Stop service failed, trying local file:', err);
    const res = await fetch(STOPS_FALLBACK);
    if (!res.ok) throw new Error('Could not load SEPTA bus stops from the service or the local file.');
    return { geojson: await res.json(), source: 'file' };
  }
}

/** Run exportStops() in the console to download a local fallback copy. */
export function downloadGeoJSON(geojson, filename = 'septa_bus_stops.geojson') {
  const blob = new Blob([JSON.stringify(geojson)], { type: 'application/geo+json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
