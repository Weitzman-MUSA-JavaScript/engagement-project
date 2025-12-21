// Firebase 
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9c5DQriKjG-COIFiqnbIMNSZ7Up1CEZ0",
  authDomain: "mara-serengeti-studio.firebaseapp.com",
  projectId: "mara-serengeti-studio",
  storageBucket: "mara-serengeti-studio.firebasestorage.app",
  messagingSenderId: "642513419758",
  appId: "1:642513419758:web:5c2d5335e81d2569bda2ff",
  measurementId: "G-E93T6RYRE2",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// -----------------------------
// Utilities
// -----------------------------

const $ = (id) => document.getElementById(id);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function nowISO() {
  const d = new Date();
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function setMapStatus(text, type = "info") {
  const el = $("mapStatus");
  if (!el) return;
  el.textContent = text;
  el.classList.remove("is-error", "is-ok");
  if (type === "error") el.classList.add("is-error");
  if (type === "ok") el.classList.add("is-ok");
  el.style.opacity = "1";
  el.style.pointerEvents = "none";
}

function hideMapStatus(delayMs = 650) {
  const el = $("mapStatus");
  if (!el) return;
  window.setTimeout(() => {
    el.style.opacity = "0";
  }, delayMs);
}

function toastAI(msg, mood = "neutral") {
  const ai = $("aiText");
  if (!ai) return;
  ai.textContent = msg;
  ai.dataset.mood = mood;
  ai.classList.remove("is-pop");
  // restart animation
  void ai.offsetWidth;
  ai.classList.add("is-pop");
}

// -----------------------------
// Leaflet loader (robust)
// -----------------------------

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function ensureLeaflet() {
  if (window.L) return;

  // Some environments block one CDN but allow the other.
  const cdns = [
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  ];

  let lastErr = null;
  for (const url of cdns) {
    try {
      await loadScript(url);
      if (window.L) return;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("Leaflet not available");
}

// -----------------------------
// Map + scoring state
// -----------------------------

let map = null;
let currentTool = "lodge";
let hasUserChosenTool = false;
let activeTileLayer = null;

let eco = 100;
let joy = 0;

const placed = []; // { id, type, latlng, inNoGo }

// Overlays / layers
let parkBoundaryLayer = null;
let parkBoundary2Layer = null;

let previewRed = null;
let previewGreen = null;

let noGoPolys = [];
let noGoLayer = null;

let habitatLayer = null;
let trafficLayer = null;

let roadsLayer = null;
let roadsLoading = false;

// GeoJSON load flags (MUST exist, or ensureExternalGeoLayers will crash)
let geoDataLoading = false;
let geoDataLoaded = false;

// Tracks layers (built from point GeoJSON)
let wildebeestTracksLayer = null;
let lionTracksLayer = null;

// Simple facility descriptions for the side panel
const TOOL_INFO = {
  lodge: {
    title: "Lodge",
    blurb: "Purpose: overnight stays and a base for safaris. Impact: medium footprint—keep outside core habitats. Visitor: high comfort.",
    eco: -6,
    joy: 4,
  },
  activity: {
    title: "Activity",
    blurb: "Purpose: guided experiences (walks, crafts, culture). Impact: keep group size/paths limited to avoid wildlife stress. Visitor: memorable if near viewpoints.",
    eco: -14,
    joy: 20,
  },
  parking: {
    title: "Parking",
    blurb: "Purpose: staging for shuttles and day trips. Impact: can fragment habitat—cluster with restaurants/lodges to reduce sprawl.",
    eco: -10,
    joy: 8,
  },
  restaurant: {
    title: "Restaurant",
    blurb: "Purpose: meals and rest stops. Impact: service traffic and waste—site near roads, away from wildlife corridors.",
    eco: -7,
    joy: 10,
  },
  camp: {
    title: "Camp",
    blurb: "Purpose: low-impact overnight stay. Impact: smaller footprint but needs buffer from wildlife routes. Visitor: immersive if placed responsibly.",
    eco: -4,
    joy: 6,
  },
  shuttle: {
    title: "Shuttle",
    blurb: "Purpose: move guests efficiently between hubs. Impact: reduces private car traffic; keep routes on existing roads to protect habitats.",
    eco: 6,
    joy: 8,
  },
  view: {
    title: "Viewpoint",
    blurb: "Purpose: quiet wildlife viewing spot. Impact: light footprint if off-road travel is limited. Visitor: big joy boost near water/habitats.",
    eco: -1,
    joy: 12,
  },
  hide: {
    title: "Hide",
    blurb: "Purpose: concealed wildlife viewing. Impact: minimal if entry paths are controlled; excellent visitor experience when near water/cover.",
    eco: -5,
    joy: 14,
  },
  research: {
    title: "Research",
    blurb: "Purpose: monitoring and science. Impact: moderate but justified—site near access to reduce patrol disturbance; supports conservation outcomes.",
    eco: 10,
    joy: 6,
  },
};

const DATA_DIR = "./data/";
const PARK_BOUNDARY_URL = encodeURI(DATA_DIR + "Serengeti National Park.json");
const PARK_BOUNDARY_2_URL = encodeURI(DATA_DIR + "Masai Mara.json");
const WILDEBEEST_POINTS_URL = DATA_DIR + "combined_wildebeest_tsavo_points_sampled.geojson";
const LION_POINTS_URL = DATA_DIR + "tsavo_lion_points.geojson";
const ROADS_URL = DATA_DIR + "road.geojson"; 

const TILE_SOURCES = [
  {
    name: "OSM HOT",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors · style by HOT · tiles by OSM France",
    },
  },
  {
    name: "OSM Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: { maxZoom: 19, attribution: "© OpenStreetMap contributors" },
  },
  {
    name: "Carto Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    options: {
      maxZoom: 19,
      subdomains: "abcd",
      attribution: "© OpenStreetMap contributors · © CARTO",
    },
  },
];

// -----------------------------
// Geometry helpers
// -----------------------------

function pointInPolygon(latlng, polygonLatLngs) {
  // Ray casting in lon/lat space
  const x = latlng.lng;
  const y = latlng.lat;
  let inside = false;

  for (let i = 0, j = polygonLatLngs.length - 1; i < polygonLatLngs.length; j = i++) {
    const xi = polygonLatLngs[i].lng;
    const yi = polygonLatLngs[i].lat;
    const xj = polygonLatLngs[j].lng;
    const yj = polygonLatLngs[j].lat;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonAreaKm2(latlngs) {
  // Shoelace in WebMercator meters (good enough for small areas)
  // Convert lat/lng -> meters
  const R = 6378137;
  const pts = latlngs.map((p) => {
    const x = (p.lng * Math.PI / 180) * R;
    const y = Math.log(Math.tan(Math.PI / 4 + (p.lat * Math.PI / 180) / 2)) * R;
    return { x, y };
  });

  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    sum += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  const areaM2 = Math.abs(sum) / 2;
  return areaM2 / 1e6;
}

function distMeters(a, b) {
  return map ? map.distance(a, b) : 0;
}

// -----------------------------
// GeoJSON helpers (fetch + build layers)
// -----------------------------
async function fetchGeoJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (HTTP ${res.status})`);
  return await res.json();
}

function makeBoundaryLayer(geojson, style, label) {
  return L.geoJSON(geojson, {
    interactive: false,
    style,
    onEachFeature: (f, layer) => {
      const name =
        f?.properties?.NAME ||
        f?.properties?.Name ||
        f?.properties?.name ||
        label;
      layer.bindTooltip(String(name), { sticky: true });
    },
  });
}

/**
 * Convert point tracks -> polylines.
 * Assumes each feature has:
 *  - geometry: Point [lng, lat]
 *  - properties.individual_id (or similar)
 *  - properties.timestamp (ISO string) (optional but recommended)
 */
function buildTracksFromPoints(pointsGeoJSON, opts) {
  const {
    idKey = "individual_id",
    timeKey = "timestamp",
    lineStyle = {},
    labelPrefix = "Track",
  } = opts || {};

  const feats = pointsGeoJSON?.features || [];
  const groups = new Map(); // id -> [{t, latlng}...]

  for (const ft of feats) {
    const geom = ft?.geometry;
    if (!geom || geom.type !== "Point") continue;

    const coords = geom.coordinates; // [lng, lat]
    if (!Array.isArray(coords) || coords.length < 2) continue;

    const props = ft.properties || {};
    const id = props[idKey] ?? "unknown";

    const tRaw = props[timeKey];
    const t = tRaw ? new Date(tRaw).getTime() : NaN;

    const latlng = L.latLng(coords[1], coords[0]);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push({ t, latlng });
  }

  const out = L.layerGroup();

  for (const [id, arr] of groups.entries()) {
    // sort by time if possible
    const sortable = arr.every((p) => Number.isFinite(p.t));
    if (sortable) arr.sort((a, b) => a.t - b.t);

    const latlngs = arr.map((p) => p.latlng);
    if (latlngs.length < 2) continue;

    const line = L.polyline(latlngs, {
      weight: 3,
      opacity: 0.75,
      ...lineStyle,
    }).bindTooltip(`${labelPrefix}: ${id}`, { sticky: true });

    out.addLayer(line);
  }

  return out;
}

async function ensureRoadLayer() {
  if (!map) return;
  if (roadsLayer || roadsLoading) return; 

  roadsLoading = true;
  try {
    const roadsGeo = await fetchGeoJSON(ROADS_URL);

    roadsLayer = L.geoJSON(roadsGeo, {
      filter: (f) => {
        const t = f?.geometry?.type;
        return t === "LineString" || t === "MultiLineString";
      },
      style: () => ({
        color: "rgba(231,168,104,0.95)",
        weight: 2,
        opacity: 0.85,
      }),
    });
  } catch (e) {
    console.warn("Failed to load road.geojson", e);
  } finally {
    roadsLoading = false;
  }
}

async function ensureExternalGeoLayers() {
  if (!map) return;
  if (geoDataLoaded || geoDataLoading) return;

  geoDataLoading = true;
  setMapStatus("Loading /data GeoJSON layers…");

  try {
    const [serengeti, masaiMara, wildePoints, lionPoints] = await Promise.all([
      fetchGeoJSON(PARK_BOUNDARY_URL),
      fetchGeoJSON(PARK_BOUNDARY_2_URL),
      fetchGeoJSON(WILDEBEEST_POINTS_URL),
      fetchGeoJSON(LION_POINTS_URL),
    ]);

    // 1) boundaries (two layers)
   if (!parkBoundaryLayer) {
      parkBoundaryLayer = L.geoJSON(serengeti, {
        interactive: false,
        style: {
          color: "rgba(124,91,57,0.9)",
          weight: 2,
          fill: false,
        },
        onEachFeature: (f, layer) => {
          const name =
            f?.properties?.NAME ||
            f?.properties?.Name ||
            f?.properties?.name ||
            "Serengeti";
          layer.bindTooltip(String(name), { sticky: true });
        },
      });
      parkBoundaryLayer.addTo(map);
    }

    if (!parkBoundary2Layer) {
      parkBoundary2Layer = L.geoJSON(masaiMara, {
        interactive: false,
        style: {
          color: "rgba(106,163,215,0.9)",
          weight: 2,
          dashArray: "6 10",
          fill: false,
        },
        onEachFeature: (f, layer) => {
          const name =
            f?.properties?.NAME ||
            f?.properties?.Name ||
            f?.properties?.name ||
            "Masai Mara";
          layer.bindTooltip(String(name), { sticky: true });
        },
      });
      parkBoundary2Layer.addTo(map);
    }

    const b = L.latLngBounds([]);
    try {
      if (parkBoundaryLayer) b.extend(parkBoundaryLayer.getBounds());
      if (parkBoundary2Layer) b.extend(parkBoundary2Layer.getBounds());
      if (b.isValid()) map.fitBounds(b.pad(0.06));
    } catch (_) {}

    // 2) tracks (build from points)
   wildebeestTracksLayer = buildTracksFromPoints(wildePoints, {
  idKey: "individual_id",        
  timeKey: "timestamp",         
  lineStyle: {
    color: "rgba(47,125,95,0.9)",
    dashArray: "10 8",
  },
  labelPrefix: "Wildebeest",
});

lionTracksLayer = buildTracksFromPoints(lionPoints, {
  idKey: "individual_id",
  timeKey: "timestamp",
  lineStyle: {
    color: "rgba(192,108,42,0.9)",
    dashArray: "2 10",
  },
  labelPrefix: "Lion",
});

    // 3) fit bounds to both boundaries

     const mode = document.getElementById("map")?.dataset?.mode || "design";

    if (mode === "habitat") {
      buildHabitatOverlays();
      if (habitatLayer && !map.hasLayer(habitatLayer)) {
        habitatLayer.addTo(map);
      }
    }

    applyWildlifeVisibility(mode);

    setMapStatus("GeoJSON layers loaded.", "ok");
    hideMapStatus(650);
  } catch (e) {
    console.warn(e);
    setMapStatus(
      "Failed to load /data GeoJSON (check Live Server + filenames).",
      "error"
    );
  } finally {
    geoDataLoading = false;
  }
}

// -----------------------------
// HUD gauges
// -----------------------------

function setGauge(arcId, value) {
  const arc = $(arcId);
  if (!arc) return;

  // Stroke length of this semicircle path is ~157. (We can compute once, but keeping simple.)
  const total = 157;
  const v = clamp(value, 0, 100) / 100;
  arc.style.strokeDasharray = `${total} ${total}`;
  arc.style.strokeDashoffset = `${total * (1 - v)}`;
}

function bumpGauge(which) {
  const el = document.querySelector(`.gauge[data-gauge="${which}"]`);
  if (!el) return;
  el.classList.remove("is-ping");
  void el.offsetWidth;
  el.classList.add("is-ping");
}

function updateScoresUI() {
  eco = clamp(eco, 0, 100);
  joy = clamp(joy, 0, 100);

  const ecoEl = $("ecoValue");
  const joyEl = $("joyValue");
  if (ecoEl) ecoEl.textContent = String(Math.round(eco));
  if (joyEl) joyEl.textContent = String(Math.round(joy));

  setGauge("ecoArc", eco);
  setGauge("joyArc", joy);

  // Right panel bars
  const placedCountEl = $("placedCount");

  const meterEco = $("meterEco");
  const meterJoy = $("meterJoy");
  const meterNoGo = $("meterNoGo");

  const meterEcoVal = $("meterEcoVal");
  const meterJoyVal = $("meterJoyVal");
  const meterNoGoVal = $("meterNoGoVal");

  const noGoCount = placed.filter((p) => p.inNoGo).length;
  const noGoPct = placed.length ? Math.round((noGoCount / placed.length) * 100) : 0;

  if (placedCountEl) placedCountEl.textContent = String(placed.length);

  if (meterEco) meterEco.style.width = `${Math.round(eco)}%`;
  if (meterJoy) meterJoy.style.width = `${Math.round(joy)}%`;
  if (meterNoGo) meterNoGo.style.width = `${noGoPct}%`;

  if (meterEcoVal) meterEcoVal.textContent = String(Math.round(eco));
  if (meterJoyVal) meterJoyVal.textContent = String(Math.round(joy));
  if (meterNoGoVal) meterNoGoVal.textContent = String(noGoPct);
}

// -----------------------------
// Tile layer fallback
// -----------------------------

function attachTileHealth(layer, idx) {
  let errorCount = 0;
  const createdAt = Date.now();

  layer.on("loading", () => {
    setMapStatus(`Loading map tiles… (${TILE_SOURCES[idx].name})`);
  });

  layer.on("load", () => {
    setMapStatus("Canvas ready.", "ok");
    hideMapStatus(550);
  });

  layer.on("tileerror", () => {
    errorCount += 1;
    const elapsed = Date.now() - createdAt;
    if (elapsed < 8000 && errorCount >= 8) {
      const next = idx + 1;
      if (next < TILE_SOURCES.length) {
        setMapStatus(`Tile load failed (${TILE_SOURCES[idx].name}). Switching…`, "error");
        useTileSource(next);
      } else {
        setMapStatus(
          "Tiles failed to load. If your network blocks map CDNs, the workbench stays in blueprint mode.",
          "error"
        );
      }
    }
  });
}

function useTileSource(idx) {
  if (!map) return;
  const src = TILE_SOURCES[idx];
  if (activeTileLayer) {
    try { map.removeLayer(activeTileLayer); } catch (_) {}
  }
  activeTileLayer = L.tileLayer(src.url, src.options);
  attachTileHealth(activeTileLayer, idx);
  activeTileLayer.addTo(map);
}

// -----------------------------
// No-go zone + overlays
// -----------------------------

function ensureSvgPattern() {
  // Leaflet creates an SVG element for vector layers. We inject a diagonal hatch pattern.
  const svg = document.querySelector("#map svg");
  if (!svg) return;
  if (svg.querySelector("#noGoHatch")) return;

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
  pattern.setAttribute("id", "noGoHatch");
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  pattern.setAttribute("width", "10");
  pattern.setAttribute("height", "10");
  pattern.setAttribute("patternTransform", "rotate(35)");

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width", "10");
  rect.setAttribute("height", "10");
  rect.setAttribute("fill", "rgba(216,110,91,0.12)");

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", "0");
  line.setAttribute("y1", "0");
  line.setAttribute("x2", "0");
  line.setAttribute("y2", "10");
  line.setAttribute("stroke", "rgba(216,110,91,0.55)");
  line.setAttribute("stroke-width", "4");

  pattern.appendChild(rect);
  pattern.appendChild(line);
  defs.appendChild(pattern);
  svg.insertBefore(defs, svg.firstChild);
}

function buildNoGoZones() {
  // Rough demo polygons near the Mara / Serengeti region (not authoritative)
  // Using a couple of sensitive core zones.
  const zones = [
    [
      L.latLng(-2.192230, 35.032646),   
      L.latLng(-2.233689, 34.975583), 
      L.latLng(-2.300771, 34.997379),  
      L.latLng(-2.300771, 35.067913),  
      L.latLng(-2.233689, 35.089709),
    ],
    [
      L.latLng(-2.792762, 34.528709),   
      L.latLng(-2.834221, 34.471646),  
      L.latLng(-2.901303, 34.493442),  
      L.latLng(-2.901303, 34.563976), 
     L.latLng(-2.834221, 34.585772),
    ],
  ];

  noGoPolys = zones;

  if (!noGoLayer) noGoLayer = L.layerGroup();
  noGoLayer.clearLayers();

  zones.forEach((poly) => {
    L.polygon(poly, {
      color: "rgba(216,110,91,0.85)",
      weight: 2,
      dashArray: "6 6",
      fill: true,
      fillColor: "rgba(216,110,91,0.18)",
      fillOpacity: 0.85,
    })
      .addTo(noGoLayer)
      .bindTooltip("No-go zone", { direction: "top" });
  });

  noGoLayer.addTo(map);
  ensureSvgPattern();

  // Badge area
  const area = zones.reduce((acc, poly) => acc + polygonAreaKm2(poly), 0);
  const badge = $("noGoBadge");
  if (badge) badge.textContent = `No-go zone: ${area.toFixed(1)} km²`;
}

function buildHabitatOverlays() {
  if (!habitatLayer) habitatLayer = L.layerGroup();
  habitatLayer.clearLayers();

  // If real tracks are ready, use them
  if (wildebeestTracksLayer || lionTracksLayer) {
    if (wildebeestTracksLayer) habitatLayer.addLayer(wildebeestTracksLayer);
    if (lionTracksLayer) habitatLayer.addLayer(lionTracksLayer);
    return;
  }

  // Otherwise: fallback to your existing demo corridor
  const path = [
    L.latLng(-1.28, 34.93),
    L.latLng(-1.37, 34.86),
    L.latLng(-1.50, 34.78),
    L.latLng(-1.62, 34.67),
  ];

  const line = L.polyline(path, {
    color: "rgba(124,91,57,0.85)",
    weight: 4,
    dashArray: "10 8",
    opacity: 0.9,
  }).bindTooltip("Migration corridor (demo)", { sticky: true });

  const water = [
    L.circleMarker(L.latLng(-2.66, 34.79), { radius: 7, color: "rgba(90,150,210,0.95)", weight: 2, fillOpacity: 0.9 }),
    L.circleMarker(L.latLng(-2.99, 34.99), { radius: 14, color: "rgba(90,150,210,0.95)", weight: 2, fillOpacity: 0.9 }),
  ];

  line.addTo(habitatLayer);
  water.forEach((w) => w.addTo(habitatLayer).bindTooltip("Water source", { direction: "top" }));
}

async function buildTrafficOverlays() {
  if (!trafficLayer) trafficLayer = L.layerGroup();
  trafficLayer.clearLayers();

  await ensureRoadLayer();
  if (roadsLayer) {
    trafficLayer.addLayer(roadsLayer);
  }
}

// -----------------------------
// Tools + placement
// -----------------------------

function getToolSpec(tool) {
  const btn = document.querySelector(`.tool-button[data-tool="${tool}"]`);
  if (!btn) return null;

  const ecoDelta = Number(btn.dataset.eco || "0");
  const joyDelta = Number(btn.dataset.joy || "0");
  const redRadius = Number(btn.dataset.redRadius || "3000");
  const greenRadius = Number(btn.dataset.greenRadius || "5000");

  const icon = btn.querySelector(".tool-icon")?.textContent || "•";
  const label = btn.querySelector(".tool-label")?.textContent || tool;

  const colorByTool = {
    lodge: "rgba(216,110,91,0.95)",      
    parking: "rgba(90,90,90,0.85)",       
    restaurant: "rgba(231,168,104,0.95)", 
    view: "rgba(106,163,215,0.95)",       

    activity: "rgba(255,189,120,0.95)",   
    hide: "rgba(110,180,155,0.95)",       
    campfire: "rgba(255,140,110,0.95)",   
    research: "rgba(155,130,220,0.95)",   
    shuttle: "rgba(120,120,200,0.95)",    
  };

  return {
    tool,
    ecoDelta,
    joyDelta,
    redRadius,
    greenRadius,
    icon,
    label,
    color: colorByTool[tool] || "rgba(124,91,57,0.95)",
  };
}

function updateSelectedPanel(spec) {
  const typeEl = $("selType");
  const ecoEl = $("selEco");
  const joyEl = $("selJoy");
  const descEl = $("selDesc");

  if (!spec) {
    if (typeEl) typeEl.textContent = "—";
    if (ecoEl) ecoEl.textContent = "—";
    if (joyEl) joyEl.textContent = "—";
    if (descEl) descEl.textContent = "Pick a tool to see what it does.";
    return;
  }

  const info = TOOL_INFO[spec.tool] || {};
  if (typeEl) typeEl.textContent = info.title || spec.label || spec.tool;
  if (ecoEl) ecoEl.textContent = `${spec.ecoDelta > 0 ? "+" : ""}${spec.ecoDelta}`;
  if (joyEl) joyEl.textContent = `${spec.joyDelta > 0 ? "+" : ""}${spec.joyDelta}`;
  if (descEl) {
    descEl.textContent =
      info.blurb ||
      "Purpose: plan ahead. Impact: varies by location. Visitor: place thoughtfully for best experience.";
  }
}

function renderFacilityList() {
  const list = $("facilityList");
  if (!list) return;
  list.innerHTML = "";

  Object.entries(TOOL_INFO).forEach(([key, info]) => {
    const spec = getToolSpec(key);
    if (!spec) return;

    const ecoText = spec.ecoDelta >= 0 ? `+${spec.ecoDelta}` : `${spec.ecoDelta}`;
    const joyText = spec.joyDelta >= 0 ? `+${spec.joyDelta}` : `${spec.joyDelta}`;

    const card = document.createElement("div");
    card.className = "facility-card";
    card.dataset.tool = key;
    if (currentTool === key) card.classList.add("facility-card--active");
    card.addEventListener("click", () => {
      setActiveTool(key);
      // Focus stays in the side panel; toast provides feedback
      toastAI(`Preparing to build ${spec.label}.`, "neutral");
    });

    const title = document.createElement("div");
    title.className = "facility-card-title";
    title.textContent = info.title || key;

    const meta = document.createElement("div");
    meta.className = "facility-card-meta";
    meta.textContent = `Eco: ${ecoText} · Visitor: ${joyText}`;

    const text = document.createElement("p");
    text.className = "facility-card-text";
    text.textContent = info.blurb || "";

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(text);
    list.appendChild(card);
  });
}

const FACILITY_PROMPT_DEFAULT = "Please choose the facility you want to build.";

function updateFacilityPrompt(spec = null) {
  const prompt = $("facilityPrompt");
  if (!prompt) return;

  if (!spec) {
    prompt.textContent = FACILITY_PROMPT_DEFAULT;
    return;
  }

  const info = TOOL_INFO[spec.tool] || {};
  const desc = info.blurb || "Place thoughtfully to balance eco and joy.";
  prompt.textContent = `Preparing to build ${spec.label}: ${desc}`;
}

function setScoreTab(tab) {
  document.querySelectorAll(".score-tab").forEach((t) => {
    t.classList.toggle("score-tab--active", t.dataset.tab === tab);
  });

  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.tabPanel !== tab);
  });

  if (tab === "facilities") {
    const spec = getToolSpec(currentTool);
    if (hasUserChosenTool && spec) {
      updateFacilityPrompt(spec);
    } else {
      updateFacilityPrompt();
    }
  }
}

function setActiveTool(tool, opts = {}) {
  const { userInitiated = true, skipPrompt = false } = opts;
  if (userInitiated) hasUserChosenTool = true;
  currentTool = tool;

  document.querySelectorAll(".tool-button[data-tool]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.tool === tool);
  });

  const spec = getToolSpec(tool);
  if (!spec) return;

  toastAI(`Placing ${spec.label}. Watch the red/green rings before you click.`, "neutral");
  setPreviewRingsRadii(spec.redRadius, spec.greenRadius);
  updateSelectedPanel(spec);
  updateFacilityPrompt(spec);
  renderFacilityList();
}

function setPreviewRingsRadii(redR, greenR) {
  if (previewRed) previewRed.setRadius(redR);
  if (previewGreen) previewGreen.setRadius(greenR);
}

function ensurePreviewRings(latlng) {
  if (!previewRed) {
    previewRed = L.circle(latlng, {
      radius: 3500,
      color: "rgba(216,110,91,0.9)",
      weight: 2,
      dashArray: "6 6",
      fillColor: "rgba(216,110,91,0.08)",
      fillOpacity: 0.25,
      interactive: false,
    }).addTo(map);
  }

  if (!previewGreen) {
    previewGreen = L.circle(latlng, {
      radius: 6500,
      color: "rgba(156,191,123,0.95)",
      weight: 2,
      dashArray: "2 10",
      fillColor: "rgba(156,191,123,0.06)",
      fillOpacity: 0.2,
      interactive: false,
    }).addTo(map);
  }
}

function updatePreviewRings(latlng) {
  ensurePreviewRings(latlng);
  previewRed.setLatLng(latlng);
  previewGreen.setLatLng(latlng);
}

function isInNoGo(latlng) {
  return noGoPolys.some((poly) => pointInPolygon(latlng, poly));
}

function facilityIconHtml(spec, isDanger) {
  const danger = isDanger ? " facility-marker--danger" : "";
  return `<div class="facility-marker facility-marker--${spec.tool}${danger}"><span class="facility-emoji">${spec.icon}</span></div>`;
}

function placeFacility(latlng) {
  const spec = getToolSpec(currentTool);
  if (!spec) return;

  const inNoGo = isInNoGo(latlng);

  // Extra scoring factors (simple demo):
  // - if inside no-go: huge eco penalty
  // - if close to migration corridor (habitat path points): joy bonus
  // - if too close to no-go boundary: eco penalty

  let ecoDelta = spec.ecoDelta;
  let joyDelta = spec.joyDelta;

  if (inNoGo) {
    ecoDelta -= 25;
    toastAI("Hey! Don’t build inside a sensitive core zone — wildlife needs quiet space.", "warn");
  } else {
    // tiny positive reinforcement
    toastAI("Nice placement. Trade-offs look reasonable.", "good");
  }

  // Proximity bonuses/penalties
  const waterPts = [L.latLng(-1.41, 34.87), L.latLng(-1.58, 34.68)];
  const corePts = [L.latLng(-1.52, 34.83), L.latLng(-1.63, 34.66)];

  const minWater = Math.min(...waterPts.map((p) => distMeters(p, latlng)));
  const minCore = Math.min(...corePts.map((p) => distMeters(p, latlng)));

  if (minWater < 3500) {
    joyDelta += 6;
    toastAI("Good view potential near water — visitors will love it.", "good");
  }

  if (minCore < 4200) {
    ecoDelta -= 8;
    toastAI("Careful — you’re close to a core habitat area. Eco health will drop.", "warn");
  }

  // Apply score changes
  eco += ecoDelta;
  joy += joyDelta;

  bumpGauge("eco");
  bumpGauge("joy");

  // Marker
  const icon = L.divIcon({
    className: "", // we'll use our own inner HTML
    html: facilityIconHtml(spec, inNoGo),
    iconSize: [34, 34],
    iconAnchor: [17, 28],
  });

  const m = L.marker(latlng, { icon, riseOnHover: true }).addTo(map);
  const id = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);

  m.on("add", () => {
    const el = m.getElement()?.querySelector(".facility-marker");
    if (!el) return;
    el.classList.add("is-bounce");
    setTimeout(() => el.classList.remove("is-bounce"), 260);
  });

  m.bindTooltip(`${spec.label}${inNoGo ? " (No-go!)" : ""}`, { direction: "top" });

  m.on("click", () => {
    setSelectedPlacement(id);
    toastAI(`Selected: ${spec.label}. You can remove it with the button below.`, "neutral");
  });
  

  let redRing = null;
  let greenRing = null;

  if (spec.redRadius > 0) {
    redRing = L.circle(latlng, {
      radius: spec.redRadius,
      color: "rgba(216,110,91,0.45)",
      weight: 1.5,
      dashArray: "6 6",
      fillColor: "rgba(216,110,91,0.04)",
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(map);
  }

  if (spec.greenRadius > 0) {
    greenRing = L.circle(latlng, {
      radius: spec.greenRadius,
      color: "rgba(156,191,123,0.55)",
      weight: 1.5,
      dashArray: "2 10",
      fillColor: "rgba(156,191,123,0.03)",
      fillOpacity: 0.10,
      interactive: false,
    }).addTo(map);
  }

  // Circle is below the layer
  try {
    if (redRing) redRing.bringToBack();
    if (greenRing) greenRing.bringToBack();
    m.bringToFront();
  } catch (_) {}

  placed.push({
    id,
    type: spec.tool,
    latlng,
    inNoGo,
    marker: m,
    ecoDelta,
    joyDelta,
    redRing,
    greenRing,
  });
  updateScoresUI();

  // Little "duang" on dock for positive feedback
  const dock = document.querySelector(".dock");
  if (dock) {
    dock.classList.remove("is-duang");
    void dock.offsetWidth;
    dock.classList.add("is-duang");
  }
}

function undoLast() {
  const last = placed.pop();
  if (!last) {
    toastAI("Nothing to undo yet.", "neutral");
    return;
  }

  // Revert scores
  eco -= last.ecoDelta;
  joy -= last.joyDelta;

  // Remove marker
  try { map.removeLayer(last.marker); } catch (_) {}
  try { if (last.redRing) map.removeLayer(last.redRing); } catch (_) {}
  try { if (last.greenRing) map.removeLayer(last.greenRing); } catch (_) {}

  toastAI("Undone. Try another placement for a better balance.", "neutral");
  updateScoresUI();
}

function clearAll() {
  placed.forEach((p) => {
    try { map.removeLayer(p.marker); } catch (_) {}
    try { if (p.redRing) map.removeLayer(p.redRing); } catch (_) {}
    try { if (p.greenRing) map.removeLayer(p.greenRing); } catch (_) {}
  });
  placed.length = 0;

  eco = 100;
  joy = 0;

  toastAI("Cleared. Fresh canvas!");
  updateScoresUI();
}

// -----------------------------
// View mode chips
// -----------------------------

function setViewMode(mode) {
  const mapEl = $("map");
  if (mapEl) mapEl.dataset.mode = mode;
}

function applyWildlifeVisibility(mode) {
  if (!map) return;

  // Always keep boundaries visible (workbench context)
  for (const lyr of [parkBoundaryLayer, parkBoundary2Layer]) {
    if (lyr && !map.hasLayer(lyr)) lyr.addTo(map);
  }
  try {
    parkBoundaryLayer?.bringToFront?.();
    parkBoundary2Layer?.bringToFront?.();
  } catch (_) {}

  // Trails: show only in habitat view (avoid clutter)
  const showTrails = mode === "habitat";
  for (const lyr of [wildebeestTracksLayer, lionTracksLayer]) {
    if (!lyr) continue;
    const has = map.hasLayer(lyr);
    if (showTrails && !has) lyr.addTo(map);
    if (!showTrails && has) map.removeLayer(lyr);
  }
}


// -----------------------------
// Save brief
// -----------------------------

function personalityFromScores(e, j) {
  if (e >= 80 && j >= 70) return "balanced conservationist";
  if (e >= 80) return "gentle conservationist";
  if (j >= 75) return "experience-first planner";
  if (e < 45 && j < 45) return "confused newcomer (needs iteration)";
  if (e < 45) return "aggressive developer";
  return "pragmatic designer";
}

function openBrief() {
  const dlg = $("brief-modal");
  if (!dlg) return;

  const noGoCount = placed.filter((p) => p.inNoGo).length;
  const noGoPct = placed.length ? Math.round((noGoCount / placed.length) * 100) : 0;

  const persona = personalityFromScores(eco, joy);
  const corridor = eco >= 70 ? "kept most migration corridors intact" : "fragmented some corridors";
  const wildlife = eco >= 70 ? "wildlife disturbance is relatively low" : "wildlife stress may increase";
  const visitor = joy >= 70 ? "visitors will have a high chance of memorable sightings" : "visitors may need longer detours to see wildlife";

  const text = [
    `《Mara–Serengeti Future Blueprint》`,
    `Generated: ${nowISO()}`,
    "",
    `You are a **${persona}**.`,
    `Eco-Health: **${Math.round(eco)}%** · Visitor Joy: **${Math.round(joy)}%** · No-go placement rate: **${noGoPct}%**.`,
    "",
    `In your plan, you ${corridor}. Overall, ${wildlife}, while ${visitor}.`,
    "",
    `Next step suggestions:`,
    `- Move any facilities away from red rings that overlap core habitats.`,
    `- Place viewpoints near water sources (green rings) for big Joy boosts.`,
    `- Keep restaurants and parking clustered to reduce traffic footprint.`,
  ].join("\n");

  const content = $("brief-content");
  if (content) content.textContent = text;

  if (typeof dlg.showModal === "function") dlg.showModal();
  else dlg.setAttribute("open", "open");
}

function closeBrief() {
  const dlg = $("brief-modal");
  if (!dlg) return;
  if (typeof dlg.close === "function") dlg.close();
  else dlg.removeAttribute("open");
}

async function copyBrief() {
  const content = $("brief-content");
  if (!content) return;
  const text = content.textContent || "";
  try {
    await navigator.clipboard.writeText(text);
    toastAI("Copied your blueprint text.", "good");
  } catch (_) {
    toastAI("Copy failed (browser permission). You can still select text manually.", "warn");
  }
}

// -----------------------------
// Boot
// -----------------------------
async function init() {
  setMapStatus("Initializing workbench…");

  try {
    await ensureLeaflet();
  } catch (err) {
    console.error(err);
    setMapStatus(
      "Leaflet failed to load. If your network blocks CDNs, download Leaflet locally or use a different network.",
      "error"
    );
    return;
  }

  // Create map
  map = L.map("map", {
    zoomControl: true,
    preferCanvas: true,
    attributionControl: false,
  }).setView([-1.52, 34.85], 10);

  // Tile sources with fallback
  useTileSource(0);

  // Make sure SVG exists for patterns
  map.on("layeradd", () => ensureSvgPattern());
  map.whenReady(() => {
    ensureSvgPattern();
    buildNoGoZones();
    buildHabitatOverlays();
    buildTrafficOverlays();
    updateScoresUI();
 
    ensureExternalGeoLayers().catch((e) => console.error(e));

  geoDataLoaded = true;

  const mode = $("map")?.dataset?.mode || "design";
  applyWildlifeVisibility(mode);

    setMapStatus("GeoJSON layers loaded.", "ok");
    hideMapStatus(650);

    setMapStatus("Canvas ready.", "ok");
    hideMapStatus(700);
  });

  // Fix render after layout settles
  setTimeout(() => map.invalidateSize(), 80);
  window.addEventListener("resize", () => map.invalidateSize());

  // Dock tools
  document.querySelectorAll(".tool-button[data-tool]").forEach((btn) => {
    btn.addEventListener("click", () => setActiveTool(btn.dataset.tool, { userInitiated: true }));
  });
  
// Score tab switching
  document.querySelectorAll(".score-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab || "overview";
      setScoreTab(tab);
      if (tab === "facilities") renderFacilityList();
    });
  });

  setScoreTab("overview");
  renderFacilityList();

  // Prevent dock clicks from triggering map placements underneath
  const dock = document.querySelector(".dock");
  if (dock && L?.DomEvent?.disableClickPropagation) {
    L.DomEvent.disableClickPropagation(dock);
    L.DomEvent.disableScrollPropagation(dock);
  }
  
  setActiveTool("lodge", { userInitiated: false, skipPrompt: true });

  // Undo / clear
  $("btn-undo")?.addEventListener("click", undoLast);
  $("btn-clear")?.addEventListener("click", clearAll);

  // Preview rings follow cursor
  map.on("mousemove", (e) => updatePreviewRings(e.latlng));

  // Place on click
  map.on("click", (e) => placeFacility(e.latlng));

  // View chips
  document.querySelectorAll('.ghost-chip[data-view]').forEach((chip) => {
  chip.addEventListener("click", () => {
    document
      .querySelectorAll('.ghost-chip[data-view]')
      .forEach((c) => c.classList.remove("ghost-chip--active"));
    chip.classList.add("ghost-chip--active");

    const view = chip.dataset.view;
    setViewMode(view);

    if (habitatLayer && map.hasLayer(habitatLayer)) {
      map.removeLayer(habitatLayer);
    }
    if (trafficLayer && map.hasLayer(trafficLayer)) {
      map.removeLayer(trafficLayer);
    }

    if (view === "habitat") {
      if (!habitatLayer) buildHabitatOverlays();
      habitatLayer?.addTo(map);
    } else if (view === "traffic") {
      buildTrafficOverlays();        
      trafficLayer?.addTo(map);
    }

    applyWildlifeVisibility(view);
  });
});

  // Scenario changes (demo text only)
  $("scenario-select")?.addEventListener("change", (e) => {
    const v = e.target.value;
    if (v === "dry") {
      toastAI("Dry season: herds cluster near the Mara River. Plan viewpoints carefully.");
    } else if (v === "wet") {
      toastAI("Wet season: calving grounds shift south. Keep routes flexible.");
    } else {
      toastAI("High tourist season: reduce congestion and spread facilities.");
    }
  });

  // Close side cards
  document.querySelectorAll("[data-close]").forEach((b) => {
    b.addEventListener("click", () => {
      const sel = b.getAttribute("data-close");
      if (!sel) return;
      const el = document.querySelector(sel);
      el?.classList.add("is-hidden");
    });
  });

  // Save brief
  $("btn-save-design")?.addEventListener("click", () => {
  openBrief();
  saveBlueprintToFirebase();
});
  $("btn-close-brief")?.addEventListener("click", closeBrief);
  $("btn-ok-brief")?.addEventListener("click", closeBrief);
  $("btn-copy-brief")?.addEventListener("click", copyBrief);
  $("brief-modal")?.addEventListener("click", (e) => {
    // clicking backdrop closes
    if (e.target?.id === "brief-modal") closeBrief();
  });

  // Calculate score
  $("btn-calc-score")?.addEventListener("click", () => {
    const noGoCount = placed.filter((p) => p.inNoGo).length;
    const noGoPct = placed.length ? Math.round((noGoCount / placed.length) * 100) : 0;

    const final = clamp(Math.round((eco * 0.55 + joy * 0.45) - noGoPct * 0.35), 0, 100);
    const out = $("design-score");
    if (out) {
      out.textContent = `Final score: ${final}/100  ·  Eco ${Math.round(eco)}%  ·  Joy ${Math.round(joy)}%  ·  No-go ${noGoPct}%`;
    }

    toastAI(final >= 80 ? "That’s a strong balance. Nice work!" : "Iterate a bit: reduce core-zone overlap for better Eco.");
  });
}

document.addEventListener("DOMContentLoaded", init);

async function saveBlueprintToFirebase() {
  const ecoScore = Math.round(eco);
  const joyScore = Math.round(joy);

  const total = placed.length || 1;
  const inNoGoCount = placed.filter((p) => p.inNoGo).length;
  const noGoRate = Math.round((inNoGoCount / total) * 100);

  const facilities = placed.map((p) => ({
    type: p.type,
    lat: p.latlng.lat,
    lng: p.latlng.lng,
    ecoDelta: p.ecoDelta,
    joyDelta: p.joyDelta,
    inNoGo: p.inNoGo,
  }));

  try {
    await addDoc(collection(db, "designs"), {
      createdAt: serverTimestamp(),
      ecoScore,
      joyScore,
      noGoRate,
      facilities,
    });
    toastAI("Saved to Firebase", "good");
  } catch (err) {
    console.error("Failed to save blueprint", err);
    toastAI("Oops, failed to save to Firebase. Check console.", "error");
  }
}
