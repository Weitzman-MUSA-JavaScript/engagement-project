import { initMap } from './basemap.js';
import { loadData } from './loadData.js';
import { waterParcel } from './loadWP.js';
import { addWaterParcel } from './wpmap.js';
import { updateSliderValue } from './sliderValue.js';
// import { drawHist} from './drawHist.js';

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
slider.addEventListener('input', (event) => {
  const level = parseInt(event.target.value);
  updateWaterParcels(level);
  updateSliderValue(allParcelData, level);
});
await updateWaterParcels(515);
updateSliderValue(allParcelData, 515);

// const histogramEL = d3.select('#valueHistogram');
// drawHist(histogramEL, allParcelData[515]);
