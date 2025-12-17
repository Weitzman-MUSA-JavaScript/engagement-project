import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  increment
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase config (same as editor)
const firebaseConfig = {
  apiKey: "AIzaSyCXwJXxxwYzQCOgUN0n5bD15x5TjbiTnao",
  authDomain: "engagementdashboard-3426b.firebaseapp.com",
  projectId: "engagementdashboard-3426b",
  storageBucket: "engagementdashboard-3426b.firebasestorage.app",
  messagingSenderId: "1039039549246",
  appId: "1:1039039549246:web:b75fe509c8ce8b6adc266f"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const ROUTE_WEIGHT = 4.5;
const ROUTE_WEIGHT_HOVER = ROUTE_WEIGHT * 1.5;

// Map setup (same visual language as editor)
const map = L.map("viz-map", {
  zoomSnap: 0,
  scrollWheelZoom: true,
  zoomControl: false
});

const IMPROVEMENT_PANE = "improvement-overlay";
map.createPane(IMPROVEMENT_PANE);
const impPane = map.getPane(IMPROVEMENT_PANE);
if (impPane) {
  impPane.style.zIndex = "650";
  impPane.style.pointerEvents = "none";
}

const mapboxToken =
  "pk.eyJ1IjoiamluaGVuZ2MiLCJhIjoiY21mZWNtczV2MDVlNjJqb2xjYzIzaG1vYyJ9.3RSRjdENKBwjuf8_hhAqUA";
const mapboxStyleUrl =
  "https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=" +
  mapboxToken;

L.tileLayer(mapboxStyleUrl, {
  maxZoom: 20,
  zoomOffset: -1,
  tileSize: 512,
  crossOrigin: true,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &amp; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
}).addTo(map);

map.setView([39.952396, -75.163635], 14);

// UI refs
const introOverlay = document.getElementById("viewer-intro");
const introEnterMapBtn = document.getElementById("viewer-enter-map");
const introEnterGameBtn = document.getElementById("viewer-enter-game");
const enterGameBtn = document.getElementById("viz-enter-game");
const urlParams = new URLSearchParams(window.location.search);
const shouldSkipIntro = urlParams.has("from");
let submissions = [];

// Allow clicking images or the whole card to trigger the same action as the buttons
document.querySelectorAll(".intro-choice-card").forEach((card) => {
  const targetId = card.dataset.targetButton;
  const targetBtn = targetId ? document.getElementById(targetId) : null;
  if (!targetBtn) return;

  const triggerAction = () => {
    targetBtn.click();
  };

  card.addEventListener("click", triggerAction);
  card.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      triggerAction();
    }
  });

  const img = card.querySelector(".intro-choice-image");
  if (img) {
    img.style.pointerEvents = "auto";
    img.addEventListener("click", (evt) => {
      evt.stopPropagation();
      triggerAction();
    });
  }
});

const mapLayers = {
  stops: [],
  routes: []
};
const trailLayers = [];
const selectedOverlays = [];
let selectedTrailIndex = null;

const toLatLng = (val) => {
  if (!val) return null;
  // Support array format [lat, lng]
  if (Array.isArray(val) && val.length >= 2) {
    const lat = parseFloat(val[0]);
    const lng = parseFloat(val[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return L.latLng(lat, lng);
  }
  // Support objects with different key names (plain objects or GeoPoint)
  const pick = (obj, keys) => {
    for (const key of keys) {
      if (obj && key in obj) return obj[key];
    }
    return undefined;
  };
  const latRaw = pick(val, ["lat", "latitude"]);
  const lngRaw = pick(val, ["lng", "lon", "longitude"]);
  const toNum = (num) => {
    if (typeof num === "number") return num;
    if (typeof num === "string") {
      const parsed = parseFloat(num);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };
  const lat = toNum(latRaw);
  const lng = toNum(lngRaw);
  if (lat === null || lng === null) return null;
  return L.latLng(lat, lng);
};

const routeColors = ["#0d6efd", "#e83e8c", "#20c997", "#fd7e14", "#6f42c1", "#198754", "#d63384"];
const activityIcons = {
  "Walk & relax": { emoji: "🚶", bg: "#fbe4c9" },
  "Grab food/drinks": { emoji: "🥤", bg: "#f7ebbe" },
  "People-watch / see local life": { emoji: "🏠", bg: "#deeea0" },
  "See murals & public art": { emoji: "🖼️", bg: "#cbf3ca" },
  "Catch a community event": { emoji: "🎉", bg: "#c0efe9" },
  "Shop local / run small errands": { emoji: "🛍️", bg: "#c6ecfa" },
  "Sit & chat / take a break": { emoji: "💬", bg: "#c6ecfa" },
  "Share a local story / memory": { emoji: "📖", bg: "#c6ecfa" },
  Other: { emoji: "💡", bg: "#c6ecfa" }
};

const anonymousAdjectives = [
  "Quiet",
  "Hidden",
  "Friendly",
  "Curious",
  "Gentle",
  "Brave",
  "Bright",
  "Calm",
  "Kind",
  "Wandering"
];
const anonymousNouns = [
  "Explorer",
  "Neighbor",
  "Guide",
  "Pathfinder",
  "Storyteller",
  "Walker",
  "Navigator",
  "Dreamer",
  "Visitor",
  "Companion"
];
const anonNameCache = new Map();

const hashString = (value) => {
  const str = String(value || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const buildAnonymousName = (key) => {
  const hash = hashString(key);
  const adjective = anonymousAdjectives[hash % anonymousAdjectives.length];
  const noun = anonymousNouns[(hash >> 3) % anonymousNouns.length];
  const number = (hash % 900) + 100;
  return `${adjective} ${noun} #${number}`;
};

const getDisplayName = (submission) => {
  const data = submission?.data || {};
  if (data.nicknameVisible === true && data.nickname) return data.nickname;
  const cacheKey = submission?.id || data.submissionId || data.id || `anon-${anonNameCache.size + 1}`;
  if (anonNameCache.has(cacheKey)) return anonNameCache.get(cacheKey);
  const anonName = buildAnonymousName(cacheKey);
  anonNameCache.set(cacheKey, anonName);
  return anonName;
};

const buildImprovementLabelHtml = (imp) => {
  if (!imp) return "";
  const text =
    (imp.strategy ||
      imp.text ||
      imp.label ||
      imp.description ||
      imp.name ||
      imp.plan ||
      "").trim();
  const symbol = (imp.symbol || "").trim();
  if (!text && !symbol) return "";
  const symbolHtml = symbol ? `<span class="map-imp-symbol">${symbol}</span>` : "";
  const textHtml = text ? `<span class="map-imp-text">${text}</span>` : "";
  return `${symbolHtml}${textHtml}`;
};

const getStopRadius = (zoom) => {
  if (zoom >= 17) return 9;
  if (zoom >= 15) return 8;
  if (zoom >= 13) return 7;
  return 6;
};

const clearMapLayers = () => {
  mapLayers.stops.forEach((m) => map.removeLayer(m));
  mapLayers.routes.forEach((r) => map.removeLayer(r));
  mapLayers.stops = [];
  mapLayers.routes = [];
  trailLayers.length = 0;
};

const clearSelectionOverlays = () => {
  while (selectedOverlays.length) {
    const layer = selectedOverlays.pop();
    if (layer && map.hasLayer(layer)) map.removeLayer(layer);
  }
};

const addStopMarker = (stop, idx) => {
  const latlng = toLatLng(stop.latlng);
  if (!latlng) return null;
  const marker = L.circleMarker(latlng, {
    radius: getStopRadius(map.getZoom()),
    color: "#0d6efd",
    weight: 3,
    fillColor: "#fff",
    fillOpacity: 1
  }).addTo(map);
  const title = stop.name || `Stop ${stop.order || idx + 1}`;
  const body = [stop.reason, stop.plan].filter(Boolean).join("<br>");
  marker.bindPopup(`<strong>${title}</strong><br>${body}`);
  mapLayers.stops.push(marker);
  return marker;
};

const addRoutePolyline = (route, color) => {
  const pointsArray = Array.isArray(route.points)
    ? route.points
    : Array.isArray(route.latlngs)
      ? route.latlngs
      : Object.values(route.points || {});
  const latlngs = pointsArray.map(toLatLng).filter(Boolean);
  if (latlngs.length < 2) return null;
  const polyline = L.polyline(latlngs, {
    color: color || "#0d6efd",
    weight: ROUTE_WEIGHT,
    opacity: 0.9
  }).addTo(map);
  mapLayers.routes.push(polyline);
  return polyline;
};

const buildTrailTitle = (stopsArr) => {
  if (!stopsArr.length) return "No stops";
  const parts = stopsArr.map((stop, idx) => stop.name || `Stop ${idx + 1}`);
  return parts.join(" - ");
};

const getTrailIcon = (stopsArr) => {
  const firstPlan = stopsArr[0]?.plan || "Other";
  return activityIcons[firstPlan] || activityIcons.Other;
};

const renderTrailList = (list) => {
  const container = document.getElementById("trail-list");
  if (!container) return;
  container.innerHTML = "";
  list.forEach((item, idx) => {
    const data = item.data || {};
    const stopsArr = Array.isArray(data.stops) ? data.stops : Object.values(data.stops || {});
    const likes = Number(data.likes || 0);
    const icon = getTrailIcon(stopsArr);
    const card = document.createElement("div");
    card.className = "trail-card";
    const iconEl = document.createElement("div");
    iconEl.className = "trail-icon";
    iconEl.style.background = icon.bg;
    iconEl.textContent = icon.emoji;
    const info = document.createElement("div");
    info.className = "trail-info";
    const title = document.createElement("p");
    title.className = "trail-title";
    title.textContent = buildTrailTitle(stopsArr);
    const author = document.createElement("p");
    author.className = "trail-author";
    author.textContent = getDisplayName(item);
    info.appendChild(title);
    info.appendChild(author);
    card.appendChild(iconEl);
    card.appendChild(info);
    if (idx === selectedTrailIndex) card.classList.add("selected");
    const likeBtn = document.createElement("button");
    likeBtn.className = "like-btn trail-card-like";
    likeBtn.type = "button";
    likeBtn.setAttribute("aria-label", "Like trail");
    likeBtn.innerHTML = `
      <img src="${likes > 0 ? "pic/Like_active.png" : "pic/Link_unactive.png"}" alt="like" />
      <span class="trail-like-count">${likes}</span>
    `;
    likeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedTrailIndex = idx;
      handleLike(idx);
    });
    card.appendChild(likeBtn);
    card.addEventListener("mouseenter", () => highlightTrail(idx, true));
    card.addEventListener("mouseleave", () => highlightTrail(idx, false));
    card.addEventListener("click", () => selectTrail(idx));
    container.appendChild(card);
  });
};

const applyTrailHighlight = (activeIndex) => {
  trailLayers.forEach((_, i) => highlightTrail(i, i === activeIndex));
};

const setTrailCardSelection = (activeIndex) => {
  const container = document.getElementById("trail-list");
  if (!container) return;
  Array.from(container.children).forEach((card, idx) => {
    card.classList.toggle("selected", idx === activeIndex);
  });
};

const showTrailOverlays = (trail) => {
  clearSelectionOverlays();
  if (!trail) return;
  const data = trail.data || {};
  const stopsArr = Array.isArray(data.stops) ? data.stops : Object.values(data.stops || {});
  const routesArr = Array.isArray(data.routes) ? data.routes : Object.values(data.routes || {});
  stopsArr.forEach((stop, idx) => {
    const latlng = toLatLng(stop.latlng);
    if (!latlng) return;
    const orderNum = stop.order || idx + 1;
    const badge = L.marker(latlng, {
      icon: L.divIcon({
        className: "stop-number-marker",
        html: `<div class="stop-number-badge" style="background:${trail?.color || "#0d6efd"}; box-shadow: 0 0 0 2px ${trail?.color || "#0d6efd"}">${orderNum}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      }),
      interactive: false
    }).addTo(map);
    selectedOverlays.push(badge);
    (stop.improvements || []).forEach((imp) => {
      const impHtml = buildImprovementLabelHtml(imp);
      if (!impHtml) return;
      const impColor = trail?.color || "#0d6efd";
      const impMarker = L.marker(latlng, {
        icon: L.divIcon({
          className: "map-imp-wrapper",
          html: `<div class="map-imp-label" style="background:${impColor}">${impHtml}</div>`,
          iconSize: null
        }),
        pane: IMPROVEMENT_PANE,
        interactive: false
      }).addTo(map);
      selectedOverlays.push(impMarker);
    });
  });
  routesArr.forEach((route) => {
    (route.improvements || []).forEach((imp) => {
      const latlng = toLatLng(imp.latlng);
      if (!latlng) return;
      const impHtml = buildImprovementLabelHtml(imp);
      if (!impHtml) return;
      const impColor = trail?.color || "#0d6efd";
      const impPoint = L.circleMarker(latlng, {
        radius: 7,
        color: impColor,
        weight: 3,
        fillColor: "#fff",
        fillOpacity: 1,
        pane: IMPROVEMENT_PANE
      })
        .addTo(map)
        .bringToFront();
      selectedOverlays.push(impPoint);
      const impMarker = L.marker(latlng, {
        icon: L.divIcon({
          className: "map-imp-wrapper",
          html: `<div class="map-imp-label" style="background:${impColor}">${impHtml}</div>`,
          iconSize: null
        }),
        pane: IMPROVEMENT_PANE,
        interactive: false
      }).addTo(map);
      selectedOverlays.push(impMarker);
    });
  });
};

const renderTrailDetail = (index) => {
  const panel = document.getElementById("trail-detail");
  if (!panel) return;
  const trail = trailLayers[index];
  if (!trail) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }
  panel.classList.remove("hidden");
  const data = trail.data || {};
  const stopsArr = trail.stopsArr || [];
  const routesArr = Array.isArray(data.routes) ? data.routes : Object.values(data.routes || {});
  const icon = getTrailIcon(stopsArr);
  const titleText = buildTrailTitle(stopsArr);
  const authorText = getDisplayName(trail);
  const likes = Number(data.likes || 0);
  const likeIcon = likes > 0 ? "pic/Like_active.png" : "pic/Link_unactive.png";

  const steps = [];
  const routeByPair = new Map();
  routesArr.forEach((r) => {
    if (r.fromIndex && r.toIndex) {
      routeByPair.set(`${r.fromIndex}-${r.toIndex}`, r);
    }
  });
  stopsArr.forEach((stop, idx) => {
    steps.push({ kind: "stop", stop, idx });
    const key = `${idx + 1}-${idx + 2}`;
    const route = routeByPair.get(key);
    if (route && Array.isArray(route.improvements) && route.improvements.length) {
      steps.push({ kind: "route", route, idx });
    }
  });

  const stepsHtml = steps
    .map((step, sIdx) => {
      const isLast = sIdx === steps.length - 1;
      if (step.kind === "stop") {
        const reason =
          step.stop.reason ||
          step.stop.recommendation ||
          step.stop.recommended_reason ||
          step.stop.recommendedReason ||
          step.stop.description ||
          "";
        const imps = (step.stop.improvements || [])
          .map((imp) => `<span class="trail-imp">${imp.symbol || ""} ${imp.strategy || ""}</span>`)
          .join("");
        const stopNumber = step.stop.order || step.idx + 1;
        return `
          <div class="trail-step">
              <div class="trail-step-rail">
                <div class="trail-step-dot stop-dot" style="color:${trail.color}; background:#fff;"><span>${stopNumber}</span></div>
              ${
                isLast
                  ? ""
                  : `<div class="trail-step-line" style="background:${trail.color};"></div>`
              }
              </div>
              <div class="trail-step-card">
                <p class="trail-step-title">Stop ${stopNumber}: ${step.stop.name || `Stop ${step.idx + 1}`}</p>
                <div class="trail-step-section">
                  <p class="trail-step-label">recommended activity</p>
                  <p class="trail-step-activity">${step.stop.plan || "Activity"}</p>
                </div>
                ${
                  reason
                    ? `<div class="trail-step-section">
                        <p class="trail-step-label">recommended reason</p>
                        <p class="trail-step-reason">${reason}</p>
                      </div>`
                    : ""
                }
                ${
                  imps
                    ? `<div class="trail-step-section">
                        <div class="trail-imp-section">
                          <div class="trail-imp-row">
                            <p class="trail-step-label">recommended improvements:</p>
                            <div class="trail-imp-list">${imps}</div>
                          </div>
                          <button class="like-btn trail-imp-like" type="button" aria-label="Like trail improvements">
                            <img src="${likeIcon}" alt="like" />
                            <span class="trail-like-count">${likes}</span>
                          </button>
                        </div>
                      </div>`
                    : ""
                }
            </div>
          </div>
        `;
      }
      const imps = (step.route.improvements || [])
        .map((imp) => `<span class="trail-imp">${imp.symbol || ""} ${imp.strategy || ""}</span>`)
        .join("");
      return `
        <div class="trail-step">
          <div class="trail-step-rail">
            <div class="trail-route-line" style="background:${trail.color};"></div>
            ${
              isLast
                ? ""
                : `<div class="trail-step-line" style="background:${trail.color};"></div>`
            }
          </div>
          <div class="trail-step-card">
            <p class="trail-step-title">Route ${step.route.fromIndex || ""} - ${step.route.toIndex || ""}</p>
            ${
              imps
                ? `<div class="trail-step-section">
                    <div class="trail-imp-section">
                      <div class="trail-imp-row">
                        <p class="trail-step-label">recommended improvements:</p>
                        <div class="trail-imp-list">${imps}</div>
                      </div>
                      <button class="like-btn trail-imp-like" type="button" aria-label="Like trail improvements">
                        <img src="${likeIcon}" alt="like" />
                        <span class="trail-like-count">${likes}</span>
                      </button>
                    </div>
                  </div>`
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");

  panel.innerHTML = `
    <div class="trail-detail-header">
      <div class="trail-detail-meta">
        <div class="trail-icon" style="background:${icon.bg}">${icon.emoji}</div>
        <div class="trail-detail-texts">
          <p class="trail-detail-title">${titleText}</p>
          <p class="trail-detail-author">${authorText}</p>
        </div>
      </div>
      <button class="like-btn" id="trail-like-btn" type="button" aria-label="Like trail">
        <img src="${likes > 0 ? "pic/Like_active.png" : "pic/Link_unactive.png"}" alt="like" />
        <span id="trail-like-count">${likes}</span>
      </button>
    </div>
    <div class="trail-steps">
      ${stepsHtml || "<p class='trail-detail-author'>No steps yet.</p>"}
    </div>
  `;

  const likeBtn = document.getElementById("trail-like-btn");
  likeBtn?.addEventListener("click", () => handleLike(index));
  document.querySelectorAll(".trail-imp-like").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleLike(index);
    });
  });
};

const selectTrail = (index) => {
  selectedTrailIndex = index;
  applyTrailHighlight(index);
  const trail = trailLayers[index];
  setTrailCardSelection(index);
  renderTrailDetail(index);
  showTrailOverlays(trail);
  if (trail?.bounds) {
    map.fitBounds(trail.bounds, { paddingTopLeft: [200, 140], paddingBottomRight: [200, 140] });
  }
};

const renderSubmissions = (list) => {
  clearMapLayers();
  trailLayers.length = 0;
  let stopOffset = 0;
  list.forEach((item, idx) => {
    const color = routeColors[idx % routeColors.length];
    const data = item.data || {};
    const stopsArr = Array.isArray(data.stops) ? data.stops : Object.values(data.stops || {});
    const stopsByOrder = new Map();
    const trailStops = [];
    const boundsPoints = [];
    stopsArr.forEach((stop, stopIdx) => {
      const marker = addStopMarker(stop, stopIdx);
      const latlng = toLatLng(stop.latlng);
      if (marker) {
        marker.on("click", () => selectTrail(idx));
        trailStops.push(marker);
      }
      if (latlng) boundsPoints.push(latlng);
    });
    mapLayers.stops.slice(stopOffset, stopOffset + stopsArr.length).forEach((marker) => {
      if (marker.setStyle) marker.setStyle({ color, weight: 3, fillColor: "#fff" });
    });
    stopOffset += stopsArr.length;
    stopsArr.forEach((stop, stopIdx) => {
      const order = stop.order || stopIdx + 1;
      const latlng = toLatLng(stop.latlng);
      if (latlng) stopsByOrder.set(order, latlng);
    });
    const trailRoutes = [];
    (Array.isArray(data.routes) ? data.routes : Object.values(data.routes || {})).forEach((route) =>
      {
        const pointsArray = Array.isArray(route.points)
          ? route.points
          : Array.isArray(route.latlngs)
            ? route.latlngs
            : Object.values(route.points || {});
        const latlngs = pointsArray.map(toLatLng).filter(Boolean);
        const fromLL = stopsByOrder.get(route.fromIndex);
        const toLL = stopsByOrder.get(route.toIndex);
        if (fromLL) {
          if (latlngs.length) latlngs[0] = fromLL;
          else latlngs.push(fromLL);
        }
        if (toLL) {
          if (latlngs.length > 1) latlngs[latlngs.length - 1] = toLL;
          else if (latlngs.length === 1) latlngs.push(toLL);
          else latlngs.push(toLL);
        }
        if (latlngs.length < 2) return;
        const polyline = L.polyline(latlngs, {
          color,
          weight: ROUTE_WEIGHT,
          opacity: 0.9
        }).addTo(map);
        polyline.on("click", () => selectTrail(idx));
        mapLayers.routes.push(polyline);
        trailRoutes.push(polyline);
        boundsPoints.push(...latlngs);
      }
    );
    const bounds =
      boundsPoints.length >= 2 ? L.latLngBounds(boundsPoints) : boundsPoints[0] ? L.latLngBounds(boundsPoints[0], boundsPoints[0]) : null;
    trailLayers.push({ color, stops: trailStops, routes: trailRoutes, id: item.id, data, bounds, stopsArr });
  });
  mapLayers.routes.forEach((line) => line.bringToBack && line.bringToBack());
  mapLayers.stops.forEach((marker) => marker.bringToFront && marker.bringToFront());
};

const loadAllSubmissions = async () => {
  try {
    const snap = await getDocs(collection(db, "submissions"));
    submissions = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      submissions.push({ id: docSnap.id, data });
    });
    renderSubmissions(submissions);
    renderTrailList(submissions);
    setTrailCardSelection(selectedTrailIndex);
  } catch (error) {
    console.error("Failed to load submissions", error);
  }
};

const highlightTrail = (index, isActive) => {
  const trail = trailLayers[index];
  if (!trail) return;
  if (selectedTrailIndex === index) isActive = true;
  const stopFill = isActive ? trail.color : "#fff";
  const baseRadius = getStopRadius(map.getZoom());
  const radius = isActive ? baseRadius + 4 : baseRadius;
  trail.stops.forEach((marker) => {
    if (marker.setStyle)
      marker.setStyle({ fillColor: stopFill, color: trail.color, weight: 3, radius });
    if (marker.bringToFront) marker.bringToFront();
  });
  trail.routes.forEach((line) => {
    if (line.setStyle) line.setStyle({ weight: isActive ? ROUTE_WEIGHT_HOVER : ROUTE_WEIGHT, color: trail.color });
    if (isActive && line.bringToFront) line.bringToFront();
    if (!isActive && line.bringToBack) line.bringToBack();
  });
};

const handleLike = async (index) => {
  const trail = trailLayers[index];
  if (!trail) return;
  const docId = trail.id;
  if (!docId) return;
  const currentLikes = Number(trail.data?.likes || 0);
  const newLikes = currentLikes + 1;
  try {
    await updateDoc(doc(db, "submissions", docId), { likes: increment(1) });
    trail.data.likes = newLikes;
    const match = submissions[index];
    if (match) match.data.likes = newLikes;
    renderTrailList(submissions);
    renderTrailDetail(index);
  } catch (error) {
    console.error("Failed to like trail", error);
  }
};

const hideIntro = () => {
  if (!introOverlay) return;
  introOverlay.classList.add("hidden");
};

introEnterMapBtn?.addEventListener("click", hideIntro);
introEnterGameBtn?.addEventListener("click", () => {
  window.location.href = "design.html";
});

introOverlay?.addEventListener("click", (e) => {
  if (e.target === introOverlay) hideIntro();
});

enterGameBtn?.addEventListener("click", () => {
  window.location.href = "design.html";
});

if (shouldSkipIntro) {
  hideIntro();
}

map.on("zoomend", () => {
  applyTrailHighlight(selectedTrailIndex);
  const selected = selectedTrailIndex != null ? trailLayers[selectedTrailIndex] : null;
  if (selected) {
    const activeRadius = getStopRadius(map.getZoom()) + 4;
    selected.stops.forEach((marker) => {
      if (marker.setStyle) {
        marker.setStyle({
          radius: activeRadius,
          fillColor: selected.color,
          color: selected.color,
          weight: 3
        });
      }
      if (marker.bringToFront) marker.bringToFront();
    });
    selected.routes.forEach((line) => line.bringToFront && line.bringToFront());
    selectedOverlays.forEach((ov) => ov.bringToFront && ov.bringToFront());
  }
});

// Initial load
loadAllSubmissions();
