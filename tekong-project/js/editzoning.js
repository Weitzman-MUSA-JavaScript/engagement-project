// editzoning.js
// For coloring the zoning map based on the selected zoning category

function enableZoningEdit(map, activeButton, zoningMap) {
    if (!activeButton) {
        console.error("No active button selected for zoning edits.");
        return;
    }

    map.on('click', 'A-grid-20241116-3', (e) => {
        // Get the clicked feature
        let clickedFeature = e.features[0];
        console.log(clickedFeature);

        if (clickedFeature && clickedFeature.properties && clickedFeature.properties.Name) {
            const featureName = clickedFeature.properties.Name;
            const selectedZone = activeButton.dataset.zone;

            if (!selectedZone) {
                console.error("Active button does not have a zoning category.");
                return;
            }

            clickedFeature.properties.Zoning = selectedZone;

            console.log(`Updated Zoning of ${featureName} to ${selectedZone}`);

            // Update the map to reflect the change
            map.setFeatureState(
                { source: 'A-grid-20241116-3', id: clickedFeature.id },
                { Zoning: selectedZone }
            );
        }
    });
}

export { enableZoningEdit };