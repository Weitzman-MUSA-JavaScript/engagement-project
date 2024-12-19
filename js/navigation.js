const map = L.map('map').setView([39.95, -75.16], 12);

const mapboxKey = 'pk.eyJ1Ijoic29sYW5vYSIsImEiOiJjbTE3emMzY20wNXF4MmtxMm1vdXJyNXhtIn0.ntr6qIDgX5kSaUvvr4CzDA';
const mapboxStyle = 'mapbox/streets-v12';

L.tileLayer(`https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${mapboxKey}`, {
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
