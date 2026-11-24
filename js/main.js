import { MAPBOX_TOKEN, START_VIEW, JUMPS } from './config.js';
import { BUS_ICON_SVG, svgToImage, SEPTA_RED, SEPTA_BLACK } from './icons.js';
import { loadStops, downloadGeoJSON } from './stops.js';
import { initStore, addSuggestion } from './store.js';

const $ = (sel) => document.querySelector(sel);

const UPGRADE_LABELS = {
  roof: 'Roof / shelter',
  bench: 'Bench',
  led: 'LED lights',
  info: 'Info case / route map',
};

const state = {
  stopsGeojson: null,
  stopsById: new Map(),
  suggestions: [],
  selected: null, // { stopId, name, routes, lng, lat }
  submittedThisVisit: [],
};

/* panel */
const PANELS = ['intro', 'form', 'thanks', 'pick', 'done'];
function showPanel(name) {
  for (const p of PANELS) $(`#panel-${p}`).hidden = p !== name;
  $('#panel').scrollTop = 0;
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2600);
}

function setStatus(msg, isError = false) {
  const el = $('#map-status');
  el.textContent = msg || '';
  el.classList.toggle('error', isError);
}

/* map */
if (!MAPBOX_TOKEN || MAPBOX_TOKEN.startsWith('YOUR_')) {
  setStatus('Add your Mapbox public token in js/config.js to load the map.', true);
  throw new Error('Missing Mapbox token');
}
mapboxgl.accessToken = MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: START_VIEW.center,
  zoom: START_VIEW.zoom,
  minZoom: 8.5,
  maxBounds: [[-76.4, 39.5], [-74.3, 40.7]],
});

map.addControl(
  new MapboxGeocoder({
    accessToken: MAPBOX_TOKEN,
    mapboxgl,
    marker: false,
    placeholder: 'Search an address or place',
    bbox: [-76.1, 39.7, -74.6, 40.45],
    proximity: { longitude: -75.1635, latitude: 39.9526 },
    countries: 'us',
    zoom: 16,
  }),
  'top-left',
);
map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');
map.addControl(
  new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, fitBoundsOptions: { maxZoom: 16 } }),
  'top-left',
);


function paintBlueWhite() {
  const WATER = '#1d4f91';
  const LAND = '#ffffff';
  const GREEN = '#eef4fb';
  const BUILDING = '#e3ecf7';
  const ROAD = '#c9dbf1';
  const ROAD_MAJOR = '#9dbde6';
  const LABEL = '#1b3a6b';

  const set = (id, prop, val) => {
    try { map.setPaintProperty(id, prop, val); } catch { /* property not on this layer */ }
  };

  for (const layer of map.getStyle().layers) {
    const id = layer.id;
    if (/poi-label|transit-label|airport-label/.test(id)) {
      map.setLayoutProperty(id, 'visibility', 'none'); // keep the map about SEPTA stops
      continue;
    }
    switch (layer.type) {
      case 'background':
        set(id, 'background-color', LAND);
        break;
      case 'fill':
        if (/water/.test(id)) set(id, 'fill-color', WATER);
        else if (/building/.test(id)) set(id, 'fill-color', BUILDING);
        else if (/land|park|national|pitch|golf|cemetery|hillshade/.test(id)) set(id, 'fill-color', GREEN);
        break;
      case 'line':
        if (/water/.test(id)) set(id, 'line-color', WATER);
        else if (/motorway|trunk|primary/.test(id)) set(id, 'line-color', ROAD_MAJOR);
        else if (/road|street|bridge|tunnel|path|rail/.test(id)) set(id, 'line-color', ROAD);
        else if (/admin|boundary/.test(id)) set(id, 'line-color', '#8fb0dc');
        break;
      case 'symbol':
        if (/water/.test(id)) {
          set(id, 'text-color', '#ffffff');
          set(id, 'text-halo-color', WATER);
        } else {
          set(id, 'text-color', LABEL);
          set(id, 'text-halo-color', '#ffffff');
        }
        break;
    }
  }
}

function suggestionsToGeojson() {
  const counts = new Map();
  for (const s of state.suggestions) {
    if (!s.stopId) continue;
    const c = counts.get(s.stopId) || { n: 0, lng: s.lng, lat: s.lat };
    c.n += 1;
    counts.set(s.stopId, c);
  }
  return {
    type: 'FeatureCollection',
    features: [...counts.entries()].map(([stopId, c]) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
      properties: { stopId, count: c.n },
    })),
  };
}

function selectedGeojson() {
  if (!state.selected) return { type: 'FeatureCollection', features: [] };
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [state.selected.lng, state.selected.lat] }, properties: {} }],
  };
}

function refreshSuggestionLayer() {
  map.getSource('suggestions')?.setData(suggestionsToGeojson());
  const n = state.suggestions.length;
  const stops = new Set(state.suggestions.map((s) => s.stopId)).size;
  $('#total-count').textContent = n
    ? `${n} suggestion${n === 1 ? '' : 's'} so far at ${stops} stop${stops === 1 ? '' : 's'}.`
    : 'Share and explore the map.';
  if (state.selected && !$('#panel-form').hidden) renderOthers(state.selected.stopId);
}

map.on('load', async () => {
  paintBlueWhite();

  map.addImage('septa-bus', await svgToImage(BUS_ICON_SVG, 96), { pixelRatio: 2 });

  map.addSource('stops', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addSource('suggestions', { type: 'geojson', data: suggestionsToGeojson() });
  map.addSource('selected', { type: 'geojson', data: selectedGeojson() });

  
  map.addLayer({
    id: 'suggestions-halo',
    type: 'circle',
    source: 'suggestions',
    paint: {
      'circle-color': SEPTA_RED,
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 6, 13, 16, 17, 46],
      'circle-opacity': ['interpolate', ['linear'], ['get', 'count'], 1, 0.22, 5, 0.45, 15, 0.7],
      'circle-blur': 0.35,
    },
  });

  // low zoom: small black dots
  map.addLayer({
    id: 'stops-dot',
    type: 'circle',
    source: 'stops',
    maxzoom: 14,
    paint: {
      'circle-color': SEPTA_BLACK,
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 1.2, 12, 2.5, 14, 4],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 9, 0, 12, 0.8],
    },
  });

  // high zoom: the SEPTA bus icon from the stop sign
  map.addLayer({
    id: 'stops-icon',
    type: 'symbol',
    source: 'stops',
    minzoom: 14,
    layout: {
      'icon-image': 'septa-bus',
      'icon-size': ['interpolate', ['linear'], ['zoom'], 14, 0.55, 16, 0.8, 18, 1.1],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'text-field': ['step', ['zoom'], '', 16.5, ['get', 'name']],
      'text-size': 12,
      'text-offset': [0, 1.9],
      'text-anchor': 'top',
      'text-optional': true,
      'text-font': ['Cabinet Grotesk Extrabold', 'Cabinet Grotesk Regular'],
    },
    paint: {
      'text-color': '#0f2a52',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
    },
  });

  // selection: 3px red ring, no fill — same as the cursor, "locked" on the stop.
  map.addLayer({
    id: 'selected-ring',
    type: 'circle',
    source: 'selected',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 10, 14, 16, 18, 30],
      'circle-color': 'rgba(0,0,0,0)',
      'circle-stroke-color': SEPTA_RED,
      'circle-stroke-width': 3,
    },
  });

  loadStopsIntoMap();
});

async function loadStopsIntoMap() {
  try {
    const { geojson, source } = await loadStops((done, total) =>
      setStatus(`Loading SEPTA bus stops… ${Math.round((done / total) * 100)}%`),
    );
    state.stopsGeojson = geojson;
    state.stopsById = new Map(geojson.features.map((f) => [f.properties.stopId, f]));
    map.getSource('stops').setData(geojson);
    setStatus(`${geojson.features.length.toLocaleString()} SEPTA bus stops loaded${source === 'file' ? ' (local copy)' : ''}.`);
    setTimeout(() => setStatus(''), 3500);
    window.exportStops = () => downloadGeoJSON(geojson);
  } catch (err) {
    console.error(err);
    setStatus(err.message, true);
  }
}

/* picking stop */
map.on('click', (e) => {
  const pad = 14;
  const box = [[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]];
  const hits = map.queryRenderedFeatures(box, { layers: ['stops-icon', 'stops-dot'].filter((l) => map.getLayer(l)) });

  if (!hits.length) {
    toast(map.getZoom() < 14 ? 'Zoom in to see bus stops, then click one.' : 'Click on a bus stop icon.');
    return;
  }

  // nearest stop to the click, in screen pixels.
  const nearest = hits
    .map((f) => {
      const p = map.project(f.geometry.coordinates);
      return { f, d: (p.x - e.point.x) ** 2 + (p.y - e.point.y) ** 2 };
    })
    .sort((a, b) => a.d - b.d)[0].f;

  // at low zoom, stops are packed tight so zoom in first so riders can confirm the right one.
  if (map.getZoom() < 14) {
    map.easeTo({ center: nearest.geometry.coordinates, zoom: 16 });
    toast('Zoomed in. Now click your stop.');
    return;
  }
  selectStop(nearest);
});

function selectStop(feature) {
  const [lng, lat] = feature.geometry.coordinates;
  const p = feature.properties;
  state.selected = {
    stopId: String(p.stopId),
    name: p.name,
    routes: p.routes ? String(p.routes).split(',').filter(Boolean) : [],
    lng,
    lat,
  };
  map.getSource('selected').setData(selectedGeojson());

  map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 16) });

  renderStopHeader();
  renderOthers(state.selected.stopId);
  showPanel('form');
}

function selectStopById(raw, errorEl) {
  const id = String(raw).trim().replace(/^0+/, '');
  errorEl.hidden = true;
  if (!state.stopsById.size) {
    errorEl.textContent = 'Stops are still loading. Try again in a moment.';
    errorEl.hidden = false;
    return;
  }
  const f = state.stopsById.get(id);
  if (!f) {
    errorEl.textContent = `No bus stop with ID ${raw} in the current SEPTA data.`;
    errorEl.hidden = false;
    return;
  }
  selectStop(f);
}

function renderStopHeader() {
  const s = state.selected;
  $('#stop-name').textContent = s.name;
  $('#stop-id').textContent = `STOP ID ${s.stopId}`;
  const ul = $('#stop-routes');
  ul.innerHTML = '';
  for (const r of s.routes) {
    const li = document.createElement('li');
    li.textContent = r;
    ul.appendChild(li);
  }
}

function renderOthers(stopId) {
  const el = $('#stop-others');
  const here = state.suggestions.filter((s) => s.stopId === stopId);
  if (!here.length) {
    el.innerHTML = '<strong>No one has suggested upgrades here yet.</strong> Yours would be the first.';
    return;
  }
  const tally = Object.fromEntries(Object.keys(UPGRADE_LABELS).map((k) => [k, 0]));
  for (const s of here) for (const u of s.upgrades || []) if (u in tally) tally[u] += 1;

  const people = here.length === 1 ? 'One other rider has' : `${here.length} other riders have`;
  el.innerHTML = `<strong>${people}</strong> suggested upgrades at this stop.<ul class="tally"></ul>`;
  const list = el.querySelector('.tally');
  for (const [k, n] of Object.entries(tally)) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${UPGRADE_LABELS[k]}</span><span class="bar"><span style="width:${(n / here.length) * 100}%"></span></span><span>${n}</span>`;
    list.appendChild(li);
  }
}

/* form */
const form = $('#suggest-form');

function checkedValues(name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
}

function setInvalid(id, bad) {
  const el = $(id);
  el.classList.toggle('invalid', bad);
  const msg = el.querySelector('.field-error');
  if (msg) msg.hidden = !bad;
  return bad;
}

function updateArtQuestion() {
  const yes = checkedValues('publicArt')[0] === 'yes';
  $('#q-art-meaning').hidden = !yes;
  for (const span of form.querySelectorAll('.qnum')) {
    span.textContent = Number(span.dataset.base) + (yes ? 1 : 0);
  }
  if (!yes) setInvalid('#q-art-meaning', false);
}

form.addEventListener('change', (e) => {
  if (e.target.name === 'publicArt') updateArtQuestion();
  // Clear an error as soon as it's fixed.
  const q = e.target.closest('.q.invalid');
  if (q) validate({ quiet: true });
});
$('#artMeaning').addEventListener('input', () => {
  if ($('#q-art-meaning').classList.contains('invalid')) validate({ quiet: true });
});

function validate({ quiet = false } = {}) {
  const upgrades = checkedValues('upgrades');
  const relationship = checkedValues('relationship')[0];
  const publicArt = checkedValues('publicArt')[0];
  const artMeaning = $('#artMeaning').value.trim();

  const errors = [
    setInvalid('#q-upgrades', upgrades.length === 0),
    setInvalid('#q-relationship', !relationship),
    setInvalid('#q-art', !publicArt),
    setInvalid('#q-art-meaning', publicArt === 'yes' && artMeaning.length < 3),
  ].filter(Boolean).length;

  if (!quiet && errors) {
    const first = form.querySelector('.invalid');
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  $('#form-error').hidden = !errors;
  $('#form-error').textContent = errors ? 'A few answers are missing. They are marked in red above.' : '';
  return errors === 0;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!state.selected) {
    toast('Pick a bus stop on the map first.');
    return;
  }
  if (!validate()) return;

  const publicArt = checkedValues('publicArt')[0];
  const s = state.selected;
  const doc = {
    stopId: s.stopId,
    stopName: s.name,
    routes: s.routes,
    lng: s.lng,
    lat: s.lat,
    upgrades: checkedValues('upgrades'),
    relationship: checkedValues('relationship')[0],
    times: checkedValues('times'),
    publicArt,
    artMeaning: publicArt === 'yes' ? $('#artMeaning').value.trim() : '',
    outreach: $('#outreach').value.trim(),
    comments: $('#comments').value.trim(),
  };

  const btn = $('#submit-btn');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    await addSuggestion(doc);
    state.submittedThisVisit.push(s.name);
    $('#thanks-detail').textContent =
      `We saved your suggestion for ${s.name} (Stop ID ${s.stopId}): ` +
      doc.upgrades.map((u) => UPGRADE_LABELS[u]).join(', ') + '.';
    showPanel('thanks');
  } catch (err) {
    console.error(err);
    $('#form-error').textContent = 'Something went wrong saving your suggestion. Please try again.';
    $('#form-error').hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit suggestion';
  }
});

function resetForm() {
  form.reset();
  for (const q of form.querySelectorAll('.invalid')) setInvalid('#' + q.id, false);
  $('#form-error').hidden = true;
  updateArtQuestion();
}

function clearSelection() {
  state.selected = null;
  map.getSource('selected')?.setData(selectedGeojson());
}

/* buttons */

$('#another-yes').addEventListener('click', () => {
  resetForm();
  clearSelection();
  showPanel('pick');
});
$('#another-no').addEventListener('click', () => {
  const n = state.submittedThisVisit.length;
  $('#done-detail').textContent = `You suggested upgrades at ${n} stop${n === 1 ? '' : 's'}: ${state.submittedThisVisit.join('; ')}.`;
  clearSelection();
  showPanel('done');
});
$('#restart-btn').addEventListener('click', () => {
  resetForm();
  state.submittedThisVisit = [];
  showPanel('intro');
  map.flyTo(START_VIEW);
});
$('#back-btn').addEventListener('click', () => {
  clearSelection();
  showPanel('intro');
});
$('#pick-cancel').addEventListener('click', () => showPanel('intro'));

$('#stopid-form').addEventListener('submit', (e) => {
  e.preventDefault();
  selectStopById($('#stopid-input').value, $('#stopid-error'));
});
$('#stopid-form-2').addEventListener('submit', (e) => {
  e.preventDefault();
  selectStopById($('#stopid-input-2').value, $('#stopid-error-2'));
});

for (const chip of document.querySelectorAll('[data-jump]')) {
  chip.addEventListener('click', () => map.flyTo(JUMPS[chip.dataset.jump]));
}

$('#about-btn').addEventListener('click', () => $('#about-dialog').showModal());

/* init */
initStore((items) => {
  state.suggestions = items;
  if (map.isStyleLoaded() && map.getSource('suggestions')) refreshSuggestionLayer();
  else map.once('idle', refreshSuggestionLayer);
}).then(({ mode }) => {
  if (mode === 'local') console.info('Demo mode: suggestions are saved only in this browser. Add Firebase config in js/config.js to share them.');
});

updateArtQuestion();
