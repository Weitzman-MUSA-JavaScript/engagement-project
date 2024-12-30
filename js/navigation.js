import { db, ref, onValue } from "./firebase.js";

async function initMap(El, mapboxToken) {
  const map = new mapboxgl.Map({
    container: El,
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-75.16, 39.95],
    zoom: 12,
    accessToken: mapboxToken,
  });

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
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true,
  });
  map.addControl(geolocate);

  map.on('load', () => {
    geolocate.trigger();
  });

  geolocate.on('geolocate', (e) => {
    const userCoordinates = [e.coords.longitude, e.coords.latitude];
    directions.setOrigin(userCoordinates);
    map.flyTo({
      zoom: 14,
      center: userCoordinates,
    });
  });

  geolocate.on('error', () => {
    console.error('Failed to get position!');
  });

  const rampsResponse = await fetch("data/ramps.json");
  const rampsCollection = await rampsResponse.json();

  const saniResponse = await fetch("data/sanitation_day.json");
  const sanitation = await saniResponse.json();

  const ppaResponse = await fetch("data/ppa.json");
  const ppaViols = await ppaResponse.json();

  delete ppaViols.features[0].properties.violation_desc;

  map.on('load', () => {
    const weekday = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const d = new Date();
    const todayWeekday = weekday[d.getDay()];

    map.addSource('sanitation', {
      type: 'geojson',
      data: sanitation,
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

    map.addSource('ramps', {
      type: 'geojson',
      data: rampsCollection,
    });

    map.addLayer({
      id: 'ramps-layer',
      type: 'circle',
      source: 'ramps',
      paint: {
        'circle-radius': 3,
        'circle-color': 'firebrick',
        'circle-opacity': 0.4,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'firebrick',
      },
    });

    map.on('click', 'ramps-layer', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = 'Missing curb ramp';

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
    });

    map.on('mouseenter', 'ramps-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'ramps-layer', () => {
      map.getCanvas().style.cursor = '';
    });

    map.addSource('ppa', {
      type: 'geojson',
      data: ppaViols,
      cluster: true,
      clusterMaxZoom: 15,
      clusterRadius: 50,
    });

    map.addLayer({
      id: 'ppa-cluster',
      type: 'circle',
      source: 'ppa',
      filter: ['all', ['!=', 'violation', 'CORNER CLEARANCE'], ['has', 'point_count']],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          'royalblue',
          20,
          'royalblue',
          90,
          'royalblue',
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          4,
          20,
          10,
          90,
          15,
        ],
        'circle-opacity': 0.9,
      },
    });

    map.addLayer({
      id: 'ppa-cluster-count',
      type: 'symbol',
      source: 'ppa',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 10,
      },
      paint: {
        'text-color': 'white',
      },
    });

    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'ppa',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': 'white',
        'circle-radius': 2,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'royalblue',
      },
    });

    map.on('click', 'unclustered-point', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const violAddress = e.features[0].properties.location;
      const violType = e.features[0].properties.violation;

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`${violAddress}<br>Violation: ${violType}`)
        .addTo(map);
    });

    map.on('mouseenter', 'ppa-cluster', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'ppa-cluster', () => {
      map.getCanvas().style.cursor = '';
    });

    function updateMapLayer(map) {
      const reportsRef = ref(db, 'reports');
    
      onValue(reportsRef, (snapshot) => {
        const reportsData = snapshot.val();
    
        const geojson = {
          type: 'FeatureCollection',
          features: Object.entries(reportsData).map(([key, report]) => {
            const [lat, lng] = report.location.split(',').map(parseFloat);
            return {
              type: 'Feature',
              id: key,
              geometry: {
                type: 'Point',
                coordinates: [lng, lat],
              },
              properties: {
                description: report.description,
                category: report.category,
              },
            };
          }),
        };
    
        geojson.features.forEach((feature) => {
          const el = document.createElement('div');
          el.className = 'marker';
          const [lng, lat] = feature.geometry.coordinates;

          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map);
        
          const popupContent = `
            Category: ${feature.properties.category}<br>
            Description: ${feature.properties.description}
          `;
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setLngLat([lng, lat])
            .setHTML(popupContent);
        
          marker.setPopup(popup);
        });
      });
    };

    updateMapLayer(map);
    });

  document.querySelector('button.mapboxgl-ctrl-geolocate').innerHTML = 'Get current location';
}

export { initMap };