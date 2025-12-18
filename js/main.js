import { fetchPlaces, fetchAllReviews, fetchReviewsForPlace, insertReview } from './db.js';

// Adjust marker colors
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const statusEl = document.getElementById('status');
const selectedEl = document.getElementById('selected');

const reviewsEl = document.getElementById('reviews');
const selectedReviewEl = document.getElementById('selected-review');
const formEl = document.getElementById('review-form');
const submitBtn = document.getElementById('submit-review');

const vibeSelect = document.getElementById('vibe');
const minReviewsEl = document.getElementById('minReviews');
const cuisineFilterEl = document.getElementById('cuisineFilter');
const rankedEl = document.getElementById('ranked');

const tabDiscover = document.getElementById('tab-discover');
const tabReview = document.getElementById('tab-review');
const panelDiscover = document.getElementById('panel-discover');
const panelReview = document.getElementById('panel-review');
const searchEl = document.getElementById('search');
const clearFiltersBtn = document.getElementById('clear-filters');

const reviewAgainBtn = document.getElementById('review-again');
const reviewOverlayEl = document.getElementById('review-overlay');
const reviewCloseBtn = document.getElementById('review-close');

// store markers so we can interact with them later
const markersByPlaceId = new Map();

let placesCache = [];
let selectedMarker = null;
function refreshRankings() {
  const occasion = vibeSelect.value;
  const minReviews = Number(minReviewsEl.value || 0);
  const cuisineFilter = cuisineFilterEl ? cuisineFilterEl.value : '';
  renderRankedList(placesCache, occasionStats, occasion, minReviews, cuisineFilter, searchQuery);
}

// Search bar
let searchQuery = '';
if (searchEl) {
  searchEl.addEventListener('input', () => {
    searchQuery = searchEl.value.trim().toLowerCase();
    refreshRankings();
  });
}

// Clear filter button
if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener('click', () => {
    if (vibeSelect) vibeSelect.value = '';
    if (cuisineFilterEl) cuisineFilterEl.value = '';
    if (minReviewsEl) minReviewsEl.value = '1';
    if (searchEl) searchEl.value = '';
    searchQuery = '';

    refreshRankings();
  });
}

// Randomize suggestions
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setActiveTab(which) {
  const isDiscover = which === 'discover';

  tabDiscover.classList.toggle('is-active', isDiscover);
  tabReview.classList.toggle('is-active', !isDiscover);

  tabDiscover.setAttribute('aria-selected', String(isDiscover));
  tabReview.setAttribute('aria-selected', String(!isDiscover));

  panelDiscover.hidden = !isDiscover;
  panelReview.hidden = isDiscover;
}

if (tabDiscover && tabReview && panelDiscover && panelReview) {
  tabDiscover.addEventListener('click', () => setActiveTab('discover'));
  tabReview.addEventListener('click', () => setActiveTab('review'));
}

// Zoom to marker
function focusMarker(marker, zoom = 17) {
  if (!mapRef) return;
  const latlng = marker.getLatLng();
  mapRef.setView(latlng, zoom, { animate: true });
}

function mean(nums) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

function reviewScore(r) {
  return (r.food + r.value + r.vibe) / 3;
}

// Build a map: place_id -> { occasion -> { avg, count } }
function buildOccasionStats(reviews) {
  const buckets = new Map();

  for (const r of reviews) {
    if (!buckets.has(r.place_id)) buckets.set(r.place_id, new Map());
    const byOcc = buckets.get(r.place_id);

    if (!byOcc.has(r.occasion)) byOcc.set(r.occasion, []);
    byOcc.get(r.occasion).push(reviewScore(r));
  }

  const stats = new Map();
  for (const [placeId, byOcc] of buckets.entries()) {
    const occStats = new Map();
    for (const [occ, scores] of byOcc.entries()) {
      occStats.set(occ, { avg: mean(scores), count: scores.length });
    }
    stats.set(placeId, occStats);
  }

  return stats;
}

// Review success function
function showReviewOverlay() {
  if (!reviewOverlayEl) return;
  reviewOverlayEl.hidden = false;
  reviewOverlayEl.setAttribute('aria-hidden', 'false');
}

function hideReviewOverlay() {
  if (!reviewOverlayEl) return;
  reviewOverlayEl.hidden = true;
  reviewOverlayEl.setAttribute('aria-hidden', 'true');
}

if (reviewCloseBtn) {
  reviewCloseBtn.addEventListener('click', hideReviewOverlay);
}

if (reviewAgainBtn) {
  reviewAgainBtn.addEventListener('click', () => {
    hideReviewOverlay();

    // Clear optional fields
    const orderEl = document.getElementById('order');
    const noteEl = document.getElementById('note');
    if (orderEl) orderEl.value = '';
    if (noteEl) noteEl.value = '';

    // Clear star ratings
    document.querySelectorAll('input[name="foodRating"]').forEach((el) => (el.checked = false));
    document.querySelectorAll('input[name="valueRating"]').forEach((el) => (el.checked = false));
    document.querySelectorAll('input[name="vibeRating"]').forEach((el) => (el.checked = false));
  });
}

let mapRef = null;

function renderRankedList(places, occasionStats, occasion, minReviews, cuisineFilter, searchQuery) {
  // candidates filtered by cuisine
  let candidates = cuisineFilter
    ? places.filter((p) => splitCuisines(p.cuisine).includes(cuisineFilter))
    : places;

  // Add search query
  if (searchQuery) {
    candidates = candidates.filter((p) => {
      const name = (p.name || '').toLowerCase();
      return name.includes(searchQuery);
    });
  }

  // Show suggestions if no category is selected
  if (!occasion) {
    const suggestions = shuffle(
      candidates.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number'),
    ).slice(0, 5);

    rankedEl.innerHTML = `
      <p><strong>Suggestions to explore:</strong></p>
      ${suggestions.map((p, idx) => `
        <div style="padding:8px 0; ${idx ? 'border-top:1px solid #ddd;' : ''}">
          <button class="rank-item" data-place-id="${p.id}" style="all:unset; cursor:pointer; display:block;">
            <div><strong>${p.name ?? 'Unnamed place'}</strong></div>
            ${p.cuisine ? `<div><small>${p.cuisine}</small></div>` : ''}
          </button>
        </div>
      `).join('')}
    `;

    wireRankClicks();
    return;
  }

  // Build ranked array (review-based)
  const ranked = candidates
    .map((p) => {
      const placeOccStats = occasionStats.get(p.id);
      const s = placeOccStats?.get(occasion);
      return {
        place: p,
        avg: s?.avg ?? null,
        count: s?.count ?? 0,
      };
    })
    .filter((x) => x.count >= minReviews && x.avg !== null)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  // Helper to wire clicks for zoom + select
  function wireRankClicks() {
    rankedEl.querySelectorAll('.rank-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const placeId = btn.dataset.placeId;
        const marker = markersByPlaceId.get(placeId);
        if (!marker || !mapRef) return;
        focusMarker(marker, 17);
        marker.openPopup();
        marker.fire('click');
      });
    });
  }

  // Render ranked results
  if (ranked.length) {
    rankedEl.innerHTML = `
      <p style="margin:0 0 8px 0;">
        Top matches for <strong>${occasion}</strong>${cuisineFilter ? ` (${cuisineFilter})` : ''}:
      </p>
      ${ranked
    .map((x, idx) => {
      const p = x.place;
      return `
            <div style="padding:8px 0; ${idx ? 'border-top:1px solid #ddd;' : ''}">
              <button class="rank-item" data-place-id="${p.id}" style="all:unset; cursor:pointer; display:block;">
                <div><strong>${idx + 1}. ${p.name ?? 'Unnamed place'}</strong></div>
                <div>${x.avg.toFixed(2)}/5 • ${x.count} review${x.count === 1 ? '' : 's'}</div>
                ${p.cuisine ? `<div><small>${p.cuisine}</small></div>` : ''}
              </button>
            </div>
          `;
    })
    .join('')}
    `;

    wireRankClicks();
    return;
  }

  // No ranked results yet — show randomized suggestions
  const suggestions = shuffle(
    candidates.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number'),
  ).slice(0, 5);

  rankedEl.innerHTML = `
    <p>No reviewed matches yet for <strong>${occasion}</strong>${cuisineFilter ? ` (${cuisineFilter})` : ''}.</p>
    <p><strong>Suggestions to explore:</strong></p>
    ${suggestions.length
    ? suggestions
      .map((p, idx) => `
            <div style="padding:8px 0; ${idx ? 'border-top:1px solid #ddd;' : ''}">
              <button class="rank-item" data-place-id="${p.id}" style="all:unset; cursor:pointer; display:block;">
                <div><strong>${p.name ?? 'Unnamed place'}</strong></div>
                ${p.cuisine ? `<div><small>${p.cuisine}</small></div>` : ''}
              </button>
            </div>
          `)
      .join('')
    : `<p><em>No suggestions found for this filter. Try “Any cuisine”.</em></p>`}
  `;

  wireRankClicks();
}

function splitCuisines(c) {
  if (!c) return [];
  return String(c)
    .toLowerCase()
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

function populateCuisineFilter(places) {
  if (!cuisineFilterEl) return;

  const set = new Set();
  for (const p of places) {
    for (const c of splitCuisines(p.cuisine)) set.add(c);
  }

  const cuisines = [...set].sort((a, b) => a.localeCompare(b));

  cuisineFilterEl.innerHTML = `
    <option value="">Any cuisine</option>
    ${cuisines.map((c) => `<option value="${c}">${c}</option>`).join('')}
  `;
}


let selectedPlace = null;

function setStatus(html) {
  statusEl.innerHTML = html;
}

function setSelected(place) {
  selectedPlace = place;

  // Reset previous marker
  if (selectedMarker) {
    selectedMarker.setIcon(defaultIcon);
    selectedMarker = null;
  }

  if (!place) {
    const empty = `<p>Click a pin to see details.</p>`;
    selectedEl.innerHTML = empty;
    if (selectedReviewEl) selectedReviewEl.innerHTML = `<p>No place selected yet. Click a pin or a suggestion.</p>`;
    reviewsEl.innerHTML = `<p>No place selected.</p>`;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Pick a place first';
    return;
  }

  const html = `
    <h3 style="margin:0 0 6px 0;">${place.name ?? 'Unnamed place'}</h3>
    ${place.cuisine ? `<p style="margin:0 0 6px 0;"><strong>Cuisine:</strong> ${place.cuisine}</p>` : ''}
    ${place.address ? `<p style="margin:0 0 6px 0;"><strong>Address:</strong> ${place.address}</p>` : ''}
  `;

  // Populate both tabs
  selectedEl.innerHTML = html;
  if (selectedReviewEl) selectedReviewEl.innerHTML = html;

  submitBtn.disabled = false;
  submitBtn.textContent = 'Submit review';

  // Highlight selected marker
  const marker = markersByPlaceId.get(place.id);
  if (marker) {
    marker.setIcon(selectedIcon);
    selectedMarker = marker;
    focusMarker(marker, 17);
    marker.openPopup();
  }

  loadReviews(place.id);
}

function avg(nums) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function renderReviews(reviews) {
  if (!reviews.length) {
    reviewsEl.innerHTML = `<p>No reviews yet. Be the first!</p>`;
    return;
  }

  // Quick “best for” summary by occasion
  const byOccasion = new Map();
  for (const r of reviews) {
    if (!byOccasion.has(r.occasion)) byOccasion.set(r.occasion, []);
    byOccasion.get(r.occasion).push(r);
  }

  const summary = [...byOccasion.entries()]
    .map(([occ, arr]) => {
      const score = avg(arr.map((x) => (x.food + x.value + x.vibe) / 3));
      return `<li><strong>${occ}</strong>: ${score.toFixed(2)} (${arr.length})</li>`;
    })
    .join('');

  const items = reviews
    .slice(0, 10)
    .map((r) => {
      const score = ((r.food + r.value + r.vibe) / 3).toFixed(1);
      return `
        <div style="padding:8px 0; border-top:1px solid #ddd;">
          <div><strong>${r.occasion}</strong> • ${score}/5</div>
          ${r.go_to_order ? `<div><em>Go-to:</em> ${r.go_to_order}</div>` : ''}
          ${r.note ? `<div>${r.note}</div>` : ''}
          <div><small>${new Date(r.created_at).toLocaleString()}</small></div>
        </div>
      `;
    })
    .join('');

  reviewsEl.innerHTML = `
    <div>
      <p style="margin:0 0 6px 0;"><strong>Best-for scores</strong></p>
      <ul style="margin:0 0 10px 18px;">${summary}</ul>
    </div>
    ${items}
  `;
}

async function loadReviews(placeId) {
  try {
    reviewsEl.innerHTML = `<p>Loading reviews…</p>`;
    const reviews = await fetchReviewsForPlace(placeId);
    renderReviews(reviews);
  } catch (err) {
    console.error(err);
    reviewsEl.innerHTML = `<p><strong>Error loading reviews:</strong> ${err.message ?? String(err)}</p>`;
  }
}

function initMap() {
  const philly = [39.9526, -75.1652];
  const map = L.map('map').setView(philly, 12);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map);


  return map;
}

let allReviews = [];
let occasionStats = new Map();

async function main() {
  const map = initMap();
  mapRef = map;

  try {
    setStatus('<p>Loading places from Supabase…</p>');
    placesCache = await fetchPlaces(2000);
    populateCuisineFilter(placesCache);

    setStatus('<p>Loading reviews from Supabase…</p>');
    allReviews = await fetchAllReviews(5000);
    occasionStats = buildOccasionStats(allReviews);

    // Add markers, always render pins first
    let added = 0;
    for (const p of placesCache) {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') continue;
      const marker = L.marker([p.lat, p.lng], { icon: defaultIcon }).addTo(map);
      marker.bindPopup(`<strong>${p.name ?? 'Unnamed place'}</strong>`);
      marker.on('click', () => setSelected(p));
      markersByPlaceId.set(p.id, marker); // so ranked list can jump to pins
      added += 1;
    }

    setStatus(
      `<p>Loaded <strong>${placesCache.length}</strong> places and <strong>${allReviews.length}</strong> reviews. Rendered <strong>${added}</strong> pins.</p>`,
    );

    refreshRankings();
    vibeSelect.addEventListener('change', refreshRankings);
    minReviewsEl.addEventListener('input', refreshRankings);
    if (cuisineFilterEl) cuisineFilterEl.addEventListener('change', refreshRankings);

    setSelected(null);
  } catch (err) {
    console.error(err);
    setStatus(`<p><strong>Error:</strong> ${err.message ?? String(err)}</p>`);
  }
}

// Form submission for reviews
if (formEl) {
  formEl.addEventListener('submit', async (e) => {
    console.log('Review form submitted');
    e.preventDefault();
    if (!selectedPlace) return;

    const occasion = document.getElementById('occasion').value;
    const food = Number(document.querySelector('input[name="foodRating"]:checked')?.value);
    const value = Number(document.querySelector('input[name="valueRating"]:checked')?.value);
    const vibe = Number(document.querySelector('input[name="vibeRating"]:checked')?.value);
    const goToOrder = document.getElementById('order').value.trim() || null;
    const note = document.getElementById('note').value.trim() || null;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';

      // Ensure that no NULL values
      if (![food, value, vibe].every((n) => Number.isFinite(n) && n >= 1 && n <= 5)) {
        alert('Please enter Food/Value/Vibe ratings between 1 and 5.');
        return;
      }

      await insertReview({
        place_id: selectedPlace.id,
        occasion,
        food,
        value,
        vibe,
        go_to_order: goToOrder,
        note,
      });

      // Optional fields
      document.getElementById('order').value = '';
      document.getElementById('note').value = '';

      // Refresh the reviews panel
      await loadReviews(selectedPlace.id);

      showReviewOverlay();
    } catch (err) {
      console.error(err);
      alert(err.message ?? String(err));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit review';
    }
  });
}

main().catch((err) => {
  console.error('Main crashed:', err);
  setStatus?.(`<p><strong>Error:</strong> ${err.message ?? String(err)}</p>`);
});
