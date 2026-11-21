import { searchPlaces } from './domain.js';
import { COORDINATE_CRS, isPhiladelphiaPoint } from './geography.js';

export const GEOCODER_URL = 'https://citygeo-geocoder-pub.databridge.phila.gov/arcgis/rest/services/Geocoders/Philly_Composite_Locator/GeocodeServer/findAddressCandidates';
const ordinal = (digits) => {
  const n = Number(digits), last = n % 100;
  return `${n}${last >= 11 && last <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th')}`;
};
function invalid(message) { const error = new Error(message); error.status = 422; throw error; }

export function parseLocationQuery(raw) {
  if (typeof raw !== 'string' || raw.trim().length < 3 || raw.length > 160 || /[<>]/.test(raw) || [...raw].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) invalid('Enter an address, intersection, or landmark in 3–160 characters.');
  let query = raw.trim().replace(/\s+/g, ' ');
  const zip = query.match(/\b(\d{5})(?:-\d{4})?\s*$/)?.[1] || '';
  if (zip) query = query.replace(/[,\s]*\d{5}(?:-\d{4})?\s*$/, '');
  query = query.replace(/[,\s]+(?:philadelphia|phila\.?)\b(?:[,\s]+(?:pa|pennsylvania)\b)?[,\s]*$/i, '').replace(/[,\s]+(?:pa|pennsylvania)\b[,\s]*$/i, '');
  query = query.replace(/\b(?:and|at)\b|[&@/]/gi, ' & ').replace(/\s+/g, ' ').trim();
  const streets = query.split(' & ');
  if (streets.length > 1) {
    if (streets.length !== 2 || streets.some((street) => !street.trim())) invalid('Enter two street names separated by & or and.');
    query = streets.map((street) => street.replace(/^\d{1,3}\b/, ordinal)).join(' & ');
  }
  if (!query || query.length > 100) invalid('Keep the street or intersection to 100 characters, plus an optional Philadelphia ZIP code.');
  return { query, zip, kind: streets.length === 2 ? 'intersection' : /^\d+[a-z]?(?:[ -]\d+)?\s+\S/i.test(query) ? 'address' : 'landmark' };
}

export function locationCandidates(data, search) {
  if (data?.error || data?.spatialReference?.wkid !== 4326 || !Array.isArray(data.candidates)) throw new Error('The location service returned an invalid coordinate reference system or response.');
  const allowed = search.kind === 'intersection' ? ['StreetInt'] : ['PointAddress', 'StreetAddress'];
  const house = search.kind === 'address' ? search.query.match(/^\d+[a-z]?/i)?.[0].toUpperCase() : null;
  const candidates = data.candidates.filter((candidate) => candidate.score >= 85 && allowed.includes(candidate.attributes?.Addr_type) && typeof candidate.address === 'string' && candidate.address.length <= 140 && isPhiladelphiaPoint([candidate.location?.x, candidate.location?.y]) && (!house || candidate.address.match(/^\d+[a-z]?/i)?.[0].toUpperCase() === house));
  candidates.sort((a, b) => b.score - a.score || allowed.indexOf(a.attributes.Addr_type) - allowed.indexOf(b.attributes.Addr_type));
  const found = new Map();
  for (const candidate of candidates) {
    const label = candidate.address.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
    const key = label.toUpperCase();
    if (!found.has(key)) found.set(key, { label, coordinates: [candidate.location.x, candidate.location.y], locationSource: 'geocoder', kind: search.kind, crs: COORDINATE_CRS });
  }
  return [...found.values()].slice(0, 5);
}

export async function searchLocations(raw, { signal, request = fetch } = {}) {
  const search = parseLocationQuery(raw);
  const local = searchPlaces(search.query).map((place) => ({ ...place, locationSource: 'catalog', kind: 'landmark', crs: COORDINATE_CRS }));
  if (search.kind === 'landmark') return { results: local, crs: COORDINATE_CRS };
  const url = new URL(GEOCODER_URL);
  url.search = new URLSearchParams({ SingleLine: search.query + (search.zip ? `, ${search.zip}` : ''), outSR: '4326', outFields: 'Match_addr,Addr_type', f: 'json' });
  try {
    const response = await request(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000), headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error('Location service unavailable.');
    return { results: locationCandidates(await response.json(), search), crs: COORDINATE_CRS };
  } catch (cause) {
    if (signal?.aborted) throw cause;
    if (local.length) return { results: local, crs: COORDINATE_CRS, warning: 'City lookup is unavailable. These are approximate local examples; check the selected point.' };
    const error = new Error('City address lookup is unavailable. Your draft is still here. Try again, enter coordinates, place a pin, or describe the place without a point.', { cause });
    error.status = 503;
    throw error;
  }
}
