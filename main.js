import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, serverTimestamp, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase configuration (kept for future use)
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

// Map setup
const map = L.map("map", {
  zoomSnap: 0,
  scrollWheelZoom: true,
  zoomControl: false
});
const mapEl = document.getElementById("map");

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

// Sidebar + overlays
const sidebar = document.getElementById("sidebar");
const sidebarContent = document.getElementById("sidebar-content");
const sidebarLeftBtn = document.getElementById("sidebar-left-btn");
const sidebarRightBtn = document.getElementById("sidebar-right-btn");
const sidebarToast = document.getElementById("sidebar-toast");
const progressNodes = Array.from(document.querySelectorAll(".progress-node"));
const progressLines = Array.from(document.querySelectorAll(".progress-line"));
const thankYouOverlay = document.getElementById("thank-you-overlay");
const thankYouBackBtn = document.getElementById("thank-you-back");
const thankYouSubmitBtn = document.getElementById("thank-you-submit");
const thankYouDownloadBtn = document.getElementById("thank-you-download");
const nicknameInput = document.getElementById("nickname-input");
const nicknameVisibleToggle = document.getElementById("nickname-visible");
const MAX_STOPS = 20;
let isGameActive = false;
let pendingStop = null;
const stops = [];
const routes = [];
let currentStep = 0;
let stopListEl = null;
let routeListEl = null;
let drawingRoute = null;
let improvementPanelEl = null;
let improvementMode = "stop";
let activeImprovementId = null;
let pendingRoutePlacement = null;
let toastTimeout = null;
const showToast = (message) => {
  if (!sidebarToast) return;
  sidebarToast.textContent = message;
  sidebarToast.classList.remove("hidden");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    sidebarToast?.classList.add("hidden");
  }, 1600);
};

const showThankYouOverlay = () => {
  if (!thankYouOverlay) return;
  thankYouOverlay.classList.remove("hidden");
  thankYouOverlay.setAttribute("aria-hidden", "false");
};

const hideThankYouOverlay = () => {
  if (!thankYouOverlay) return;
  thankYouOverlay.classList.add("hidden");
  thankYouOverlay.setAttribute("aria-hidden", "true");
  if (nicknameInput) nicknameInput.value = "";
  if (nicknameVisibleToggle) nicknameVisibleToggle.checked = false;
};

const createSubmissionId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sub-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const serializeLatLng = (latlng) =>
  latlng && typeof latlng.lat === "number" && typeof latlng.lng === "number"
    ? { lat: latlng.lat, lng: latlng.lng }
    : null;

const serializeStops = () =>
  stops.map((stop, idx) => ({
    id: stop.id,
    order: idx + 1,
    name: stop.data?.name || "",
    reason: stop.data?.reason || "",
    plan: stop.data?.plan || "",
    latlng: serializeLatLng(stop.latlng),
    improvements: (stop.improvements || []).map((imp) => ({
      id: imp.id,
      title: imp.title,
      symbol: imp.symbol,
      strategy: imp.strategy
    }))
  }));

const serializeRoutes = () =>
  routes.map((route) => ({
    id: route.id,
    fromIndex: route.fromIndex,
    toIndex: route.toIndex,
    status: route.status,
    points: (route.points || []).map((p) => serializeLatLng(p)).filter(Boolean),
    improvements: (route.improvements || []).map((imp) => ({
      id: imp.id,
      title: imp.title,
      symbol: imp.symbol,
      strategy: imp.strategy,
      latlng: serializeLatLng(imp.latlng)
    }))
  }));

const saveSubmission = async () => {
  const submissionId = createSubmissionId();
  try {
    const payload = {
      submissionId,
      createdAt: serverTimestamp(),
      nickname: nicknameInput?.value.trim() || "",
      nicknameVisible: Boolean(nicknameVisibleToggle?.checked),
      stops: serializeStops(),
      routes: serializeRoutes()
    };
    await setDoc(doc(db, "submissions", submissionId), payload);
    return submissionId;
  } catch (error) {
    console.error("Failed to save submission", error);
    return null;
  }
};

const downloadThankYouImage = async () => {
  let html2canvasFn = window.html2canvas;
  if (!html2canvasFn) {
    try {
      const mod = await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
      html2canvasFn = mod.default || window.html2canvas;
    } catch (err) {
      console.error("html2canvas failed to load", err);
      showToast("Download unavailable right now.");
      return;
    }
  }
  if (!thankYouOverlay) return;
  const letter = thankYouOverlay.querySelector(".thank-you-letter");
  if (!letter) return;
  const downloadBtn = letter.querySelector(".thank-you-download");
  try {
    if (downloadBtn) downloadBtn.classList.add("export-hide");
    const canvas = await html2canvasFn(letter, {
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#fdf8f5",
      scale: Math.max(2.5, window.devicePixelRatio || 1)
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "thank-you.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Unable to download card", error);
    showToast("Download unavailable right now.");
  } finally {
    if (downloadBtn) downloadBtn.classList.remove("export-hide");
  }
};
const setDrawingCursor = (isActive) => {
  if (!mapEl) return;
  if (isActive) {
    mapEl.classList.add("map-drawing");
  } else {
    mapEl.classList.remove("map-drawing");
  }
};

const syncDrawingCursor = () => {
  const shouldShow =
    isGameActive &&
    ((currentStep === 1 && Boolean(drawingRoute)) ||
      (currentStep === 2 && Boolean(pendingRoutePlacement)));
  setDrawingCursor(shouldShow);
};

const showSidebar = () => {
  sidebar?.classList.remove("hidden");
};

const updateProgressUI = (step) => {
  progressNodes.forEach((node, idx) => {
    node.classList.remove("complete", "current");
    if (idx < step) {
      node.classList.add("complete");
    } else if (idx === step) {
      node.classList.add("current");
    }
  });

  progressLines.forEach((line, idx) => {
    line.classList.toggle("complete", idx < step);
  });
};

const setStep = (step) => {
  currentStep = Math.max(0, Math.min(step, progressNodes.length - 1));
  pendingRoutePlacement = null;
  if (step !== 2) {
    activeImprovementId = null;
  }
  updateProgressUI(currentStep);
  renderSidebarContent();
  updateStepControls();
  clearHighlightedStops();
  if (currentStep !== 1) {
    drawingRoute = null;
  }
  syncDrawingCursor();
};

const stopOptions = [
  "Walk & relax",
  "Grab food/drinks",
  "People-watch / see local life",
  "See murals & public art",
  "Catch a community event",
  "Shop local / run small errands",
  "Sit & chat / take a break",
  "Share a local story / memory",
  "Other"
];

const pointImprovementOptions = [
  {
    id: "seating",
    symbol: "🪑",
    title: "Seating & Shade",
    shortLabel: "Seating & Shade",
    details: "Benches, shade trees, canopies",
    strategies: ["Benches", "Shade trees", "Canopies"]
  },
  {
    id: "pocket-plaza",
    symbol: "⛲",
    title: "Pocket Plaza",
    shortLabel: "Pocket Plaza",
    details: "Wider sidewalks, mini plazas",
    strategies: ["Widen sidewalks", "Add community plaza"]
  },
  {
    id: "local-business",
    symbol: "🏬",
    title: "Support Local Business",
    shortLabel: "Support Local Business",
    details: "Street vendors, outdoor seating, queuing space, signage",
    strategies: [
      "Street kiosks",
      "Outdoor dining zone",
      "Queueing space",
      "Wayfinding to local shops"
    ]
  },
  {
    id: "garden",
    symbol: "🌴",
    title: "Community Garden / Greening",
    shortLabel: "Community Garden",
    details: "Community gardens, tree pit upgrades, planters",
    strategies: ["Community garden", "Tree pit upgrade", "Flower beds"]
  },
  {
    id: "event-space",
    symbol: "🥳",
    title: "Flexible Event Space",
    shortLabel: "Event Space",
    details: "Pop-up performances, markets, neighborhood events",
    strategies: [
      "Pop-up performance space",
      "Temporary market setup",
      "Neighborhood gathering zone"
    ]
  },
  {
    id: "safety",
    symbol: "🚨",
    title: "Lighting & Safety",
    shortLabel: "Lighting & Safety",
    details: "Better lighting, more patrols",
    strategies: ["Lighting upgrade", "Increase patrol presence"]
  },
  {
    id: "accessibility",
    symbol: "♿",
    title: "Accessibility Upgrade",
    shortLabel: "Accessibility",
    details: "Ramps, curb transitions, wheelchair/stroller friendly paths",
    strategies: [
      "Add ramps",
      "Improve curb transitions",
      "Wheelchair/stroller friendly surface"
    ]
  },
  {
    id: "wayfinding",
    symbol: "🪧",
    title: "Wayfinding & Story Marker",
    shortLabel: "Wayfinding",
    details: "Info boards, QR stories, bulletin upgrades, guides",
    strategies: [
      "Install info board",
      "Add QR story marker",
      "Upgrade community bulletin board",
      "Directional signage"
    ]
  },
  {
    id: "bike-parking",
    symbol: "🚲",
    title: "Bike / Scooter Parking",
    shortLabel: "Bike Parking",
    details: "Bike racks, shared parking areas",
    strategies: [
      "Bike racks",
      "Shared parking zone",
      "Organized scooter parking"
    ]
  },
  {
    id: "point-other",
    symbol: "💡",
    title: "Other",
    shortLabel: "Other",
    details: "Describe another idea",
    strategies: []
  }
];

const routeImprovementOptions = [
  {
    id: "sidewalk",
    symbol: "🚶",
    title: "Sidewalk Upgrade",
    shortLabel: "Sidewalk Upgrade",
    details: "Widening, repairs, continuous accessible link",
    strategies: [
      "Widening",
      "Repairs",
      "Continuous link",
      "Accessible upgrades",
      "Remove gaps"
    ]
  },
  {
    id: "crossing",
    symbol: "🚦",
    title: "Safe Crossing",
    shortLabel: "Safe Crossing",
    details: "Zebra crossings, signals, shorter crossings, lighting",
    strategies: [
      "Zebra crossings",
      "Signals",
      "Shorter crossings",
      "Intersection lighting"
    ]
  },
  {
    id: "traffic-calming",
    symbol: "🚗",
    title: "Traffic Calming",
    shortLabel: "Traffic Calming",
    details: "Speed bumps, raised intersections, narrower lanes",
    strategies: [
      "Speed humps",
      "Raised intersection",
      "Narrow lanes",
      "Curb management"
    ]
  },
  {
    id: "bike-facility",
    symbol: "🚴",
    title: "Bike Facility",
    shortLabel: "Bike Facility",
    details: "Bike lanes, shared markings, close gaps",
    strategies: [
      "Dedicated bike lane",
      "Shared lane markings",
      "Connect missing link"
    ]
  },
  {
    id: "route-other",
    symbol: "💡",
    title: "Other",
    shortLabel: "Other",
    details: "Describe another idea",
    strategies: []
  }
];

const buildCatalogCard = (option, isActive) => `
  <div class="catalog-card${isActive ? " active" : ""}" data-improvement-id="${option.id}">
    <div class="catalog-card-header">
      <div class="catalog-card-title">
        <span class="improvement-symbol">${option.symbol}</span>
        <span class="improvement-title">${option.title}</span>
      </div>
      <span class="catalog-toggle">${isActive ? "−" : "+"}</span>
    </div>
    ${isActive ? (improvementMode === "stop" ? renderStopCardBody(option) : renderRouteCardBody(option)) : ""}
  </div>
`;

const renderStopCardBody = (option) => {
  if (!stops.length) {
    return '<p class="improvement-note">Add stops in Step 1 to assign improvements.</p>';
  }

  const stopOptionsHtml = stops
    .map(
      (stop) =>
        `<option value="${stop.id}">Stop ${stop.index}${stop.data?.name ? `: ${escapeHtml(stop.data.name)}` : ""}</option>`
    )
    .join("");

  const strategyInputs = option.strategies.length
    ? option.strategies
        .map(
          (strategy, idx) =>
            `<label class="strategy-option"><input type="radio" name="strategy-${option.id}" value="${escapeHtml(
              strategy
            )}" ${idx === 0 ? "checked" : ""}/> ${strategy}</label>`
        )
        .join("")
    : "";

  const otherField =
    option.id === "point-other"
      ? '<textarea class="text-input" data-input="custom-strategy" placeholder="Describe your idea"></textarea>'
      : "";

  return `
    <div class="catalog-body">
    <form class="improvement-form" data-form-type="stop" data-option-id="${option.id}">
      <label class="field-label">Select stop</label>
      <select class="text-input" data-input="stop-select">${stopOptionsHtml}</select>
      <label class="field-label">Strategy</label>
      <div class="strategy-group">
        ${
          strategyInputs ||
          '<p class="improvement-note">Describe your idea below.</p>'
        }
      </div>
      ${otherField}
      <button type="submit" class="primary-btn full-width">Add improvement</button>
    </form>
    </div>
  `;
};

const renderRouteCardBody = (option) => {
  if (!routes.length) {
    return '<p class="improvement-note">Complete Step 2 to add routes.</p>';
  }

  const routeOptionsHtml = routes
    .map(
      (route) =>
        `<option value="${route.id}">Stop ${route.fromIndex} to Stop ${route.toIndex}</option>`
    )
    .join("");

  const strategyInputs = option.strategies.length
    ? option.strategies
        .map(
          (strategy, idx) =>
            `<label class="strategy-option"><input type="radio" name="strategy-${option.id}" value="${escapeHtml(
              strategy
            )}" ${idx === 0 ? "checked" : ""}/> ${strategy}</label>`
        )
        .join("")
    : "";

  const otherField =
    option.id === "route-other"
      ? '<textarea class="text-input" data-input="custom-strategy" placeholder="Describe your idea"></textarea>'
      : "";

  return `
    <div class="catalog-body">
    <form class="improvement-form" data-form-type="route" data-option-id="${option.id}">
      <label class="field-label">Select route</label>
      <select class="text-input" data-input="route-select">${routeOptionsHtml}</select>
      <label class="field-label">Strategy</label>
      <div class="strategy-group">
        ${
          strategyInputs ||
          '<p class="improvement-note">Describe your idea below.</p>'
        }
      </div>
      ${otherField}
      <p class="improvement-note">After submitting, click on the selected route to place the improvement.</p>
      <button type="submit" class="primary-btn full-width">Select & place</button>
    </form>
    </div>
  `;
};

const getImprovementOption = (mode, optionId) =>
  (mode === "stop" ? pointImprovementOptions : routeImprovementOptions).find((opt) => opt.id === optionId);

const bindImprovementModeButtons = () => {
  const buttons = sidebarContent?.querySelectorAll("[data-improvement-mode]");
  buttons?.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.improvementMode;
      if (!mode || mode === improvementMode) return;
      improvementMode = mode;
      activeImprovementId = null;
      pendingRoutePlacement = null;
      resetRouteStyles();
      syncDrawingCursor();
      renderImprovementPanel();
    });
  });
  updateModeButtons();
};

const updateModeButtons = () => {
  const buttons = sidebarContent?.querySelectorAll("[data-improvement-mode]");
  buttons?.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.improvementMode === improvementMode);
  });
};

const highlightRouteForPlacement = (route) => {
  resetRouteStyles();
  if (route?.polyline) {
    route.polyline.setStyle({
      color: "#ff7b00",
      weight: 4,
      opacity: 1
    });
  }
};

const renderImprovementPanel = () => {
  if (!improvementPanelEl) return;
  const dataset = improvementMode === "stop" ? pointImprovementOptions : routeImprovementOptions;
  const cards = dataset.map((option) => buildCatalogCard(option, activeImprovementId === option.id)).join("");
  improvementPanelEl.innerHTML =
    cards || '<p class="improvement-note">No improvements available for this mode.</p>';

  improvementPanelEl.querySelectorAll(".catalog-card-header").forEach((header) => {
    header.addEventListener("click", () => {
      const card = header.closest(".catalog-card");
      const optionId = card?.dataset.improvementId;
      if (!optionId) return;
      if (activeImprovementId === optionId) {
        activeImprovementId = null;
        pendingRoutePlacement = null;
        resetRouteStyles();
        syncDrawingCursor();
      } else {
        activeImprovementId = optionId;
        pendingRoutePlacement = null;
        resetRouteStyles();
        syncDrawingCursor();
      }
      renderImprovementPanel();
    });
  });

  improvementPanelEl.querySelectorAll(".improvement-form").forEach((form) => {
    const type = form.dataset.formType;
    if (type === "stop") {
      form.addEventListener("submit", (event) => handleStopImprovementFormSubmit(event, form));
    } else if (type === "route") {
      form.addEventListener("submit", (event) => handleRouteImprovementFormSubmit(event, form));
    }
  });

  updateModeButtons();
};

const renderStep1Content = () => {
  if (!sidebarContent) return;
  sidebarContent.innerHTML = `
    <div class="sidebar-section">
      <h3>Stops</h3>
      <p class="sidebar-hint">
        Where in the neighborhood will you take your friends? Pick your destinations on the map.
        <span class="sidebar-hint-action">Action: Click the map to add stops (up to 20). Drag the badges in the sidebar to reorder.</span>
      </p>
      <div id="stop-list" class="stop-list"></div>
    </div>
  `;
  stopListEl = sidebarContent.querySelector("#stop-list");
  routeListEl = null;
  improvementPanelEl = null;
  if (sidebarLeftBtn) sidebarLeftBtn.textContent = "Exit";
  if (sidebarRightBtn) sidebarRightBtn.textContent = "Next";
  renderStops();
  updateStepControls();
};

const renderStep2Content = () => {
  if (!sidebarContent) return;
  sidebarContent.innerHTML = `
    <div class="sidebar-section">
      <h3>Routes</h3>
      <p class="sidebar-hint">
        Which route will you take your friends on? Draw your path on the map.
        <span class="sidebar-hint-action">Action: Draw routes connecting your stops.</span>
      </p>
      <div id="route-list" class="route-list"></div>
    </div>
  `;
  stopListEl = null;
  routeListEl = sidebarContent.querySelector("#route-list");
  improvementPanelEl = null;
  if (sidebarLeftBtn) sidebarLeftBtn.textContent = "Back";
  if (sidebarRightBtn) sidebarRightBtn.textContent = "Next";
  if (!routes.length) {
    buildRoutes();
  }
  renderRoutes();
  updateStepControls();
};

const renderStep3Content = () => {
  if (!sidebarContent) return;
  sidebarContent.innerHTML = `
    <div class="sidebar-section">
      <h3>Suggest improvements</h3>
      <p class="sidebar-hint">
        If you think "this place could be better" while touring, what would that be?
        <span class="sidebar-hint-action">Action: Choose the improvement you need, apply it to the stop or route, or click stops and routes on the map to add it.</span>
      </p>
      <div class="improvement-mode-toggle">
        <button type="button" class="mode-btn" data-improvement-mode="stop">For stops</button>
        <button type="button" class="mode-btn" data-improvement-mode="route">For routes</button>
      </div>
      <div id="improvement-panel" class="improvement-card-list catalog-list"></div>
    </div>
  `;
  stopListEl = null;
  routeListEl = null;
  improvementPanelEl = sidebarContent.querySelector("#improvement-panel");
  if (sidebarLeftBtn) sidebarLeftBtn.textContent = "Back";
  if (sidebarRightBtn) {
    sidebarRightBtn.textContent = "Finish";
    sidebarRightBtn.disabled = false;
  }
  resetRouteStyles();
  bindImprovementModeButtons();
  renderImprovementPanel();
};

const renderSidebarContent = () => {
  if (currentStep === 0) {
    renderStep1Content();
  } else if (currentStep === 1) {
    renderStep2Content();
  } else {
    renderStep3Content();
  }
};

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const createStopIcon = (index, highlighted = false) =>
  L.divIcon({
    className: "stop-marker",
    html: `<div class="stop-marker-inner${highlighted ? " highlight" : ""}">${index}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

const validateStopForm = (nameInput, reasonInput, planSelect, planOtherInput) => {
  const name = nameInput.value.trim();
  const reason = reasonInput.value.trim();
  const plan =
    planSelect.value === "Other"
      ? planOtherInput.value.trim()
      : planSelect.value;
  return Boolean(name && reason && plan);
};

const createStopForm = (
  index,
  marker,
  latlng,
  existingData = null,
  onConfirm
) => {
  const container = document.createElement("form");
  container.className = "stop-form";

  const nameLabel = document.createElement("label");
  nameLabel.textContent = `Stop ${index}:`;
  const nameInput = document.createElement("input");
  nameInput.className = "text-input";
  nameInput.placeholder = "Give this stop a name";
  if (existingData?.name) nameInput.value = existingData.name;
  nameLabel.appendChild(nameInput);

  const reasonLabel = document.createElement("label");
  reasonLabel.textContent = "I'm bringing friends here because:";
  const reasonInput = document.createElement("textarea");
  reasonInput.rows = 2;
  reasonInput.placeholder = "Explain why this stop matters";
  if (existingData?.reason) reasonInput.value = existingData.reason;
  reasonLabel.appendChild(reasonInput);

  const planLabel = document.createElement("label");
  planLabel.textContent = "We're planning to:";
  const planSelect = document.createElement("select");
  planSelect.className = "text-input";
  planSelect.innerHTML =
    '<option value="">Select an activity</option>' +
    stopOptions.map((opt) => `<option value="${opt}">${opt}</option>`).join("");
  const planOtherInput = document.createElement("input");
  planOtherInput.className = "text-input hidden";
  planOtherInput.placeholder = "Describe the activity";
  planLabel.appendChild(planSelect);
  planLabel.appendChild(planOtherInput);

  if (existingData?.plan) {
    if (stopOptions.includes(existingData.plan)) {
      planSelect.value = existingData.plan;
    } else {
      planSelect.value = "Other";
      planOtherInput.classList.remove("hidden");
      planOtherInput.value = existingData.plan;
    }
  }

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "submit";
  confirmBtn.textContent = existingData ? "Save" : "Confirm";
  confirmBtn.className = "primary-btn";
  confirmBtn.disabled = true;

  container.appendChild(nameLabel);
  container.appendChild(reasonLabel);
  container.appendChild(planLabel);
  container.appendChild(confirmBtn);

  const updateState = () => {
    const showOther = planSelect.value === "Other";
    planOtherInput.classList.toggle("hidden", !showOther);
    confirmBtn.disabled = !validateStopForm(
      nameInput,
      reasonInput,
      planSelect,
      planOtherInput
    );
  };

  container.addEventListener("input", updateState);
  planSelect.addEventListener("change", updateState);

  container.addEventListener("submit", (event) => {
    event.preventDefault();
    if (confirmBtn.disabled) return;
    const payload = {
      index,
      name: nameInput.value.trim(),
      reason: reasonInput.value.trim(),
      plan:
        planSelect.value === "Other"
          ? planOtherInput.value.trim()
          : planSelect.value,
      latlng
    };
    if (typeof onConfirm === "function") onConfirm(payload);
  });

  updateState();
  return container;
};

const areAllRoutesComplete = () =>
  routes.length > 0 && routes.every((route) => route.status === "complete");

const updateStepControls = () => {
  if (!sidebarRightBtn) return;
  if (currentStep === 0) {
    sidebarRightBtn.disabled = stops.length < 2;
  } else if (currentStep === 1) {
    sidebarRightBtn.disabled = !areAllRoutesComplete();
  } else {
    sidebarRightBtn.disabled = false;
  }
};

const renderStops = () => {
  stops.forEach((stop, idx) => {
    stop.index = idx + 1;
    stop.marker.setIcon(createStopIcon(stop.index, stop.highlighted));
    attachStopMarkerHandlers(stop);
  });

  if (!stopListEl) {
    updateStepControls();
    return;
  }

  stopListEl.innerHTML = "";

  stops.forEach((stop) => {
    const card = document.createElement("div");
    card.className = "stop-card";
    card.draggable = true;
    card.dataset.id = stop.id;

    const title = stop.data.name
      ? `Stop ${stop.index}: ${escapeHtml(stop.data.name)}`
      : `Stop ${stop.index}`;

    card.innerHTML = `
      <div class="stop-card-header">
        <div class="stop-card-heading">${title}</div>
        <div class="stop-card-icons">
          <button type="button" class="stop-edit-icon" aria-label="Edit stop">
            <img src="pic/edit.png" alt="Edit stop" />
          </button>
          <button type="button" class="stop-delete-icon" aria-label="Delete stop">
            <img src="pic/delete.png" alt="Delete stop" />
          </button>
        </div>
      </div>
      <div class="stop-card-row">
        <span class="stop-card-label">I'm bringing friends here because:</span>
        <p>${escapeHtml(stop.data.reason)}</p>
      </div>
      <div class="stop-card-row">
        <span class="stop-card-label">We're planning to:</span>
        <p>${escapeHtml(stop.data.plan)}</p>
      </div>
    `;

    card
      .querySelector(".stop-edit-icon")
      .addEventListener("click", () => openStopEditor(stop));
    card
      .querySelector(".stop-delete-icon")
      .addEventListener("click", () => deleteStop(stop.id));

    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", stop.id);
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("drag-over");
      const draggedId = e.dataTransfer.getData("text/plain");
      reorderStops(draggedId, stop.id);
    });

    stopListEl.appendChild(card);
  });

  updateStepControls();
};

const clearPendingStop = () => {
  if (pendingStop?.marker) map.removeLayer(pendingStop.marker);
  if (pendingStop?.popup) map.closePopup(pendingStop.popup);
  pendingStop = null;
};

const deleteStop = (id) => {
  const index = stops.findIndex((stop) => stop.id === id);
  if (index === -1) return;
  const stop = stops[index];
  if (stop.marker) map.removeLayer(stop.marker);
  stops.splice(index, 1);
  renderStops();
};

const clearHighlightedStops = () => {
  stops.forEach((stop) => {
    if (stop.highlighted) {
      stop.highlighted = false;
      stop.marker.setIcon(createStopIcon(stop.index, false));
    }
  });
};

const highlightStopsForRoute = (route) => {
  const targets = new Set([route.fromIndex, route.toIndex]);
  stops.forEach((stop) => {
    const shouldHighlight = targets.has(stop.index);
    if (stop.highlighted !== shouldHighlight) {
      stop.highlighted = shouldHighlight;
      stop.marker.setIcon(createStopIcon(stop.index, shouldHighlight));
    }
  });
};

const attachStopMarkerHandlers = (stop) => {
  if (!stop?.marker) return;
  stop.marker.off("click");
  stop.marker.on("click", () => {
    if (currentStep === 2) {
      openStopImprovementPopup(stop);
    }
  });
};

const updateStopTooltip = (stop) => {
  if (!stop.marker) return;
  stop.marker.unbindTooltip();
  if (!stop.improvements || !stop.improvements.length) return;
  const content = stop.improvements
    .map((imp) => `${imp.symbol} ${escapeHtml(imp.strategy)}`)
    .join("<br>");
  stop.marker
    .bindTooltip(content, {
      permanent: true,
      direction: "top",
      className: "map-improvement-tooltip"
    })
    .openTooltip();
};

const addStopImprovement = (stop, option, strategy) => {
  if (!stop) return false;
  if (!stop.improvements) stop.improvements = [];
  if (stop.improvements.length >= 3) {
    showToast("Each stop can include up to 3 improvements.");
    return false;
  }
  stop.improvements.push({
    id: option.id,
    symbol: option.symbol,
    title: option.title,
    strategy
  });
  updateStopTooltip(stop);
  showToast("Improvement added to stop.");
  renderImprovementPanel();
  return true;
};

const deleteStopImprovement = (stop, index) => {
  if (!stop?.improvements || index < 0 || index >= stop.improvements.length) return;
  stop.improvements.splice(index, 1);
  updateStopTooltip(stop);
  showToast("Improvement removed.");
  renderImprovementPanel();
};


function resetRouteStyles() {
  routes.forEach((route) => {
    if (route.polyline) {
      route.polyline.setStyle({
        color: "#0d6efd",
        weight: 3,
        opacity: 0.9
      });
    }
  });
}

const reorderStops = (draggedId, targetId) => {
  if (draggedId === targetId) return;
  const draggedIndex = stops.findIndex((stop) => stop.id === draggedId);
  const targetIndex = stops.findIndex((stop) => stop.id === targetId);
  if (draggedIndex === -1 || targetIndex === -1) return;
  const [draggedStop] = stops.splice(draggedIndex, 1);
  stops.splice(targetIndex, 0, draggedStop);
  renderStops();
};

const removePreviewMarker = (route) => {
  if (route.previewMarker) {
    map.removeLayer(route.previewMarker);
    route.previewMarker = null;
  }
  if (route.finishPopup) {
    map.closePopup(route.finishPopup);
    route.finishPopup = null;
  }
};

const clearRouteGeometry = (route) => {
  if (route.polyline) {
    map.removeLayer(route.polyline);
  }
  if (route.hitLayer) {
    map.removeLayer(route.hitLayer);
  }
  if (route.finishPopup) {
    map.closePopup(route.finishPopup);
  }
  removePreviewMarker(route);
  route.polyline = null;
  route.hitLayer = null;
  route.finishPopup = null;
  route.points = [];
  if (route.improvementMarkers?.length) {
    route.improvementMarkers.forEach(({ circle, label }) => {
      if (circle) map.removeLayer(circle);
      if (label) map.removeLayer(label);
    });
  }
  route.improvementMarkers = [];
  route.improvements = [];
};

const clearRoutes = () => {
  routes.forEach(clearRouteGeometry);
  routes.splice(0, routes.length);
  drawingRoute = null;
  clearHighlightedStops();
  setDrawingCursor(false);
  pendingRoutePlacement = null;
  syncDrawingCursor();
};

const buildRoutes = () => {
  clearRoutes();
  if (stops.length < 2) return;
  for (let i = 0; i < stops.length - 1; i += 1) {
    routes.push({
      id: `route-${i + 1}-${i + 2}`,
      fromIndex: i + 1,
      toIndex: i + 2,
      status: "idle",
      points: [],
      polyline: null,
      hitLayer: null,
      finishPopup: null,
      previewMarker: null,
      improvements: [],
      improvementMarkers: []
    });
  }
};

const getRouteButtonLabel = (route) => {
  if (route.status === "complete") return "Redraw";
  if (route.status === "drawing") return "Finish drawing";
  return "Start drawing";
};

const startRouteDrawing = (route) => {
  if (drawingRoute && drawingRoute !== route) {
    showToast("Finish the active route before starting a new one.");
    return;
  }
  clearRouteGeometry(route);
  route.status = "drawing";
  drawingRoute = route;
  highlightStopsForRoute(route);
  syncDrawingCursor();
};

const finishRouteDrawing = (route) => {
  if (route.points.length < 2) {
    showToast("Add at least two points before finishing this route.");
    return;
  }
  removePreviewMarker(route);
  route.status = "complete";
  drawingRoute = null;
  clearHighlightedStops();
  syncDrawingCursor();
  renderRoutes();
  updateStepControls();
};

const redrawRoute = (route) => {
  clearRouteGeometry(route);
  route.status = "idle";
  if (drawingRoute === route) {
    drawingRoute = null;
  }
  clearHighlightedStops();
  syncDrawingCursor();
};

const handleRouteAction = (route) => {
  if (route.status === "idle") {
    startRouteDrawing(route);
  } else if (route.status === "drawing") {
    finishRouteDrawing(route);
  } else {
    redrawRoute(route);
  }
  renderRoutes();
};

const applyRouteImprovement = (route, option, strategy, latlng) => {
  if (!route.improvements) route.improvements = [];
  if (route.improvements.length >= 5) {
    showToast("Each route can include up to 5 improvements.");
    return false;
  }

  let placement = latlng;
  if (route.polyline) {
    const snap = snapLatLngToRoute(route, latlng);
    if (snap.distance <= 200) {
      placement = snap.snappedLatLng;
    } else {
      showToast("Select a point closer to the highlighted route.");
      return false;
    }
  }

  const circleMarker = L.circleMarker(placement, {
    radius: 5,
    color: "#0d6efd",
    weight: 2,
    fillColor: "#fff",
    fillOpacity: 1,
    className: "route-improvement-point",
    interactive: false
  }).addTo(map);

  const labelMarker = L.marker(placement, {
    icon: L.divIcon({
      className: "map-improvement-pin",
      html: `<div class="map-improvement-label">${option.symbol}<span>${escapeHtml(strategy)}</span></div>`,
      iconAnchor: [0, 0]
    })
  }).addTo(map);

  route.improvements.push({
    id: option.id,
    symbol: option.symbol,
    title: option.title,
    strategy,
    latlng: placement
  });
  if (!route.improvementMarkers) route.improvementMarkers = [];
  route.improvementMarkers.push({ circle: circleMarker, label: labelMarker });
  return true;
};

const deleteRouteImprovement = (route, index) => {
  if (
    !route?.improvements ||
    index < 0 ||
    index >= route.improvements.length ||
    !route.improvementMarkers
  )
    return;
  route.improvements.splice(index, 1);
  const markerSet = route.improvementMarkers.splice(index, 1)[0];
  if (markerSet?.circle) map.removeLayer(markerSet.circle);
  if (markerSet?.label) map.removeLayer(markerSet.label);
  showToast("Improvement removed.");
  renderImprovementPanel();
};

const beginRouteImprovementPlacement = (route, option, strategy) => {
  if (!route) return false;
  if (pendingRoutePlacement) {
    showToast("Finish placing the current improvement first.");
    return false;
  }
  if (!route.improvements) route.improvements = [];
  if (route.improvements.length >= 5) {
    showToast("Each route can include up to 5 improvements.");
    return false;
  }
  pendingRoutePlacement = { route, option, strategy };
  highlightRouteForPlacement(route);
  syncDrawingCursor();
  showToast("Click on the selected route to place this improvement.");
  return true;
};


const renderRoutes = () => {
  if (!routeListEl) {
    updateStepControls();
    return;
  }

  routeListEl.innerHTML = "";

  if (!routes.length) {
    routeListEl.innerHTML =
      '<p class="sidebar-hint">Add at least two stops to draw routes.</p>';
    updateStepControls();
    return;
  }

  routes.forEach((route) => {
    const card = document.createElement("div");
    card.className = "route-card";

    const heading = document.createElement("div");
    heading.className = "route-card-heading";
    heading.textContent = `STOP ${route.fromIndex} to STOP ${route.toIndex}`;

    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    actionBtn.className = "primary-btn route-action-btn";
    actionBtn.textContent = getRouteButtonLabel(route);
    actionBtn.addEventListener("click", () => handleRouteAction(route));

    card.appendChild(heading);
    card.appendChild(actionBtn);
    routeListEl.appendChild(card);
  });

  updateStepControls();
};

const handleRouteMapClick = (latlng) => {
  if (!drawingRoute) return;
  const routeRef = drawingRoute;
  routeRef.points.push(latlng);
  if (routeRef.points.length === 1) {
    removePreviewMarker(routeRef);
    routeRef.previewMarker = L.circleMarker(latlng, {
      radius: 7,
      color: "#0d6efd",
      weight: 2,
      opacity: 0.9,
      fillColor: "#0d6efd",
      fillOpacity: 0.25,
      className: "route-preview-point"
    }).addTo(map);
    return;
  }

  removePreviewMarker(routeRef);

  updateRoutePolylineLayers(routeRef);

  const lastPoint = routeRef.points[routeRef.points.length - 1];
  if (lastPoint) {
    if (routeRef.finishPopup) {
      map.closePopup(routeRef.finishPopup);
    }
    const popupContent = document.createElement("div");
    popupContent.className = "route-finish-popup";
    const finishBtn = document.createElement("button");
    finishBtn.type = "button";
    finishBtn.className = "primary-btn";
    finishBtn.textContent = "Finish drawing";
    finishBtn.addEventListener("click", () => finishRouteDrawing(routeRef));
    popupContent.appendChild(finishBtn);

    routeRef.finishPopup = L.popup({
      closeButton: false,
      autoClose: true,
      className: "route-finish-popup-leaflet",
      closeOnClick: false
    })
      .setLatLng(lastPoint)
      .setContent(popupContent)
      .openOn(map);
  }
};

const handleRoutePolylineInteraction = (route, latlng) => {
  if (pendingRoutePlacement && pendingRoutePlacement.route === route) {
    placePendingRouteImprovement(latlng);
    return;
  }
  if (currentStep !== 2) return;
  if (pendingRoutePlacement && pendingRoutePlacement.route !== route) {
    showToast("Finish placing the active improvement first.");
    return;
  }
  openRouteImprovementPopup(route, latlng);
};

const updateRoutePolylineLayers = (route) => {
  if (!route.points.length) return;
  if (route.polyline) {
    route.polyline.setLatLngs(route.points);
  } else {
    route.polyline = L.polyline(route.points, {
      color: "#0d6efd",
      weight: 3,
      opacity: 0.9
    }).addTo(map);
    route.polyline.on("click", (event) => {
      L.DomEvent.stopPropagation(event);
      handleRoutePolylineInteraction(route, event.latlng);
    });
  }

  if (route.hitLayer) {
    route.hitLayer.setLatLngs(route.points);
  } else {
    route.hitLayer = L.polyline(route.points, {
      color: "#ffffff",
      weight: 20,
      opacity: 0,
      interactive: true,
      className: "route-hit-layer"
    }).addTo(map);
    route.hitLayer.on("click", (event) => {
      L.DomEvent.stopPropagation(event);
      handleRoutePolylineInteraction(route, event.latlng);
    });
  }
};

const buildImprovementList = (container, items, onDelete) => {
  container.innerHTML = "";
  if (!items || !items.length) {
    const empty = document.createElement("p");
    empty.className = "improvement-note";
    empty.textContent = "No improvements yet.";
    container.appendChild(empty);
    return;
  }

  items.forEach((imp, index) => {
    const row = document.createElement("div");
    row.className = "improvement-list-item";

    const textBlock = document.createElement("div");
    textBlock.className = "improvement-item-text";

    const category = document.createElement("div");
    category.className = "improvement-item-category";
    category.textContent = `${imp.symbol || ""} ${imp.title || ""}`.trim();

    const strategy = document.createElement("div");
    strategy.className = "improvement-item-strategy";
    strategy.textContent = imp.strategy || "";

    textBlock.appendChild(category);
    textBlock.appendChild(strategy);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "improvement-delete-btn";
    deleteBtn.innerHTML = '<img src="pic/delete.png" alt="Delete" />';
    deleteBtn.addEventListener("click", () => onDelete(index));

    row.appendChild(textBlock);
    row.appendChild(deleteBtn);
    container.appendChild(row);
  });
};

const openStopImprovementPopup = (stop) => {
  if (currentStep !== 2 || !stop?.marker) return;
  const container = document.createElement("div");
  container.className = "improvement-popup";

  const title = document.createElement("h4");
  title.textContent = stop.data?.name
    ? `Stop ${stop.index}: ${stop.data.name}`
    : `Stop ${stop.index}`;
  container.appendChild(title);

  const listNote = document.createElement("p");
  listNote.className = "improvement-list-note";
  listNote.textContent = "Improvement suggestion list:";
  container.appendChild(listNote);

  const list = document.createElement("div");
  list.className = "improvement-list";
  container.appendChild(list);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "ghost-btn improvement-add-btn";
  addBtn.textContent = "Add improvement";
  container.appendChild(addBtn);

  const formWrapper = document.createElement("div");
  formWrapper.className = "improvement-add-form hidden";

  const categoryLabel = document.createElement("label");
  categoryLabel.className = "field-label";
  categoryLabel.textContent = "Select improvement category";

  const categorySelect = document.createElement("select");
  categorySelect.className = "text-input";
  categorySelect.innerHTML =
    '<option value="">Select a category</option>' +
    pointImprovementOptions
      .map((opt) => `<option value="${opt.id}">${escapeHtml(opt.title)}</option>`)
      .join("");
  categoryLabel.appendChild(categorySelect);

  const strategyLabel = document.createElement("label");
  strategyLabel.className = "field-label";
  strategyLabel.textContent = "Select improvement strategy";
  const strategyField = document.createElement("div");
  strategyField.className = "improvement-strategy-field";
  strategyLabel.appendChild(strategyField);

  const strategySelect = document.createElement("select");
  strategySelect.className = "text-input";
  strategySelect.innerHTML = '<option value="">Select improvement strategy</option>';
  strategySelect.disabled = true;
  strategyField.appendChild(strategySelect);

  const customInput = document.createElement("textarea");
  customInput.className = "text-input hidden";
  customInput.placeholder = "Describe your idea";
  strategyField.appendChild(customInput);

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "primary-btn full-width";
  confirmBtn.textContent = "Confirm";
  confirmBtn.disabled = true;

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "ghost-btn full-width";
  cancelBtn.textContent = "Cancel";

  formWrapper.appendChild(categoryLabel);
  formWrapper.appendChild(strategyLabel);
  formWrapper.appendChild(confirmBtn);
  formWrapper.appendChild(cancelBtn);
  container.appendChild(formWrapper);

  let formVisible = false;
  const getSelectedOption = () =>
    pointImprovementOptions.find((opt) => opt.id === categorySelect.value);

  const resetFormFields = () => {
    categorySelect.value = "";
    customInput.value = "";
    customInput.classList.add("hidden");
    strategySelect.disabled = true;
    strategySelect.innerHTML = '<option value="">Select improvement strategy</option>';
    confirmBtn.disabled = true;
  };

  const hideForm = () => {
    formVisible = false;
    formWrapper.classList.add("hidden");
    addBtn.textContent = "Add improvement";
    addBtn.classList.remove("hidden");
    resetFormFields();
  };

  const showForm = () => {
    resetFormFields();
    formVisible = true;
    formWrapper.classList.remove("hidden");
    addBtn.classList.add("hidden");
  };

  const updateAddBtnState = () => {
    const reached = (stop.improvements?.length || 0) >= 3;
    addBtn.disabled = reached;
    addBtn.title = reached ? "Limit reached (max 3 improvements per stop)" : "";
    addBtn.textContent = "Add improvement";
    addBtn.classList.toggle("hidden", formVisible && !reached);
    if (reached) {
      formWrapper.classList.add("hidden");
      formVisible = false;
    }
  };

  const getStrategyValue = () => {
    const option = getSelectedOption();
    if (!option) return "";
    if (option.id === "point-other" || !option.strategies.length) {
      return customInput.value.trim();
    }
    return strategySelect.value;
  };

  const updateFormState = () => {
    confirmBtn.disabled = !(getSelectedOption() && getStrategyValue());
  };

  const updateStrategyOptions = () => {
    const option = getSelectedOption();
    customInput.classList.add("hidden");
    customInput.value = "";
    if (!option) {
      strategySelect.disabled = true;
      strategySelect.innerHTML = '<option value="">Select improvement strategy</option>';
      updateFormState();
      return;
    }
    if (option.id === "point-other" || !option.strategies.length) {
      strategySelect.disabled = true;
      strategySelect.innerHTML = '<option value="">Provide details below</option>';
      customInput.classList.remove("hidden");
    } else {
      strategySelect.disabled = false;
      strategySelect.innerHTML =
        '<option value="">Select improvement strategy</option>' +
        option.strategies.map((strat) => `<option value="${escapeHtml(strat)}">${strat}</option>`).join("");
    }
    updateFormState();
  };

  categorySelect.addEventListener("change", () => {
    updateStrategyOptions();
  });
  strategySelect.addEventListener("change", updateFormState);
  customInput.addEventListener("input", updateFormState);

  const refreshList = () => {
    buildImprovementList(list, stop.improvements, (idx) => {
      deleteStopImprovement(stop, idx);
      refreshList();
      updateAddBtnState();
    });
  };

  confirmBtn.addEventListener("click", () => {
    const option = getSelectedOption();
    const strategy = getStrategyValue();
    if (!option || !strategy) return;
    if (addStopImprovement(stop, option, strategy)) {
      refreshList();
      updateAddBtnState();
      hideForm();
    }
  });

  cancelBtn.addEventListener("click", hideForm);

  addBtn.addEventListener("click", () => {
    if (addBtn.disabled) return;
    if (formVisible) {
      hideForm();
    } else {
      showForm();
    }
  });

  refreshList();
  updateAddBtnState();

  const popup = L.popup({
    closeButton: true,
    autoClose: true,
    closeOnClick: false,
    className: "improvement-popup-leaflet"
  })
    .setLatLng(stop.latlng)
    .setContent(container)
    .openOn(map);

  popup.on("remove", () => {
    hideForm();
  });
};

const openRouteImprovementPopup = (route, latlng) => {
  if (currentStep !== 2 || !route) return;
  const container = document.createElement("div");
  container.className = "improvement-popup";

  const title = document.createElement("h4");
  title.textContent = `Stop ${route.fromIndex} to Stop ${route.toIndex}`;
  container.appendChild(title);

  const listNote = document.createElement("p");
  listNote.className = "improvement-list-note";
  listNote.textContent = "Improvement suggestion list:";
  container.appendChild(listNote);

  const list = document.createElement("div");
  list.className = "improvement-list";
  container.appendChild(list);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "ghost-btn improvement-add-btn";
  addBtn.textContent = "Add improvement";
  container.appendChild(addBtn);

  const formWrapper = document.createElement("div");
  formWrapper.className = "improvement-add-form hidden";

  const categoryLabel = document.createElement("label");
  categoryLabel.className = "field-label";
  categoryLabel.textContent = "Select improvement category";

  const categorySelect = document.createElement("select");
  categorySelect.className = "text-input";
  categorySelect.innerHTML =
    '<option value="">Select a category</option>' +
    routeImprovementOptions.map((opt) => `<option value="${opt.id}">${escapeHtml(opt.title)}</option>`).join("");
  categoryLabel.appendChild(categorySelect);

  const strategyLabel = document.createElement("label");
  strategyLabel.className = "field-label";
  strategyLabel.textContent = "Select improvement strategy";
  const strategyField = document.createElement("div");
  strategyField.className = "improvement-strategy-field";
  strategyLabel.appendChild(strategyField);

  const strategySelect = document.createElement("select");
  strategySelect.className = "text-input";
  strategySelect.innerHTML = '<option value="">Select improvement strategy</option>';
  strategySelect.disabled = true;
  strategyField.appendChild(strategySelect);

  const customInput = document.createElement("textarea");
  customInput.className = "text-input hidden";
  customInput.placeholder = "Describe your idea";
  strategyField.appendChild(customInput);

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "primary-btn full-width";
  confirmBtn.textContent = "Confirm";
  confirmBtn.disabled = true;

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "ghost-btn full-width";
  cancelBtn.textContent = "Cancel";

  formWrapper.appendChild(categoryLabel);
  formWrapper.appendChild(strategyLabel);
  formWrapper.appendChild(confirmBtn);
  formWrapper.appendChild(cancelBtn);
  container.appendChild(formWrapper);

  let formVisible = false;
  const getSelectedOption = () =>
    routeImprovementOptions.find((opt) => opt.id === categorySelect.value);

  const resetFormFields = () => {
    categorySelect.value = "";
    customInput.value = "";
    customInput.classList.add("hidden");
    strategySelect.disabled = true;
    strategySelect.innerHTML = '<option value="">Select improvement strategy</option>';
    confirmBtn.disabled = true;
  };

  const hideForm = () => {
    formVisible = false;
    formWrapper.classList.add("hidden");
    addBtn.textContent = "Add improvement";
    addBtn.classList.remove("hidden");
    resetFormFields();
  };

  const showForm = () => {
    resetFormFields();
    formVisible = true;
    formWrapper.classList.remove("hidden");
    addBtn.classList.add("hidden");
  };

  const updateAddBtnState = () => {
    const reached = (route.improvements?.length || 0) >= 5;
    addBtn.disabled = reached;
    addBtn.title = reached ? "Limit reached (max 5 improvements per route)" : "";
    addBtn.textContent = "Add improvement";
    addBtn.classList.toggle("hidden", formVisible && !reached);
    if (reached) {
      formWrapper.classList.add("hidden");
      formVisible = false;
    }
  };

  const getStrategyValue = () => {
    const option = getSelectedOption();
    if (!option) return "";
    if (option.id === "route-other" || !option.strategies.length) {
      return customInput.value.trim();
    }
    return strategySelect.value;
  };

  const updateFormState = () => {
    confirmBtn.disabled = !(getSelectedOption() && getStrategyValue());
  };

  const updateStrategyOptions = () => {
    const option = getSelectedOption();
    customInput.classList.add("hidden");
    customInput.value = "";
    if (!option) {
      strategySelect.disabled = true;
      strategySelect.innerHTML = '<option value="">Select improvement strategy</option>';
      updateFormState();
      return;
    }
    if (option.id === "route-other" || !option.strategies.length) {
      strategySelect.disabled = true;
      strategySelect.innerHTML = '<option value="">Provide details below</option>';
      customInput.classList.remove("hidden");
    } else {
      strategySelect.disabled = false;
      strategySelect.innerHTML =
        '<option value="">Select improvement strategy</option>' +
        option.strategies.map((strat) => `<option value="${escapeHtml(strat)}">${strat}</option>`).join("");
    }
    updateFormState();
  };

  categorySelect.addEventListener("change", () => {
    updateStrategyOptions();
  });
  strategySelect.addEventListener("change", updateFormState);
  customInput.addEventListener("input", updateFormState);

  confirmBtn.addEventListener("click", () => {
    const option = getSelectedOption();
    const strategy = getStrategyValue();
    if (!option || !strategy) return;
    const placementLatLng = latlng || null;
    if (placementLatLng) {
      if (applyRouteImprovement(route, option, strategy, placementLatLng)) {
        refreshList();
        updateAddBtnState();
        hideForm();
        showToast("Improvement added to route.");
      }
      return;
    }
    if (beginRouteImprovementPlacement(route, option, strategy)) {
      hideForm();
    }
  });

  cancelBtn.addEventListener("click", hideForm);

  addBtn.addEventListener("click", () => {
    if (addBtn.disabled) return;
    if (formVisible) {
      hideForm();
    } else {
      showForm();
    }
  });

  const refreshList = () => {
    buildImprovementList(list, route.improvements, (idx) => {
      deleteRouteImprovement(route, idx);
      refreshList();
      updateAddBtnState();
    });
  };

  refreshList();
  updateAddBtnState();

  const popup = L.popup({
    closeButton: true,
    autoClose: true,
    closeOnClick: false,
    className: "improvement-popup-leaflet"
  })
    .setLatLng(latlng || map.getCenter())
    .setContent(container)
    .openOn(map);

  const popupUpdater = () => {
    refreshList();
    updateAddBtnState();
  };
  route.popupListUpdater = popupUpdater;
  popup.on("remove", () => {
    if (route.popupListUpdater === popupUpdater) {
      route.popupListUpdater = null;
    }
    hideForm();
  });
};



const flattenLatLngs = (coords) => {
  if (!Array.isArray(coords)) return [];
  const flat = [];
  coords.forEach((item) => {
    if (Array.isArray(item)) {
      flat.push(...item);
    } else {
      flat.push(item);
    }
  });
  return flat;
};

const placePendingRouteImprovement = (latlng) => {
  if (!pendingRoutePlacement) return;
  const { route, option, strategy } = pendingRoutePlacement;
  if (!route) {
    pendingRoutePlacement = null;
    syncDrawingCursor();
    return;
  }
  if (applyRouteImprovement(route, option, strategy, latlng)) {
    pendingRoutePlacement = null;
    resetRouteStyles();
    syncDrawingCursor();
    showToast("Improvement added to route.");
    renderImprovementPanel();
    route.popupListUpdater?.();
  }
};

const snapLatLngToRoute = (route, latlng) => {
  if (!route.polyline) return { snappedLatLng: latlng, distance: Infinity };
  const latlngs = flattenLatLngs(route.polyline.getLatLngs());
  if (latlngs.length < 2) return { snappedLatLng: latlng, distance: Infinity };
  const targetPoint = map.latLngToLayerPoint(latlng);
  let bestPoint = targetPoint;
  let bestDistance = Infinity;

  for (let i = 0; i < latlngs.length - 1; i += 1) {
    const a = map.latLngToLayerPoint(latlngs[i]);
    const b = map.latLngToLayerPoint(latlngs[i + 1]);
    const ab = b.subtract(a);
    const ap = targetPoint.subtract(a);
    const abLengthSq = ab.x * ab.x + ab.y * ab.y;
    const t = abLengthSq === 0 ? 0 : Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y) / abLengthSq));
    const projection = L.point(a.x + ab.x * t, a.y + ab.y * t);
    const dist = projection.distanceTo(targetPoint);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestPoint = projection;
    }
  }

  const snappedLatLng = map.layerPointToLatLng(bestPoint);
  const distanceMeters = map.distance(latlng, snappedLatLng);
  return { snappedLatLng, distance: distanceMeters };
};

const openStopEditor = (stop) => {
  const popup = L.popup({
    closeButton: true,
    autoClose: true,
    closeOnClick: false,
    className: "stop-popup"
  })
    .setLatLng(stop.latlng)
    .setContent(
      createStopForm(stop.index, stop.marker, stop.latlng, stop.data, (data) => {
        stop.data = data;
        map.closePopup(popup);
        renderStops();
      })
    )
    .openOn(map);
};

const handleStopPlacement = (latlng) => {
  if (!isGameActive || currentStep !== 0) return;
  if (stops.length >= MAX_STOPS) return;

  clearPendingStop();

  const index = stops.length + 1;
  const marker = L.marker(latlng, { icon: createStopIcon(index) }).addTo(map);
  const id = `stop-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const popup = L.popup({
    closeButton: false,
    autoClose: false,
    closeOnClick: false,
    className: "stop-popup"
  })
    .setLatLng(latlng)
    .setContent(
      createStopForm(index, marker, latlng, null, (data) => {
        const stopRecord = { id, marker, latlng, data, highlighted: false, improvements: [] };
        attachStopMarkerHandlers(stopRecord);
        stops.push(stopRecord);
        if (pendingStop?.popup) map.closePopup(pendingStop.popup);
        pendingStop = null;
        renderStops();
      })
    )
    .openOn(map);

  pendingStop = { marker, popup };
};

map.on("click", (event) => {
  if (!isGameActive) return;
  if (currentStep === 0) {
    handleStopPlacement(event.latlng);
  } else if (currentStep === 1) {
    handleRouteMapClick(event.latlng);
  } else if (currentStep === 2) {
    if (pendingRoutePlacement) {
      placePendingRouteImprovement(event.latlng);
    }
  }
});

const resetExperience = () => {
  clearPendingStop();
  stops.forEach((stop) => {
    if (stop.marker) map.removeLayer(stop.marker);
  });
  stops.splice(0, stops.length);
  clearRoutes();
  renderStops();
  showSidebar();
  isGameActive = true;
  activeImprovementId = null;
  improvementMode = "stop";
  pendingRoutePlacement = null;
  setStep(0);
};

sidebarLeftBtn?.addEventListener("click", () => {
  if (currentStep === 0) {
    window.location.href = "index.html?from=editor";
    return;
  }
  if (currentStep === 1) {
    clearRoutes();
  }
  setStep(Math.max(0, currentStep - 1));
});

sidebarRightBtn?.addEventListener("click", () => {
  if (currentStep === 0) {
    if (stops.length < 2) return;
    clearPendingStop();
    setStep(1);
  } else if (currentStep === 1) {
    if (!areAllRoutesComplete()) return;
    setStep(2);
  } else if (currentStep === 2) {
    showThankYouOverlay();
  }
});

showSidebar();
isGameActive = true;
setStep(0);
const handleStopImprovementFormSubmit = (event, form) => {
  event.preventDefault();
  const optionId = form.dataset.optionId;
  const option = getImprovementOption("stop", optionId);
  if (!option) return;
  const stopId = form.querySelector('[data-input="stop-select"]')?.value;
  if (!stopId) {
    showToast("Select a stop first.");
    return;
  }
  const stop = stops.find((item) => item.id === stopId);
  if (!stop) {
    showToast("Selected stop is no longer available.");
    return;
  }

  let strategy = "";
  if (option.id === "point-other" || !option.strategies.length) {
    strategy = form.querySelector('[data-input="custom-strategy"]')?.value.trim();
  } else {
    strategy = form.querySelector(`input[name="strategy-${option.id}"]:checked`)?.value;
  }

  if (!strategy) {
    showToast("Choose a strategy.");
    return;
  }

  addStopImprovement(stop, option, strategy);
};

const handleRouteImprovementFormSubmit = (event, form) => {
  event.preventDefault();
  const optionId = form.dataset.optionId;
  const option = getImprovementOption("route", optionId);
  if (!option) return;
  const routeId = form.querySelector('[data-input="route-select"]')?.value;
  if (!routeId) {
    showToast("Select a route first.");
    return;
  }
  const route = routes.find((item) => item.id === routeId);
  if (!route) {
    showToast("Selected route is no longer available.");
    return;
  }

  let strategy = "";
  if (option.id === "route-other" || !option.strategies.length) {
    strategy = form.querySelector('[data-input="custom-strategy"]')?.value.trim();
  } else {
    strategy = form.querySelector(`input[name="strategy-${option.id}"]:checked`)?.value;
  }

  if (!strategy) {
    showToast("Choose a strategy.");
    return;
  }

  beginRouteImprovementPlacement(route, option, strategy);
};

thankYouSubmitBtn?.addEventListener("click", async () => {
  thankYouSubmitBtn.disabled = true;
  try {
    const id = await saveSubmission();
    if (id) {
      window.location.href = "index.html?from=submission";
      return;
    }
    showToast("Unable to save right now. Please try again.");
  } catch (error) {
    console.error("Failed to submit", error);
    showToast("Unable to save right now. Please try again.");
  }
  thankYouSubmitBtn.disabled = false;
});

thankYouBackBtn?.addEventListener("click", () => {
  hideThankYouOverlay();
});

thankYouDownloadBtn?.addEventListener("click", async () => {
  await downloadThankYouImage();
});
