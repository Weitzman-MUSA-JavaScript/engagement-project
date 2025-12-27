import * as utils from './utils.js';

/**
* Populate options of a drop-down menu
*
* @param {EventTarget} eventBus - The event bus to dispatch the event on
* @param {object} geojsonData - The GeoJSON FeatureCollection with data
* @param {string} dropdownId - The id of the dropdown element
* @param {string} propertyName - The property name which contains option values
* @param {string} defaultText - The text to display for the default option
*/
export function populateDropdown(eventBus, geojsonData, dropdownId, propertyName, defaultText = 'Please choose an option') {
    // Get the dropdown element
    const dropdownElement = document.getElementById(dropdownId);
    // Clear existing options
    dropdownElement.innerHTML = '';
    // Turn disabled off
    dropdownElement.disabled = false;
    
    // Add a default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = defaultText;
    dropdownElement.appendChild(defaultOption);
    
    // Create array of unique property values
    const optionsArray = utils.getUniquePropertyValues(geojsonData, propertyName);
    
    // Populate new options
    optionsArray.forEach(value => {
        const option = document.createElement('option');     
        option.value = value;
        option.textContent = value;
        dropdownElement.appendChild(option);
    });

    // Dispatch filtered data to event bus once selection is made
    dispatchData(eventBus, geojsonData, dropdownId, propertyName);
}

/**
* Listen for changes in a dropdown menu and dispatch an event containing the data filtered by the
* value of the selection
*
* @param {EventTarget} eventBus - The event bus to dispatch the event on
* @param {object} geojsonData - The GeoJSON FeatureCollection with data to be filtered
* @param {string} dropdownId - The id of the dropdown element
* @param {string} propertyName - The property name to filter on
*/
export function dispatchData(eventBus, geojsonData, dropdownId, propertyName) {
    const dropdownElement = document.getElementById(dropdownId);
    dropdownElement.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        const filteredData = utils.filterGeojsonByProperty(geojsonData, propertyName, selectedValue);
        const customEvent = new CustomEvent(`${dropdownId}Data`, { detail: { value: selectedValue, data: filteredData } });
        eventBus.dispatchEvent(customEvent);
        // For debugging, print to console the name and details of the event dispatched
        console.log(`Event dispatched: ${customEvent.type}`, customEvent.detail);
        
    });
}

/**
* Populate a new dropdown menu with data filtered from a previous dropdown selection passed via event bus, 
* with values based on a specified property.
* 
* @param {EventTarget} eventBus - The event bus to listen on
* @param {string} dataEventName - The name of the event to listen for, containing filtered data
* @param {string} dropdownId - The id of the dropdown element to be populated
* @param {string} propertyName - Name of the property with values to be shown as options
* @param {string} defaultText - The text to display for the default option
*/
export function cascadeDropdown(eventBus, dataEventName, dropdownId, propertyName, defaultText) {
    eventBus.addEventListener(dataEventName, (event) => {
        const filteredData = event.detail.data;
        // Print to console name and details of the received event for debugging
        console.log(`Event received: ${dataEventName}`, event.detail);
        // Populate the new dropdown with the filtered data
        populateDropdown(eventBus, filteredData, dropdownId, propertyName, defaultText);
        // Logging for debugging
        console.log(`New dropdown populated for: ${dropdownId}, filtering by ${propertyName}`);
    });
}
