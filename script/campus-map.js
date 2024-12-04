export let campusMap;
let tempMarker = null;

export function initializeCampusMap(eventBus, data) {
  campusMap = L.map('campus-map').setView([51.5247275, -0.1333933], 16);

  const mapboxKey = 'pk.eyJ1IjoiY2xhdWRsb3ciLCJhIjoiY20weTY3MDZoMDNocTJrbXpqa3lqZWJlaSJ9.3N1iXpEvsJ0GwajGVwwkTg';
  const mapboxStyle = 'mapbox/streets-v12';

  const baseTileLayer = L.tileLayer(`https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${mapboxKey}`, {
    maxZoom: 19,
    attribution: '&copy; Mapbox &copy; OpenStreetMap',
  });

  baseTileLayer.addTo(campusMap);

  campusMap.on('load', () => console.log('Map loaded successfully.'));
  baseTileLayer.on('tileerror', (error) => console.error('Tile error:', error));
}

export function addLocationMarker(lat, lng) {
  if (tempMarker) {
    campusMap.removeLayer(tempMarker);
  }
  tempMarker = L.marker([lat, lng]).addTo(campusMap);
  campusMap.setView([lat, lng], 16);
  return tempMarker;
}
