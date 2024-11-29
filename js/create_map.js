function initializeMap(el, eventBus, mapQuestionNumber) {
  const map = L.map(el, {maxZoom: 18, zoomsnap: 0, scrollWheelZoom: false}).setView([1.3521, 103.8198], 8);
  const mapboxKey = 'pk.eyJ1Ijoic2Vhbm1rb2giLCJhIjoiY20weGI2bm8zMGJmOTJqcHEzeTRnZXEwcCJ9.8OStU7WetpCxZ9YiUCiigA';
  const mapboxStyle = 'mapbox/streets-v12';

  L.tileLayer(`https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${mapboxKey}`, {
    tileSize: 512,
    zoomOffset: -1,
    detectRetina: true,
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);


  eventBus.addEventListener( 'address-zoom-map', (evt) => zoomMap(evt, map) );

  const clickIcon = L.icon({
    iconUrl: './img/placeholder.png',

    iconSize:     [64, 64], // size of the icon
    iconAnchor:   [0, 94], // point of the icon which will correspond to marker's location
    // popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

  const clickPopup = L.marker(null, {icon: clickIcon});

  map.on('click', (evt) => onMapClick(evt, map, clickPopup, eventBus, mapQuestionNumber));

  return ( map );
}

// Zoom map when address-zoom-map event is triggered by search box from address-input.js
function zoomMap(evt, map) { 
  const feature = evt.detail;
  const [lat, lon] = feature.coordinates;
  console.log([lat, lon]);
  console.log(feature);
  map.setView([lat, lon], 12);
}

// Handle when a location is clicked on the map
function onMapClick(evt, map, clickPopup, eventBus, mapQuestionNumber) {

  // Move map icon to wherever the map is clicked
  clickPopup
      .setLatLng(evt.latlng)
      //.setContent("You clicked the map at " + evt.latlng.toString())
      .addTo(map);

  // Create event to map where map was clicked to save answer
  const mapClicked = new CustomEvent('map-click', 
    { detail: { lat: evt.latlng.lat, lon:evt.latlng.lng, qn: mapQuestionNumber }});
  
  console.log("Map clicked for question " + mapQuestionNumber)

  eventBus.dispatchEvent(mapClicked);
  
}

export { initializeMap };