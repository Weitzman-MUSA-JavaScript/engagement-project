async function initMap(El, mapboxglToken) {
  const map = new mapboxgl.Map({
    container: El,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-75.16, 39.95], 
    zoom: 12,
    accessToken: mapboxglToken
  });
  console.log('Map initialized:', map);

  const rampsResponse = await fetch("data/ramps.json");
  const rampsCollection = await rampsResponse.json();
  console.log("Loaded GeoJSON data:", rampsCollection);
  


  const saniResponse = await fetch("data/sanitation_day