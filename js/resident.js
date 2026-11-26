import { inFeature } from './geo.js';
import { STORE_LABELS } from './stores.js';

const AREA_ZOOM = 12;

// Store dot colors
const STATUS_COLORS = {
  fresh: '#1f7a4d',
  unknown: '#e0a526',
  none: '#8a8f96',
};

const map = L.map('map', {
  maxBounds: [[28.9, -96.4], [30.6, -94.4]],
  maxBoundsViscosity: 1.0,
  minZoom: 9,
  zoomSnap: 0.5,
}).setView([29.76, -95.37], 10);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=cb1_3qz0_1_61b592490d6544930f37ac06', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>&copy; <a href="https://carto.com/attributions">CARTO</a>',
}).addTo(map);

map.createPane('maskPane');
map.getPane('maskPane').style.zIndex = 420;
map.getPane('maskPane').style.pointerEvents = 'none';

map.createPane('storePane');
map.getPane('storePane').style.zIndex = 450;

// Once the page itself is pinch-zoomed on a phone, let pinches / drags
// on the map move the page instead, so people can zoom the page back out.
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const pageZoomed = window.visualViewport.scale > 1.01;
    for (const handler of [map.dragging, map.touchZoom]) {
      if (pageZoomed) { handler.disable(); } else { handler.enable(); }
    }
  });
}

// Panels: home + the 3 ways to contribute
const views = [...document.querySelectorAll('.view')];
let lastOption = null;

function showView(name) {
  for (const view of views) {
    view.hidden = view.id !== `view-${name}`;
  }
  if (name === 'home') {
    if (lastOption) { lastOption.focus(); }
    return;
  }
  document.getElementById(`${name}-heading`).focus();
}

for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => {
    if (button.classList.contains('option')) { lastOption = button; }
    showView(button.dataset.view);
  });
}

// About the data
const about = document.getElementById('about');
document.getElementById('about-open').addEventListener('click', () => about.showModal());
document.getElementById('about-close').addEventListener('click', () => about.close());

// Map data
const statusEl = document.getElementById('map-status');

async function getJson(path) {
  const r = await fetch(path);
  if (!r.ok) { throw new Error(`${path} returned ${r.status}`); }
  return r.json();
}

// If any file fails, say so on the map instead of leaving "Loading" up forever.
let data;
try {
  data = await Promise.all(['data/tracts.geojson', 'data/stores.geojson', 'data/harris-mask.geojson',
    'data/harris-boundary.geojson',
  ].map(getJson));
} catch (err) {
  statusEl.textContent = "The map data didn't load. Check your connection and reload the page.";
  statusEl.classList.add('is-error');
  throw err;
}
statusEl.hidden = true;
const [tracts, stores, mask, boundary] = data;

const maskRenderer = L.svg({ padding: 3, pane: 'maskPane' });

L.geoJSON(mask, {
  pane: 'maskPane',
  renderer: maskRenderer,
  interactive: false,
  style: { stroke: false, fillColor: '#e9ebe6', fillOpacity: 0.85 },
}).addTo(map);

const county = L.geoJSON(boundary, {
  pane: 'maskPane',
  renderer: maskRenderer,
  interactive: false,
  style: { color: 'rgb(18 26 22 / 45%)', weight: 1.25, fill: false },
}).addTo(map);

map.fitBounds(county.getBounds(), { padding: [8, 8] });


// Finding tracts, source: Claude Opus 5.5. 

// The box around each tract, so finding the tract a point is in only runs
// the exact test on the few tracts whose box contains the point.
function boxOf(feature) {
  const { type, coordinates } = feature.geometry;
  const polygons = type === 'Polygon' ? [coordinates] : coordinates;
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const rings of polygons) {
    for (const [lon, lat] of rings[0]) {
      box[0] = Math.min(box[0], lon);
      box[1] = Math.min(box[1], lat);
      box[2] = Math.max(box[2], lon);
      box[3] = Math.max(box[3], lat);
    }
  }
  return box;
}

const tractBoxes = tracts.features.map((feature) => ({ feature, box: boxOf(feature) }));

function tractAt(lon, lat) {
  const hit = tractBoxes.find(({ feature, box }) => lon >= box[0] && lon <= box[2] &&
    lat >= box[1] && lat <= box[3] && inFeature(lon, lat, feature));
  return hit ? hit.feature : null;
}

// Stores

// Every store starts as unknown. Residents' reports will change that once
// they are saved. The id is the store's place in the data file, which
// doesn't change, so saved reports can point back to the right store.
const storeList = stores.features.map((feature, i) => {
  const { name, addr, cat } = feature.properties;
  const [lon, lat] = feature.geometry.coordinates;
  const tract = tractAt(lon, lat);
  return {
    id: `store-${i}`,
    name,
    addr,
    cat,
    lat,
    lon,
    hood: tract ? tract.properties.hood : null,
    status: 'unknown',
  };
});

const storeRenderer = L.canvas({ pane: 'storePane' });

// Smaller dots when zoomed out, so the county view isn't a solid blob.
function dotRadius(store) {
  const zoom = map.getZoom();
  const base = zoom < 11 ? 2.5 : zoom < 13 ? 4 : 6;
  return store.cat === 'grocery' ? base + 1 : base;
}

for (const store of storeList) {
  store.marker = L.circleMarker([store.lat, store.lon], {
    renderer: storeRenderer,
    pane: 'storePane',
    radius: dotRadius(store),
    color: '#fff',
    weight: 1,
    fillColor: STATUS_COLORS[store.status],
    fillOpacity: 1,
  })
    .bindTooltip(`<b>${store.name}</b><span class="tip-type">${STORE_LABELS[store.cat]}, ${store.addr}</span>`)
    .addTo(map);
}

map.on('zoomend', () => {
  for (const store of storeList) { store.marker.setRadius(dotRadius(store)); }
});

const storesByHood = new Map();
for (const store of storeList) {
  if (store.hood) { storesByHood.set(store.hood, (storesByHood.get(store.hood) || 0) + 1); }
}

// Neighborhood search
const hoods = new Map();
for (const feature of tracts.features) {
  const { hood } = feature.properties;
  if (!hoods.has(hood)) { hoods.set(hood, []); }
  hoods.get(hood).push(feature);
}

const hoodNames = [...hoods.keys()].sort((a, b) => a.localeCompare(b));
document.getElementById('hood-list').innerHTML = hoodNames
  .map((name) => `<option value="${name}"></option>`)
  .join('');

// Exact name first, then the first name that starts with or contains the text.
function matchHood(text) {
  const q = text.trim().toLowerCase();
  if (!q) { return null; }
  return hoodNames.find((n) => n.toLowerCase() === q) ||
    hoodNames.find((n) => n.toLowerCase().startsWith(q)) ||
    hoodNames.find((n) => n.toLowerCase().includes(q)) ||
    null;
}

const searchInput = document.getElementById('search-input');
const searchMessage = document.getElementById('search-message');

document.getElementById('search').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = matchHood(searchInput.value);
  if (!name) {
    searchMessage.textContent = searchInput.value.trim()
      ? `No neighborhood matches "${searchInput.value.trim()}". Try a name from the list.`
      : '';
    return;
  }
  searchMessage.textContent = '';
  searchInput.value = name;
  const bounds = L.geoJSON({ type: 'FeatureCollection', features: hoods.get(name) }).getBounds();
  map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
});

// Name the neighborhood at the middle of the map once zoomed in
const areaName = document.getElementById('area-name');
const areaBody = document.getElementById('area-body');

function updateArea() {
  const center = map.getCenter();
  const tract = map.getZoom() >= AREA_ZOOM ? tractAt(center.lng, center.lat) : null;
  if (!tract) {
    areaName.hidden = true;
    areaBody.textContent = 'Search for your neighborhood or zoom in on the map to see what neighbors have reported.';
    return;
  }
  areaName.hidden = false;
    const { hood } = tract.properties;
  const count = storesByHood.get(hood) || 0;
  areaName.textContent = hood;
  areaBody.textContent = count
    ? `${count} ${count === 1 ? 'store' : 'stores'} that take SNAP. None logged yet. Log where you shop to add one.`
    : 'No stores that take SNAP here yet.';
}

map.on('moveend', updateArea);
updateArea();