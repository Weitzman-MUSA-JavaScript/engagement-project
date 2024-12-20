async function initMap(el, mapboxKey) {
  const map = L.map(el, { maxZoom: 18, zoomSnap: 0 }).setView([39.95, -75.16], 12);

  const mapboxStyle = 'mapbox/streets-v12';

  L.tileLayer(`https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${mapboxKey}`, {
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const rampsResponse = await fetch("data/ramps.json");
  const rampsCollection = await rampsResponse.json();
  console.log("Loaded GeoJSON data:", rampsCollection);
  
  const rampLayer = L.geoJSON(rampsCollection, {
    filter: function(feature) {
      return feature.properties.status ==='MISSING' && feature.properties.county === 'PHILADELPHIA';
    },
    pointToLayer: function(feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 2,
        color: 'firebrick',
        weight: 1,
        fillColor: 'firebrick',
        fillOpacity: 0.5,
      });
    },
  }).addTo(map);

  const weekday = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const d = new Date();
  let todayWeekday = weekday[d.getDay()];

  const sani = await fetch("data/sanitation_day.json");
  const sanitation = await sani.json();
  
  const sanitationLayer = L.geoJSON(sanitation, {
    style: (feature) => {
      if (feature.properties.collday === todayWeekday) {
        return {
          fillColor: 'firebrick',
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7,
        };
      } else {
        return {
          fillColor: 'transparent',
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7,
        };
      }
    },
  }).addTo(map);

  return map;
}
  
export { initMap };