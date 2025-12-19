console.log('app.js LOADED');

/* IMPORT FIREBASE */
import { db } from './firebase.js';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/* MAP SETUP (LEAFLET) */

const map = L.map('map', {
  zoomSnap: 0,
  scrollWheelZoom: true,
}).setView([39.99, -75.12], 11); // Philadelphia

L.tileLayer(
  'https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoibm9kaSIsImEiOiJjbWZlYzdldXMwNWhxMnNvYzNvOWM1c3l1In0.M5eQdMz9QGmElmCb4_mvGg',
  {
    maxZoom: 18,
    zoomOffset: -1,
    tileSize: 512,
    attribution: '&copy; Mapbox & OpenStreetMap',
  },
).addTo(map);

/* PHILADELPHIA TRACT BOUNDARIES*/

fetch('data/tracts.geojson')
  .then((res) => res.json())
  .then((data) => {
    L.geoJSON(data, {
      style: {
        color: '#111',
        weight: 1.2,
        fillOpacity: 0,
      },
    }).addTo(map);
  })
  .catch((err) => console.error(' Tracts failed:', err));

/* MARKER STATE */

let activeMarker = null;
let activeAddress = null;

/* PLACE BLACK MARKER */

function placeMarker(lat, lon, popupHTML = '') {
  if (activeMarker) {
    map.removeLayer(activeMarker);
  }

  activeMarker = L.marker([lat, lon], {
    icon: L.divIcon({
      className: 'black-marker',
      html: '⬤',
      iconSize: [16, 16],
    }),
  }).addTo(map);

  if (popupHTML) {
    activeMarker.bindPopup(popupHTML).openPopup();
  }

  map.setView([lat, lon], 17);
}

/* REVERSE GEOCODING (MAP CLICK) */

async function reverseGeocode(lat, lon) {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}

map.on('click', async (e) => {
  const { lat, lng } = e.latlng;
  const address = await reverseGeocode(lat, lng);
  if (!address) return;

  activeAddress = address;
  document.getElementById('addressInput').value = address;

  await loadReportsAndPopup(address, lat, lng);
});


/* ADDRESS SEARCH (PHILADELPHIA-ONLY) */

document.getElementById('searchBtn').addEventListener('click', async () => {
  const input = document.getElementById('addressInput').value.trim();
  if (!input) return;

  const url =
    'https://nominatim.openstreetmap.org/search?' +
    'format=json' +
    '&q=' + encodeURIComponent(input) +
    '&countrycodes=us' +
    '&limit=5' +
    '&viewbox=-75.2803,40.1379,-74.9558,39.8670' + // Philly bbox
    '&bounded=1';

  const res = await fetch(url);
  const results = await res.json();

  if (!results.length) {
    alert('Address not found in Philadelphia.');
    return;
  }

  // Pick first result that is actually in Philadelphia County
  const match = results.find((r) =>
    r.display_name.toLowerCase().includes('philadelphia'),
  );

  if (!match) {
    alert('Address not found in Philadelphia.');
    return;
  }

  const lat = parseFloat(match.lat);
  const lon = parseFloat(match.lon);

  activeAddress = match.display_name;
  document.getElementById('addressInput').value = activeAddress;

  await loadReportsAndPopup(activeAddress, lat, lon);
});


/* CLEAR SELECTION */

document.getElementById('clearBtn').addEventListener('click', () => {
  if (activeMarker) {
    map.removeLayer(activeMarker);
    activeMarker = null;
  }

  activeAddress = null;
  document.getElementById('addressInput').value = '';

  map.setView([39.99, -75.12], 11);
});

/* LOAD REPORTS → POPUP */

async function loadReportsAndPopup(address, lat, lon) {
  const q = query(collection(db, 'reports'), where('address', '==', address));
  const snapshot = await getDocs(q);

  let popupHTML = `<strong>${address}</strong><hr/>`;

  if (snapshot.empty) {
    popupHTML += `
      HVAC: N/A<br/>
      Heating: N/A<br/>
      Insulation: N/A<br/>
      Mold: N/A<br/>
      Rating: N/A
    `;
  } else {
    snapshot.forEach((doc) => {
      const d = doc.data();
      popupHTML += `
        <div class="report-entry">
          HVAC: ${d.hvac}<br/>
          Heating: ${d.heating}<br/>
          Insulation: ${d.insulation}<br/>
          Mold: ${d.mold}<br/>
          Rating: ${d.rating || 'N/A'}<br/>
          ${d.comments ? `<em>${d.comments}</em>` : ''}
          <hr/>
        </div>
      `;
    });
  }

  placeMarker(lat, lon, popupHTML);
}

/* SUBMIT REPORT */

document.getElementById('reportForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!activeAddress || !activeMarker) {
    alert('Please select a location on the map first.');
    return;
  }

  const rating =
    document.querySelector('input[name="rating"]:checked')?.value || 'N/A';

  await addDoc(collection(db, 'reports'), {
    address: activeAddress,
    hvac: document.getElementById('hvac').value,
    heating: document.getElementById('heating').value,
    insulation: document.getElementById('insulation').value,
    mold: document.getElementById('mold').value,
    rating,
    comments: document.getElementById('comments').value,
    createdAt: new Date(),
  });

  document.querySelector('.disclaimer').innerText =
    'Thank you for contributing. Your report has been recorded.';

  e.target.reset();

  const { lat, lng } = activeMarker.getLatLng();
  await loadReportsAndPopup(activeAddress, lat, lng);
});
