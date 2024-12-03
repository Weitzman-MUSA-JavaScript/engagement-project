// newmap.js

let activeButton = null;  // Track the currently active button

function renderNewMap() {
    // Create the color-palette container
    const colorPalette = document.createElement("div");
    colorPalette.id = "color-palette"; // All styles are now handled in CSS

    const header = document.createElement("h3");
    header.textContent = "Select a category below to add to map";  // Set the header text
    header.style.textAlign = "center";  // Center the header text
    header.style.marginBottom = "10px"; // Space below the header
    header.style.fontSize = "1.1rem"; // Set a font size for the header
    header.style.fontWeight = "bold"; // Make the header text bold

    // Append the header to the color palette
    colorPalette.appendChild(header);

    // Define the zoning categories and their corresponding colors and cursor files
    const zoningMap = {
        "C": { name: "Retail", color: "#215297", cursor: "./assets/images/brush-palette/C.cur" },
        "B": { name: "Office", color: "#0b7fa2", cursor: "./assets/images/brush-palette/B.cur" },
        "W": { name: "Water", color: "#bedef3", cursor: "./assets/images/brush-palette/W.cur" },
        "E": { name: "Education", color: "#f4f2c1", cursor: "./assets/images/brush-palette/E.cur" },
        "H": { name: "Housing", color: "#f6bb81", cursor: "./assets/images/brush-palette/H.cur" },
        "M": { name: "Military", color: "#516702", cursor: "./assets/images/brush-palette/M.cur" },
        "P": { name: "Park", color: "#1ea33a", cursor: "./assets/images/brush-palette/P.cur" },
        "O": { name: "Forest", color: "#abb20c", cursor: "./assets/images/brush-palette/O.cur" },
        "S": { name: "Sports", color: "#a3d49d", cursor: "./assets/images/brush-palette/S.cur" },
        "K": { name: "Hospital", color: "#cc0521", cursor: "./assets/images/brush-palette/K.cur" },
        "L": { name: "Industry", color: "#fe86ba", cursor: "./assets/images/brush-palette/L.cur" },
        "R": { name: "Undecided", color: "#fef66d", cursor: "./assets/images/brush-palette/R.cur" }
    };

    // Add buttons for each zoning category
    Object.keys(zoningMap).forEach(zone => {
        const button = document.createElement("button");
        button.textContent = zoningMap[zone].name;  // Use full name
        button.classList.add("btn", "mb-2"); // Add classes for vertical layout
        button.style.marginBottom = "8px"; // Space between buttons
        button.style.backgroundColor = zoningMap[zone].color; // Set the background color
        button.style.fontWeight = "600"; // Make text semibold
        button.style.width = "100%"; // Make buttons take up the full width of the parent container
        button.style.border = "none"; // Remove button border

        // Set text color for specific zones
        if (zone === "E" || zone === "H" || zone === "S" || zone === "W" || zone === "R") {
            button.style.color = "#000"; // Set text color to black for E, H, S, W
        } else {
            button.style.color = "#fff"; // Default text color is white
        }

        // Add an action for the button to change cursor and update active button color
        button.onclick = function() {
            // If there is an active button, restore its original color
            if (activeButton && activeButton !== button) {
                activeButton.style.backgroundColor = zoningMap[activeButton.dataset.zone].color; // Restore original color
            }

            // Darken the current button
            button.style.backgroundColor = darkenColor(zoningMap[zone].color, 30); // Darken by 20%

            // Set the current button as active
            activeButton = button;
            activeButton.dataset.zone = zone; // Store the zone in a custom data attribute

            // Change the cursor globally
            document.body.style.cursor = `url(${zoningMap[zone].cursor}), auto`; // Change the cursor

            // Override cursor style for Mapbox container
            const mapContainer = document.getElementById('map');
            mapContainer.style.cursor = `url(${zoningMap[zone].cursor}), auto`;

            // Update the cursor for the map on mousemove
            map.on('mousemove', () => {
                map.getCanvas().style.cursor = `url(${zoningMap[zone].cursor}), auto`;
            });

            console.log(`Button for ${zoningMap[zone].name} clicked`);
            console.log(`Active button color: ${zoningMap[zone].color}`);
        };

        // Append the button to the color-palette
        colorPalette.appendChild(button);
    });

    // Append the color-palette to the map container
    const mapContainer = document.getElementById("map");
    mapContainer.appendChild(colorPalette);

    // Console log the property name
    map.on('click', 'A-grid-20241116-3', function(e) {
        // Get the features at the click point
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['A-grid-20241116-3']
        });
    
        if (features.length > 0) {
            // Get the Name of the clicked polygon
            const polygonName = features[0].properties.Name;
    
            // Get the active button's color
            const color = zoningMap[activeButton.dataset.zone].color; // Get the active button's color
    
            // Store the color in localStorage
            localStorage.setItem(`colour${polygonName}`, color);
    
            // Retrieve the newly stored value from localStorage and log it
            const updatedColor = localStorage.getItem(`colour${polygonName}`);
            console.log(`Stored colour${polygonName} as ${updatedColor} in localStorage`);
            
            // Log the Name of the clicked polygon (for verification)
            console.log(`Polygon ${polygonName} clicked`);

            // Refresh map with new colors
            const polygonNames = [
                "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10",
                "A11", "A12", "A13", "A14", "A15", "A16", "A17", "A18", "A19", "A20",
                "A21", "A22", "A23", "A24", "A25", "A26", "A27", "A28", "A29", "A30",
                "A31", "A32", "A33", "A34", "A35", "A36", "A37", "A38", "A39", "A40",
                "A41", "A42", "A43", "A44", "A45", "A46", "A47", "A48", "A49", "A50"
            ];
    
            // Create an array of the colors for all polygons (re-render map)
            const colorArray = polygonNames.map(polygon => {
                return localStorage.getItem(`colour${polygon}`) || "#c300ba"; // Fallback to default color if not found
            });
    
            // Update the layer with the new colors for all polygons
            map.setPaintProperty('A-grid-20241116-3', 'fill-color', [
                "match",
                ["get", "Name"], // get the 'Name' property from GeoJSON
                ...polygonNames.flatMap((polygon, index) => [polygon, colorArray[index]]), // Map polygon names to their colors
                "#c300ba" // default color if no match (fallback)
            ]);
        }
    });
}

function darkenColor(color, percent) {
    let colorHex = color.replace("#", "");
    let r = parseInt(colorHex.substring(0, 2), 16);
    let g = parseInt(colorHex.substring(2, 4), 16);
    let b = parseInt(colorHex.substring(4, 6), 16);

    r = Math.max(0, r - (r * (percent / 100)));
    g = Math.max(0, g - (g * (percent / 100)));
    b = Math.max(0, b - (b * (percent / 100)));

    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

export { renderNewMap, darkenColor }; 

