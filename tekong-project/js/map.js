// map.js

const defaultColors = {
    A1: '#f4f2ec',
    A2: '#f4f2ec',
    A3: '#f4f2ec',
    A4: '#f4f2ec',
    A5: '#f4f2ec',
    A6: '#f4f2ec',
    A7: '#f4f2ec',
    A8: '#f4f2ec',
    A9: '#f4f2ec',
    A10: '#f4f2ec',
    A11: '#f4f2ec',
    A12: '#f4f2ec',
    A13: '#f4f2ec',
    A14: '#f4f2ec',
    A15: '#f4f2ec',
    A16: '#f4f2ec',
    A17: '#f4f2ec',
    A18: '#f4f2ec',
    A19: '#f4f2ec',
    A20: '#f4f2ec',
    A21: '#f4f2ec',
    A22: '#f4f2ec',
    A23: '#f4f2ec',
    A24: '#f4f2ec',
    A25: '#f4f2ec',
    A26: '#f4f2ec',
    A27: '#f4f2ec',
    A28: '#f4f2ec',
    A29: '#f4f2ec',
    A30: '#f4f2ec',
    A31: '#f4f2ec',
    A32: '#f4f2ec',
    A33: '#f4f2ec',
    A34: '#f4f2ec',
    A35: '#f4f2ec',
    A36: '#f4f2ec',
    A37: '#f4f2ec',
    A38: '#f4f2ec',
    A39: '#f4f2ec',
    A40: '#f4f2ec',
    A41: '#f4f2ec',
    A42: '#f4f2ec',
    A43: '#f4f2ec',
    A44: '#bedef3',
    A45: '#516702',
    A46: '#516702',
    A47: '#516702',
    A48: '#516702',
    A49: '#516702',
    A50: '#abb20c'
};

// Initialize localStorage with default colors if not already set
for (const polygonName in defaultColors) {
    if (!localStorage.getItem(`colour${polygonName}`)) {
        localStorage.setItem(`colour${polygonName}`, defaultColors[polygonName]);
    }
}

mapboxgl.accessToken = 'pk.eyJ1IjoiYnlyb25ubiIsImEiOiJjbTB2NG9qajYxOTE1Mmtwd3Q1aDd5cjM2In0.K6SRujI45VvXnG1vfcwbwA';

var map = new mapboxgl.Map({
    container: 'map', // ID of the div where the map will be placed
    style: 'mapbox://styles/byronnn/cm15ugzyg00dg01pc3ucid3od', // Mapbox style
    center: [104.029311, 1.388], // Initial position [lng, lat]
    zoom: 12
});

// Add navigation control (zoom buttons)
var nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-right');

map.on('load', function() {

    // 1. A-roads-all.geojson (fill)
    map.addLayer({
        id: "A-roads-all",
        type: "fill",
        source: {
            type: "geojson",
            data: "assets/grids/Grid-A/A-roads-all.geojson"
        },
        paint: {
            "fill-color": "#ffffff",
            "fill-opacity": 1,
        }
    });

    // Retrieve colors from localStorage or set to default if not available
    const getStoredColor = (polygonName) => {
        return localStorage.getItem(`colour${polygonName}`) || '#f4f2ec'; // Default color if not found
    };

    // 2. A-grid-20241116-3 (fill)
    map.addLayer({
        id: "A-grid-20241116-3",
        type: "fill",
        source: {
            type: "geojson",
            data: "assets/grids/Grid-A/A-grid-20241120-2.geojson"
        },
        paint: {
            "fill-color": [
                "match",
                ["get", "Name"], // get the 'Name' property from GeoJSON
                "A1", getStoredColor("A1"),  // if 'Name' is 'A1', use stored color
                "A2", getStoredColor("A2"),  // if 'Name' is 'A2', use stored color
                "A3", getStoredColor("A3"),  // if 'Name' is 'A3', use stored color
                "A4", getStoredColor("A4"),  // if 'Name' is 'A4', use stored color
                "A5", getStoredColor("A5"),  // if 'Name' is 'A5', use stored color
                "A6", getStoredColor("A6"),  // if 'Name' is 'A6', use stored color
                "A7", getStoredColor("A7"),  // if 'Name' is 'A7', use stored color
                "A8", getStoredColor("A8"),  // if 'Name' is 'A8', use stored color
                "A9", getStoredColor("A9"),  // if 'Name' is 'A9', use stored color
                "A10", getStoredColor("A10"), // if 'Name' is 'A10', use stored color
                "A11", getStoredColor("A11"),
                "A12", getStoredColor("A12"),
                "A13", getStoredColor("A13"),
                "A14", getStoredColor("A14"),
                "A15", getStoredColor("A15"),
                "A16", getStoredColor("A16"),
                "A17", getStoredColor("A17"),
                "A18", getStoredColor("A18"),
                "A19", getStoredColor("A19"),
                "A20", getStoredColor("A20"),
                "A21", getStoredColor("A21"),
                "A22", getStoredColor("A22"),
                "A23", getStoredColor("A23"),
                "A24", getStoredColor("A24"),
                "A25", getStoredColor("A25"),
                "A26", getStoredColor("A26"),
                "A27", getStoredColor("A27"),
                "A28", getStoredColor("A28"),
                "A29", getStoredColor("A29"),
                "A30", getStoredColor("A30"),
                "A31", getStoredColor("A31"),
                "A32", getStoredColor("A32"),
                "A33", getStoredColor("A33"),
                "A34", getStoredColor("A34"),
                "A35", getStoredColor("A35"),
                "A36", getStoredColor("A36"),
                "A37", getStoredColor("A37"),
                "A38", getStoredColor("A38"),
                "A39", getStoredColor("A39"),
                "A40", getStoredColor("A40"),
                "A41", getStoredColor("A41"),
                "A42", getStoredColor("A42"),
                "A43", getStoredColor("A43"),
                "A44", getStoredColor("A44"),
                "A45", getStoredColor("A45"),
                "A46", getStoredColor("A46"),
                "A47", getStoredColor("A47"),
                "A48", getStoredColor("A48"),
                "A49", getStoredColor("A49"),
                "A50", getStoredColor("A50"),
                "#c300ba" // default color if no match (fallback)
            ],
            "fill-opacity": 1,
            "fill-outline-color": "#958858"
        }
    });

    // 3. MRTLines_20241113_future (line)
    map.addLayer({
        id: "MRTLines_20241113_future",
        type: "line",
        source: {
            type: "geojson",
            data: "assets/layers/MRTLines_20241113_future.geojson"
        },
        paint: {
            "line-color": ["get", "colour"],
            "line-width": 3,
            "line-opacity": 1
        }
    });
    
    // 4. CRL_with_extension_20241104 (line)
    map.addLayer({
        id: "CRL_with_extension_20241104",
        type: "line",
        source: {
            type: "geojson",
            data: "assets/layers/CRL_with_extension_20241104.geojson"
        },
        paint: {
            "line-color": "#94c83d",
            "line-width": 3,
            "line-opacity": 1
        }
    });

    // 5. Districts (circle)
    map.addLayer({
        id: "tekong_districts",
        type: "symbol",
        source: {
            type: "geojson",
            data: "assets/layers/tekong-districts-20241125-1.geojson"
        },
        minzoom: 13, // Only show at zoom level 13 and above
        layout: {
            "text-field": ["get", "District"], // Display the name of the district
            "text-font": ["Barlow Bold"], 
            "text-size": 16,
            "text-offset": [0, 0],
            "text-anchor": "top", // Anchor the text to the top of the symbol
        },
        paint: {
            "text-color": "#000000", // Text color
            "text-halo-color": "#ffffff", // White halo around text for readability
            "text-halo-width": 2, // Halo width for better contrast
            "text-opacity": 1,
        }
    });

    // 6. Raster
    map.addLayer({
        'id': 'raster-layer',
        'type': 'raster',
        'source': {
            'type': 'raster',
            'url': 'mapbox://byronnn.ci8ag6jx', // Replace with your Mapbox tileset URL
            'tileSize': 256
        },
        'paint': {
            'raster-opacity': 0
        }
    });

});

// Reset button functionality
document.getElementById('reset-button').addEventListener('click', function() {
    map.flyTo({
        center: [104.029311, 1.388],
        zoom: 12,
        bearing: 0,
        essential: true
    });
});

// // Access the Mapbox map container
// const mapContainer = document.getElementById('map');

// // Set the custom cursor style for the Mapbox container
// mapContainer.style.cursor = "url('../assets/images/cursor_brush.cur'), default";

// // Optional: Prevent Mapbox from changing the cursor on specific events
// map.on('mousemove', () => {
//     map.getCanvas().style.cursor = "url('../assets/images/cursor_brush.cur'), default";
// });

