let map1Initialized = false;

function initMap1() {
  map1Initialized = true;
  const map1 = L.map('map1').setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map1);


}
