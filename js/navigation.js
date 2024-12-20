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
  


  const saniResponse = await fetch("data/sanitation_day.json");
  const sanitation = await saniResponse.json();
  console.log("Loaded sanitation data:", sanitation);
  
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
        'circle-radius': 5,
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
      filter: ["==", ["get", "collday"], todayWeekday], // Filter for today
            paint: {
                "fill-color": "#ff5722", // Highlight today's zones
                "fill-opacity": 0.5,
            },
    });

    const start = [-75.16, 39.95];

    async function getRoute(end) {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxglToken}`,
        { method: 'GET' }
      );
      const json = await query.json();
      const data = json.routes[0];
      const route = data.geometry.coordinates;
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route
        }
      };

      if (map.getSource('route')) {
        map.getSource('route').setData(geojson);
      } else {
        map.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: geojson
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3887be',
            'line-width': 5,
            'line-opacity': 0.75
          }
        });
      }

    const instructions = document.getElementById('instructions');
    const steps = data.legs[0].steps;

    let tripInstructions = '';
    for (const step of steps) {
      tripInstructions += `<li>${step.maneuver.instruction}</li>`;
    }
    instructions.innerHTML = `<p><strong>Trip duration: ${Math.floor(
      data.duration / 60
    )} min </strong></p><ol>${tripInstructions}</ol>`;
    }

    map.addLayer({
      id: 'point',
      type: 'circle',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: start
              }
            }
          ]
        }
      },
      paint: {
        'circle-radius': 10,
        'circle-color': '#3887be'
      }
    });

    getRoute(start);

    map.on('click', (event) => {
      const coords = [event.lngLat.lng, event.lngLat.lat];
      const end = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: coords
            }
          }
        ]
      };

      if (map.getLayer('end')) {
        map.getSource('end').setData(end);
      } else {
        map.addLayer({
          id: 'end',
          type: 'circle',
          source: {
            type: 'geojson',
            data: end
          },
          paint: {
            'circle-radius': 10,
            'circle-color': '#f30'
          }
        });
      }

      getRoute(coords);
    });
  });

  return map;
}

export { initMap };