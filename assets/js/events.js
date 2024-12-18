export function setupEventListeners(map, vismapInstance, yearSelectorId, visualizeChartsCallback, populateInfoTableCallback) {
    const yearSelector = document.getElementById(yearSelectorId);

    // Reference object to store locationNames
    const locationNamesRef = {
        current: []
    };

    function updateLocationNames() {
        locationNamesRef.current = vismapInstance.getLocationNames();
        console.log('Location Names updated:', locationNamesRef.current);
    }

    // Listen for the 'dataLoaded' event to update LOCATION_NAMEs
    map.on('dataLoaded', updateLocationNames);

    // Handle year selection changes
    yearSelector.addEventListener('change', function () {
        const selectedYear = this.value;
        console.log(`Year selected: ${selectedYear}`);
        vismapInstance.fetchData(selectedYear);
    });

    // Listen for feature selection events to populate the info table
    map.on('featureSelected', function(event) {
        const properties = event.properties;
        populateInfoTableCallback(properties);
        visualizeChartsCallback(properties ? properties['PLACEKEY'] : null);
    });

    return locationNamesRef; // Return reference for search initialization
}
