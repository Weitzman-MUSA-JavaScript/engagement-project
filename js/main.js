import { initMap } from './basemap.js';
import { loadData } from './loadData.js';
import { waterParcel } from './loadWP.js';
import { addWaterParcel } from './wpmap.js';

// basemap data
const {shadow, buildings, landuse} = await loadData();

// initialize basemap
const mapEl = document.querySelector('#map');
const basemap = initMap(mapEl, shadow, buildings, landuse);

// water parcel data
const {waterFeatures, parcelFeatures} = await waterParcel(522);
addWaterParcel(basemap, waterFeatures, parcelFeatures);

// const waterParcelLayerGroup = L.layerGroup().addTo(basemap);
// async function updateWaterParcels(level) {
//   waterParcelLayerGroup.clearLayers();
//   const { waterFeatures, parcelFeatures } = await waterParcel(level);
//   addWaterParcel(waterParcelLayerGroup, waterFeatures, parcelFeatures);
// }
// const slider = document.querySelector('#waterLevel');
// slider.addEventListener('input', async (event) => {
//   const level = event.target.value;
//   await updateWaterParcels(level);
// });
// await updateWaterParcels(515);
