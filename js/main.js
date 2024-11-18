import { initMap } from './basemap.js';
import { loadData } from './loadData.js';
import { waterParcel } from './loadWP.js';
import { addWaterParcel } from './wpmap.js';
import { updateSliderValue } from './sliderValue.js';
import { drawBar } from './drawBar.js';
import { initAddressSearch } from './address_search.js';

const events = new EventTarget();

// basemap data
const {shadow, buildings, landuse} = await loadData();

// initialize basemap
const mapEl = document.querySelector('#map');
const basemap = initMap(mapEl, shadow, buildings, landuse);

// water parcel data and information
const allWaterData = {};
const allParcelData = {};
for (let level = 515; level <= 526; level++) {
  const waterData = await waterParcel(level);
  allWaterData[level] = waterData.waterFeatures;
  allParcelData[level] = waterData.parcelFeatures;
}
const waterParcelLayerGroup = L.layerGroup().addTo(basemap);

function updateWaterParcels(level) {
  waterParcelLayerGroup.clearLayers();
  addWaterParcel(waterParcelLayerGroup, allWaterData[level], allParcelData[level]);
}
const slider = document.querySelector('#waterLevel');
const barEL = d3.select('#type-bar');
slider.addEventListener('input', (event) => {
  const level = parseInt(event.target.value);
  updateWaterParcels(level);
  updateSliderValue(allParcelData, level);
  drawBar(barEL, allParcelData[level]);
});
await updateWaterParcels(515);
updateSliderValue(allParcelData, 515);
drawBar(barEL, allParcelData[515]);

// address search component
const searchEl = document.querySelector('[name="address-search"]');
initAddressSearch(searchEl, events);
function handleAddressSelection(event, map) {
  const feature = event.detail;
  const [lng, lat] = feature.geometry.coordinates;
  map.setView([lat, lng], 17);
}
events.addEventListener('autocompleteselected', (event) => {
  handleAddressSelection(event, basemap);
});
const originalView = { center: [44.26053976443341, -72.583011566153], zoom: 14 };
const ResetControl = L.Control.extend({
  options: { position: 'bottomright' },
  onAdd: function() {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
    container.style.backgroundColor = 'white';
    container.style.padding = '5px';
    container.style.cursor = 'pointer';
    container.innerHTML = 'Reset View';
    L.DomEvent.on(container, 'click', function() {
      basemap.setView(originalView.center, originalView.zoom);
    });
    return container;
  },
});
basemap.addControl(new ResetControl());


// control panels
const tool1Button = document.querySelector('#tool1');
const tool2Button = document.querySelector('#tool2');
const sidebarContainer = document.querySelector('#sidebar-container');
const addressSearchContainer = document.querySelector('#address-search-container');

tool1Button.addEventListener('click', () => {
  sidebarContainer.style.display = 'block';
  addressSearchContainer.style.display = 'none';
});

tool2Button.addEventListener('click', () => {
  sidebarContainer.style.display = 'none';
  addressSearchContainer.style.display = 'block';
});
