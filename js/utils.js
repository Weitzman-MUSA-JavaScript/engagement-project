/**
* Read geojson file
*
* @param {string} filename - The name of the geojson file to load
* @return {object} The FeatureCollection as loaded from the data file
*/
export async function getGeojsonCollection(filename) {
    const resp = await fetch(`data/${filename}`);
    const data = await resp.json();
    return data;
}

/**
* Find all unique values of a specified property in GeoJSON features.
*
* @param {object} geojsonData The GeoJSON object (FeatureCollection).
* @param {string} propertyName The name of the property to check.
* @returns {Array<any>} An array of unique values.
*/
export function getUniquePropertyValues(geojsonData, propertyName) {
    if (!geojsonData || !Array.isArray(geojsonData.features)) {
        throw new Error("Invalid GeoJSON FeatureCollection");
    }
    
    const values = geojsonData.features
    .map(feature => feature.properties?.[propertyName])
    .filter(value => value !== undefined && value !== null);
    
    return [...new Set(values)];
}

/**
* Filter a geoJSON FeatureCollection so that only features with specified property value are included
*
* @param {object} geojsonData - The GeoJSON FeatureCollection
* @param {string} propertyName - The property name to filter on
* @param {any} propertyValue - The property value to match
* @returns {object} - A new GeoJSON FeatureCollection with filtered features
*/
export function filterGeojsonByProperty(geojsonData, propertyName, propertyValue) {
    if (!geojsonData || !Array.isArray(geojsonData.features)) {
        throw new Error("Invalid GeoJSON FeatureCollection");
    }
    
    const filteredFeatures = geojsonData.features.filter(feature => 
        feature.properties?.[propertyName] === propertyValue
    );
    
    const returnData = {
        type: "FeatureCollection",
        features: filteredFeatures
    };
    
    return returnData;
}
