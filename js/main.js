import { initMap } from './navigation.js';

const mapboxglToken = 'pk.eyJ1Ijoic29sYW5vYSIsImEiOiJjbTR3ZWU4MzAwY3JkMmpwb252czJudDVjIn0.6GUU4rEhxQx-bsGw5d7zeQ'; 
console.log(mapboxglToken);

const el = document.querySelector('.map');
initMap(el, mapboxglToken);
console.log(el);