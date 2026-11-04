
let markers = [];


const markerStyles = {
roadChange: { color: '#00FFFF', icon: '🛣️' },
construction: { color: '#FF00FF', icon: '🚧' },
traffic: { color: '#FFFF00', icon: '🚦' },
incident: { color: '#FF0000', icon: '⚠️' },
hazard: { color: '#FFA500', icon: '⚠️' },
closure: { color: '#FF0000', icon: '🚫' },
newRoad: { color: '#00FF00', icon: '🛣️' },
infrastructure: { color: '#4169E1', icon: '🏗️' },
accident: { color: '#FF4500', icon: '💥' },
testing: { color: '#9400D3', icon: '🚗' },
parking: { color: '#1E90FF', icon: '🅿️' },
charging: { color: '#32CD32', icon: '⚡' }
};


function initializeMarkers() {
const addMarkerBtn = document.getElementById('add-marker-btn');
const markerForm = document.getElementById('marker-form');
const addMarkerForm = document.getElementById('add-marker-form');
const descriptionField = document.getElementById('marker-description');

let selectedLocation = null;


addMarkerBtn.addEventListener('click', () => {
markerForm.style.display = 'block';
descriptionField.readOnly = true;
});


map.on('click', (e) => {
selectedLocation = e.lngLat;
showTemporaryMarker(selectedLocation);
markerForm.style.display = 'block';
descriptionField.readOnly = true;


const ripple = document.createElement('div');
ripple.className = 'map-click-ripple';
ripple.style.left = e.point.x + 'px';
ripple.style.top = e.point.y + 'px';
document.body.appendChild(ripple);
setTimeout(() => ripple.remove(), 1000);
});


document.querySelector('.cancel').addEventListener('click', () => {
markerForm.style.display = 'none';
removeTemporaryMarker();
selectedLocation = null;
addMarkerForm.reset();
descriptionField.readOnly = true;
});


addMarkerForm.addEventListener('submit', (e) => {
e.preventDefault();


if (!selectedLocation) {
showNotification('Please select a location on the map', 'error');
return;
}


if (!descriptionField.value.trim()) {
if (descriptionField.readOnly) {
descriptionField.readOnly = false;
descriptionField.focus();
showNotification('You can now enter description', 'info');
return;
}
showNotification('Please enter a description', 'error');
descriptionField.focus();
return;
}

if (descriptionField.readOnly) {
descriptionField.readOnly = false;
descriptionField.focus();
showNotification('You can now enter description', 'info');
return;
}

const newMarker = {
id: Date.now(),
type: document.getElementById('marker-type').value,
description: descriptionField.value,
duration: document.getElementById('marker-duration').value,
location: selectedLocation,
timestamp: new Date().toISOString()
};


addMarkerToMap(newMarker);


markers.push(newMarker);


updateMarkerList();


saveMarkers();


addMarkerForm.reset();
markerForm.style.display = 'none';
removeTemporaryMarker();
selectedLocation = null;
descriptionField.readOnly = true;


showNotification('Marker added successfully', 'success');
});
}


let temporaryMarker = null;


function showTemporaryMarker(location) {
removeTemporaryMarker();

const el = document.createElement('div');
el.className = 'marker-icon temporary';
el.style.backgroundColor = '#FFFFFF';
el.style.opacity = '0.7';

temporaryMarker = new mapboxgl.Marker(el)
.setLngLat(location)
.addTo(map);
}


function removeTemporaryMarker() {
if (temporaryMarker) {
temporaryMarker.remove();
temporaryMarker = null;
}
}


function addMarkerToMap(markerData) {
const style = markerStyles[markerData.type];


const el = document.createElement('div');
el.className = 'marker-icon';
el.classList.add(markerData.type);


const popup = new mapboxgl.Popup({
offset: 25,
closeButton: true,
closeOnClick: false
}).setHTML(`
<div class="popup-content">
<h3>${style.icon} ${markerData.type.toUpperCase()}</h3>
<p>${markerData.description}</p>
<p><small>Duration: ${markerData.duration}</small></p>
<p><small>Added: ${new Date(markerData.timestamp).toLocaleString()}</small></p>
</div>
`);


new mapboxgl.Marker(el)
.setLngLat(markerData.location)
.setPopup(popup)
.addTo(map);
}


function updateMarkerList() {
const markerList = document.getElementById('marker-list');
markerList.innerHTML = markers.map(marker => {
const style = markerStyles[marker.type];
return `
<div class="marker-item" data-id="${marker.id}">
<h4>${style.icon} ${marker.type.toUpperCase()}</h4>
<p>${marker.description}</p>
<small>
Added: ${new Date(marker.timestamp).toLocaleString()}<br>
Duration: ${marker.duration}
</small>
</div>
`;
}).join('');


document.querySelectorAll('.marker-item').forEach(item => {
item.addEventListener('click', () => {
const marker = markers.find(m => m.id === parseInt(item.dataset.id));
if (marker) {
map.flyTo({
center: [marker.location.lng, marker.location.lat],
zoom: 15,
duration: 1000
});
}
});
});
}


function loadSavedMarkers() {
const savedMarkers = localStorage.getItem('markers');
if (savedMarkers) {
markers = JSON.parse(savedMarkers);
markers.forEach(marker => addMarkerToMap(marker));
updateMarkerList();
}
}


function saveMarkers() {
localStorage.setItem('markers', JSON.stringify(markers));
}


document.addEventListener('DOMContentLoaded', () => {
initializeMarkers();
loadSavedMarkers();
});


window.addEventListener('beforeunload', saveMarkers);
