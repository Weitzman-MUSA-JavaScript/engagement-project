import { zoomMap } from "./create_map.js";
import { loadResult } from "./lookup_result.js";

function initializeMapView(el, eventBus) {

  // Create final map for viewing results
  const map = createMap(el);

  // Enable map to zoom
  eventBus.addEventListener( "address-zoom-map-view", (evt) => zoomMap(evt, map) );

  // Results from session
  let results = null;

  // Create layer group to render results on
  const layerGroup = L.layerGroup();
  layerGroup.addTo(map);

  // Load results when slide is moved onto the view results page
  eventBus.addEventListener("load-results", (evt) => {
    loadResult(evt.detail.sessionID).then(
      (data) => {
        results = data;
        console.log("LOOK AT RESULTS" + results);

        // Initially render question 1
        renderData(1, layerGroup, results);
      }
    );    
  })

  // Re-render data when a new question is chosen
  eventBus.addEventListener("qn-choice", (evt) => renderData(evt.detail.qnChosen, layerGroup, results));

  return ( map );
}

function createMap(el) {
  const map = L.map(el, {maxZoom: 18, zoomsnap: 0, scrollWheelZoom: false}).setView([0, 0], 1);
  const mapboxKey = 'pk.eyJ1Ijoic2Vhbm1rb2giLCJhIjoiY20weGI2bm8zMGJmOTJqcHEzeTRnZXEwcCJ9.8OStU7WetpCxZ9YiUCiigA';
  const mapboxStyle = 'mapbox/streets-v12';


  L.tileLayer(`https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${mapboxKey}`, {
    tileSize: 512,
    zoomOffset: -1,
    detectRetina: true,
    maxZoom: 19,
    attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
  }).addTo(map);

  return (map);
}

function renderData(qnNumber, layerGroup, results) {

  const defaultOptions = {
    pointToLayer: (feature, latlng) => L.marker(latlng, {icon: generateIcon(feature.properties.icon)}),
    style: (feature) =>
      feature.geometry.type === "Point" ?
        { stroke: false,
          radius: 2,
          fillOpacity: 1,
          color: "#AA4A44",
          icon: generateIcon(feature.properties.icon),
        } :
        {},
    interactive: true,
    onEachFeature: (feature, layer) => {
      return(layer.bindPopup(feature.properties.username));
    }
  };
  
  const filteredResults = results.filter( (feature) => feature.properties.qnNumber == qnNumber);

  console.log(filteredResults);

  layerGroup.clearLayers();

  L.geoJSON(filteredResults, defaultOptions).addTo(layerGroup);
}

// Get icon's url from ID which is recorded in the user response
function getIconURL(iconID) {
  const iconMap = {
    "cat-icon" : "./img/icons/B_Cat.PNG",
    "dog-icon" : "./img/icons/B_Dog.PNG",
    "fox-icon" : "./img/icons/B_Fox.PNG",
    "gir-icon" : "./img/icons/B_Giraffe.PNG",
    "ham-icon" : "./img/icons/P_Hamster.PNG",
    "pan-icon" : "./img/icons/P_Panda.PNG",
    "she-icon" : "./img/icons/P_Sheep.PNG",
    "ele-icon" : "./img/icons/Y_Elephant.PNG",
    "slo-icon" : "./img/icons/Y_Sloth.PNG",
    "zeb-icon" : "./img/icons/Y_Zebra.PNG",
  }

  return(iconMap[iconID]);
}

function generateIcon(iconID) {
  return( L.icon({
    iconUrl: getIconURL(iconID),

    iconSize:     [48, 48], // size of the icon
    iconAnchor:   [25, 25], // point of the icon which will correspond to marker"s location
    // popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
  }) )
}

export { initializeMapView };