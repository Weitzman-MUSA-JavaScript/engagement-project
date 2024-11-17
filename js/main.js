import { initMap } from './basemap.js';
import { loadData } from './loadData.js';
import { waterParcel } from './loadWP.js';
import { addWaterParcel } from './wpmap.js';

const {shadow, buildings, landuse} = await loadData();

const mapEl = document.querySelector('#map');
const basemap = initMap(mapEl, shadow, buildings, landuse);

const {waterFeatures, parcelFeatures} = await waterParcel(516);
addWaterParcel(basemap, waterFeatures, parcelFeatures);

