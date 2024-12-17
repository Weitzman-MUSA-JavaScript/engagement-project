import * as d3 from 'https://cdn.skypack.dev/d3';
import { visualizeCharts } from './vischarts.js'; // Ensure this import exists

class Vismap {
    constructor(map, customBreaks, columnName) {
        this.map = map;
        this.currentLayer = null;
        this.legendItems = [];
        this.geojsonLayer = null;
        this.customBreaks = customBreaks;
        this.columnName = columnName;
        this.geojsonData = null;

        // Mapping from normalized LOCATION_NAME to layer
        this.locationNameToLayer = {};

        // Listen for clicks inside the map to reset highlights
        this.map.on('click', (e) => {
            const originalEvent = e.originalEvent;
            if (!originalEvent.target.closest('.leaflet-interactive') && this.currentLayer) {
                console.log('Clicked inside map but outside features.');
                this.resetHighlight();
                visualizeCharts(null); // Clear charts when clicking outside
                this.map.fire('featureSelected', { properties: null });
            }
        });
    }

    fetchData(year) {
        const path = `assets/data/data_${year}.geojson`;
        console.log(`Fetching GeoJSON data from: ${path}`);
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Fetched data for year ${year}`);
                this.geojsonData = data;
                this.processData(data);
                this.visualize(this.columnName);
                this.map.fire('dataLoaded'); // Emit custom event after data is loaded
            })
            .catch(error => {
                console.error(`Error fetching data for year ${year}:`, error);
            });
    }

    processData(data) {
        const column = this.columnName;
        data.features.forEach(feature => {
            const value = feature.properties[column];
            if (value == null) return;
            let categoryIndex = this.customBreaks.length - 1;
            for (let i = 0; i < this.customBreaks.length; i++) {
                if (value <= this.customBreaks[i]) {
                    categoryIndex = i;
                    break;
                }
            }
            feature.properties.category = categoryIndex;
        });
    }

    generateViridisPalette() {
        return d3.scaleSequential(d3.interpolateViridis);
    }

    resetHighlight() {
        if (this.currentLayer) {
            this.geojsonLayer.resetStyle(this.currentLayer);
            console.log('Resetting highlight for:', this.currentLayer.feature.properties['Name']);
            this.currentLayer = null; 
        }
    
        this.legendItems.forEach(item => item.classList.remove('highlight'));
    }
    
    highlightFeature(layer, value) {
        layer.setStyle({
            fillColor: 'red', // Set fill color to red
            color: 'red',      // Set stroke color to red
            weight: 3
        });

        const index = this.findLegendIndex(value);
        if (index !== -1 && this.legendItems[index]) {
            this.legendItems[index].classList.add('highlight');
        }

        // Bring the layer to front to ensure it's above other layers
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }

    findLegendIndex(value) {
        for (let i = 0; i < this.customBreaks.length; i++) {
            if (value <= this.customBreaks[i]) {
                return i;
            }
        }
        return this.customBreaks.length - 1;
    }

    onEachFeature(feature, layer, colname) {
        layer.on('click', () => {
            console.log('Feature clicked:', feature.properties);
            if (this.currentLayer !== layer) {
                this.resetHighlight();
            }

            const value = feature.properties[colname];
            if (value == null) {
                console.log('Value is null. Clearing charts.');
                visualizeCharts(null); // Clear charts if value is null
                this.map.fire('featureSelected', { properties: null });
                return;
            }

            this.highlightFeature(layer, value);
            this.currentLayer = layer;

            const placeKey = feature.properties['PLACEKEY']; // Ensure this matches your data
            console.log(`PLACE_KEY for clicked feature: ${placeKey}`);
            visualizeCharts(placeKey); // Generate charts for the selected place

            const locationName = feature.properties['Name'];
            if (locationName) {
                const normalizedName = this.normalizeLocationName(locationName);
                this.locationNameToLayer[normalizedName] = layer;
            }

            // Emit a custom event with the feature's properties
            this.map.fire('featureSelected', { properties: feature.properties });
        });

        // Populate the mapping from normalized LOCATION_NAME to layer
        const locationName = feature.properties['Name'];
        if (locationName) {
            const normalizedName = this.normalizeLocationName(locationName);
            this.locationNameToLayer[normalizedName] = layer;
        }
    }

    generateLegend(colname) {
        const existingLegend = document.querySelector('.legend-box');
        if (existingLegend) existingLegend.remove();

        const legend = L.DomUtil.create('div', 'legend-box');
        const colorScale = this.generateViridisPalette();

        this.legendItems = [];

        const title = document.createElement('div');
        title.className = 'legend-title';
        title.innerHTML = `${colname}`;
        legend.appendChild(title);

        for (let i = 0; i < this.customBreaks.length; i++) {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';

            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            const normalizedValue = i / (this.customBreaks.length - 1);
            colorBox.style.backgroundColor = colorScale(normalizedValue);

            let label;
            if (i === 0) {
                label = `≤ ${'$' + this.customBreaks[i]}`;
            } else if (i < this.customBreaks.length - 1) {
                label = `${'$' + this.customBreaks[i - 1]} - ${'$' + this.customBreaks[i]}`;
            } else {
                label = `> ${'$' + this.customBreaks[i - 1]}`;
            }

            legendItem.appendChild(colorBox);
            legendItem.appendChild(document.createTextNode(label));
            legend.appendChild(legendItem);

            this.legendItems.push(legendItem);
        }

        this.map.getContainer().appendChild(legend);
    }

    getFeatureStyle(feature) {
        const colname = this.columnName;
        const value = feature.properties[colname];

        const colorScale = this.generateViridisPalette();
        let color = '#ccc';
        if (value != null) {
            const index = this.findLegendIndex(value);
            const normalizedValue = index / (this.customBreaks.length - 1);
            color = colorScale(normalizedValue);
        }

        return {
            radius: 5,
            fillColor: color,
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        };
    }

    visualize(colname) {
        if (this.geojsonLayer) {
            this.map.removeLayer(this.geojsonLayer);
        }

        this.geojsonLayer = L.geoJson(this.geojsonData, {
            pointToLayer: (feature, latlng) => L.circleMarker(latlng, this.getFeatureStyle(feature)),
            onEachFeature: (feature, layer) => this.onEachFeature(feature, layer, colname)
        }).addTo(this.map);

        this.generateLegend(colname);
    }

    // Method to get all LOCATION_NAMEs
    getLocationNames() {
        return Object.keys(this.locationNameToLayer);
    }

    // Method to find a layer by LOCATION_NAME (case-insensitive and trimmed)
    findLayerByLocationName(locationName) {
        console.log(`Finding layer for Name: "${locationName}"`);
        const normalizedName = this.normalizeLocationName(locationName);
        const layer = this.locationNameToLayer[normalizedName];
        if (layer) {
            console.log(`Layer found for "${locationName}":`, layer);
            return layer;
        }
        console.warn(`No layer found for Name: "${locationName}"`);
        return null;
    }

    // Helper method to normalize LOCATION_NAME (trim and lowercase)
    normalizeLocationName(name) {
        return name.trim().toLowerCase();
    }

    highlightByLocationName(locationName) {
        const layer = this.findLayerByLocationName(locationName);
        if (layer) {
            console.log(`Highlighting layer for "${locationName}"`);
            layer.fire('click'); // Simulate a click to trigger existing handlers
        } else {
            console.warn(`Cannot highlight. Layer for "${locationName}" not found.`);
        }
    }
}

export { Vismap };
