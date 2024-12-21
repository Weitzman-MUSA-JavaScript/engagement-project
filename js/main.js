import { initMap } from './navigation.js';

const mapboxToken = 'pk.eyJ1Ijoic29sYW5vYSIsImEiOiJjbTR3ZWU4MzAwY3JkMmpwb252czJudDVjIn0.6GUU4rEhxQx-bsGw5d7zeQ'; 

const el = document.querySelector('.map');
console.log('Map container found:', el);
initMap(el, mapboxToken);