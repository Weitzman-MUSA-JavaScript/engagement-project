import * as utils from './utils.js';

/**
* Initialize the Leaflet map with base layers and controls
* @param {EventTarget} eventBus - The event bus to listen for data events
* @param {HTMLElement} mapElement - DOM element to attach the map to
* @param {Object} initialData - GeoJSON data to display on the map
*/
async function initMap(eventBus, mapElement, initialData) {
    // Initialize the Leaflet map
    map = L.map(mapElement, {
        center: [39.95, -75.19], // Philadelphia coordinates
        zoom: 10,
    });
    
    // Add base tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    
    // Load initial data  
    const initialLayer = L.geoJSON(initialData, {
        style: feature => {
            return { color: '#be9b0eff' };
        }
    });
    initialLayer.addTo(map);
    map.fitBounds(initialLayer.getBounds());
    
    // When route is selected, update map to show only that route
    eventBus.addEventListener('routeData', (event) => {
        const routeData = event.detail.data;
        const routeId = utils.getUniquePropertyValues(routeData, 'route_id')[0];
        const routeMapData = utils.filterGeojsonByProperty(initialData, 'route_id', routeId);
        console.log('Updating map for route:', routeId, routeMapData);
        
        // Highlight the selected route on the map
        updateRouteMap(routeMapData);
        
        // Change opacity of other routes
        initialLayer.eachLayer(layer => {
            if (layer.feature.properties.route_id !== routeId) {
                layer.setStyle({ opacity: 0.2});
            }
        });
    });
    
    // When stop is selected, update map to show that stop
    eventBus.addEventListener('stopData', (event) => {
        const stopMapData = event.detail.data;
        console.log('Updating map for stop:', stopMapData);
        
        // Highlight the selected stop on the map
        updateStopMap(stopMapData);
    });
}

/**
* Show selected route on map
* @param {Object} routeData - GeoJSON data to display on the map
*/
function updateRouteMap(routeData) {
    // Remove existing route layer if present
    if (map.routeLayer) {
        map.removeLayer(map.routeLayer);
    }
    
    // Add new route layer
    map.routeLayer = L.geoJSON(routeData, {
        style: feature => {
            return { color: '#ff7800ff', weight: 5 };
        }
    });
    map.routeLayer.addTo(map);
    map.fitBounds(map.routeLayer.getBounds());
}

/**
* Show selected stop on map
* @param {Object} stopData - GeoJSON data for the selected stop
*/
function updateStopMap(stopData) {
    // Define custom icon for stop marker
    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div style='background-color:#000000;' class='marker-pin'></div><i class='material-icons'>departure_board</i>",
        iconSize: [30, 42],
        iconAnchor: [15, 42]
    });
    
    // Remove existing stop marker if present
    if (map.stopMarker) {
        map.removeLayer(map.stopMarker);
    }
    
    // Add new stop marker
    const stopFeature = stopData.features[0];
    const [lat, lng] = stopFeature.geometry.coordinates.slice().reverse(); // GeoJSON uses [lng, lat]
    
    map.stopMarker = L.marker([lat, lng], {
        icon: icon
    }).addTo(map);
    map.setView([lat, lng], 15);
}

export { initMap };
