// assets/js/dashboard.js
import { Vismap } from './vismap.js';
import { visualizeCharts } from './vischarts.js';
import { initializeSearch } from './search.js';
import { populateInfoTable } from './infoTable.js';
import { setupEventListeners } from './events.js';

console.log('Initializing dashboard.');

// Initialize the map
const map = L.map('map', { scrollWheelZoom: true }).setView([39.9800, -75.1200], 11);

// Add tile layer
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    maxZoom: 18,
    id: 'mapbox/light-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiZnJhbmtjaCIsImEiOiJjbG95aTZhbGQwM2ZwMmhxb3BvOGE3cjExIn0.9FCYx6xJ-wp8YEgk7VpG0Q' // Replace with your actual access token
}).addTo(map);

// Define column and breaks
const columnName = 'Total Spend';
const customBreaks = [500, 1000, 1500, 2000, 3000, 5000, 8000, 10000];

// Initialize Vismap
const vismapInstance = new Vismap(map, customBreaks, columnName);
vismapInstance.fetchData(document.getElementById('year-selector').value);

// Define column display mapping
const columnDisplayMapping = {
    'Name': 'Name',
    'Address': 'Address',
    'Category': 'Category',
    'Total Spend': 'Total Spend',
    'Total Customers': 'Total Customers',
    'Total Transactions': 'Total Transactions',
    'Median Dwell Time': 'Median Dwell Time (min)',
    'Median Spend per Transaction': 'Median Spend per Transaction',
    'Median Spend per Customer': 'Median Spend per Customer'
};

// Setup event listeners and retrieve location names
const locationNamesRef = setupEventListeners(
    map,
    vismapInstance,
    'year-selector',
    visualizeCharts,
    (properties) => populateInfoTable(properties, columnDisplayMapping)
);

// Initialize search functionality with a getter for locationNames
initializeSearch(
    'search-input',
    'suggestions-list',
    () => locationNamesRef.current, // Getter function for current locationNames
    (name) => {
        highlightLocation(name);
    }
);

// Initialize charts with a default state (no data)
visualizeCharts(null);

function highlightLocation(locationName) {
    const layer = vismapInstance.findLayerByLocationName(locationName);
    if (layer) {
        // Pan and zoom to the selected location
        const latlng = layer.getLatLng();
        const targetZoom = 16;
        map.flyTo(latlng, targetZoom, { duration: 1 });

        // After fly animation completes, trigger the click event
        map.once('moveend', () => {
            console.log(`Simulating click for location: "${locationName}"`);
            layer.fire('click'); // Simulate a click event on the layer
        });
    } else {
        console.warn(`Layer for LOCATION_NAME "${locationName}" not found.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const surveyButton = document.getElementById('survey-button');
    const popup = document.getElementById('survey-popup');
    const closePopupButton = document.getElementById('close-popup');
    const surveyForm = document.getElementById('survey-form');

    // Open popup
    surveyButton.addEventListener('click', () => {
        popup.classList.remove('hidden');
    });

    // Close popup
    closePopupButton.addEventListener('click', () => {
        popup.classList.add('hidden');
    });

    // Handle survey submission
    surveyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const spend = document.getElementById('spend-input').value;
        const stay = document.getElementById('stay-input').value;

        console.log(`Survey Data: Spend = $${spend}, Stay = ${stay} minutes`);
        alert('Thank you for your feedback!');

        // Reset form and close popup
        surveyForm.reset();
        popup.classList.add('hidden');
    });
});
