async function initMap(El, mapboxToken) {
  const map = new mapboxgl.Map({
    container: El,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-75.16, 39.95], 
    zoom: 12,
    accessToken: mapboxToken,
  });
  console.log('Map initialized:', map);

  const geocoder = {
    accessToken: mapboxToken,
    mapboxgl: mapboxgl,
    bbox: [-75.28918, 39.88428, -74.93725, 40.12464],
  };

  map.addControl(
    new MapboxDirections({
      accessToken: mapboxToken,
      unit: 'imperial',
      profile: 'mapbox/walking',
      alternatives: true,
      geocoder: geocoder,
      controls: {
        profileSwitcher: false,
      },
    }),
    'top-left'
  );

  const rampsResponse = await fetch("data/ramps.json");
  const rampsCollection = await rampsResponse.json();
  
  const saniResponse = await fetch("data/sanitation_day.json");
  const sanitation = await saniResponse.json();
  
  map.on('load', () => {
    map.addSource('ramps', {
      type: 'geojson',
      data: rampsCollection
    });

    map.addLayer({
      id: 'ramps-layer',
      type: 'circle',
      source: 'ramps',
      paint: {
        'circle-radius': 3,
        'circle-color': 'firebrick',
        'circle-opacity': 0.6
      }
    });
    
    const weekday = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const d = new Date();
    let todayWeekday = weekday[d.getDay()];

    map.addSource('sanitation', {
      type: 'geojson',
      data: sanitation
    });

    map.addLayer({
      id: 'sanitation-layer',
      type: 'fill',
      source: 'sanitation',
      filter: ["==", ["get", "collday"], todayWeekday], 
        paint: {
         "fill-color": "#ff5722", // Highlight today's zones
         "fill-opacity": 0.5,
        },
    });
  });
}  

export { initMap };