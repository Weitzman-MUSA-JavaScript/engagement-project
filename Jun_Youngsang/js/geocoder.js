function setupGeocoder(map) {
  // Add the control to the map.
  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    bbox: [-76.34, 36.9, -76.25, 36.97],
    language: 'en-US',
    countries: 'us',
    mapboxgl: mapboxgl,
  });

  document.getElementById('geocoder').appendChild(geocoder.onAdd(map));
}

export { setupGeocoder };
