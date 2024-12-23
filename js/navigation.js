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

  const directions = new MapboxDirections({
      accessToken: mapboxToken,
      unit: 'imperial',
      profile: 'mapbox/walking',
      alternatives: true,
      interactive: false,
      geocoder: geocoder,
      controls: {
        profileSwitcher: false,
      },
    });

  map.addControl(directions, 'top-left');

  const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {enableHighAccuracy: true},
      trackUserLocation: true,
      showUserHeading: true,
  });
  map.addControl(geolocate);

  geolocate.on('geolocate', (e) => {
    const userCoordinates = [e.coords.longitude, e.coords.latitude];
    setCurrentLocationAsOrigin(userCoordinates);
  });

  const rampsResponse = await fetch("data/ramps.json");
  const rampsCollection = await rampsResponse.json();
  
  const saniResponse = await fetch("data/sanitation_day.json");
  const sanitation = await saniResponse.json();

  const ppaResponse = await fetch("data/ppa.json");
  const ppaViols = await ppaResponse.json();

  delete ppaViols.features[0].properties.violation_desc;
  
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

    map.on('click', 'ramps-layer', (e) => {
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = 'Missing curb ramp';

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', 'ramps-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'ramps-layer', () => {
        map.getCanvas().style.cursor = '';
    });
    
    map.addSource('ppa', {
      type: 'geojson',
      data: ppaViols
    });

    map.addLayer({
      id: 'ppa-layer',
      type: 'circle',
      source: 'ppa',
      paint: {
        'circle-radius': 2,
        'circle-color': '#98AFC7',
        'circle-opacity': 0.2
      }
    });

    map.on('click', 'ppa-layer', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = e.features[0].properties.violation;

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
    });

    map.on('mouseenter', 'ppa-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'ppa-layer', () => {
        map.getCanvas().style.cursor = '';
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
         "fill-color": "#ff5722",
         "fill-opacity": 0.5,
        },
    });
  });

  function setCurrentLocationAsOrigin(userCoordinates) {
    // Set the origin of the Directions control
    directions.setOrigin(userCoordinates);

    // Find the input field for the origin
    const originInput = document.querySelector('.mapbox-directions-origin-input');
    if (originInput) {
      originInput.value = 'Current Location'; // Change text to 'Current Location'
    }
  }
}

export { initMap };