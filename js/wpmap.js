function addWaterParcel(map, waterFeatures, parcelFeatures) {
  L.geoJSON(parcelFeatures, {
    style: {
      color: '#bf826a',
      fillColor: '#bf826a',
      weight: 0,
      fillOpacity: 0.2,
    },
    onEachFeature: function(feature, layer) {
      layer.options.interactive = true;
      layer.on('mouseover', function() {
        const owner = feature.properties.OWNER1 || 'Unknown';
        const landuseType = feature.properties.CAT || 'Unknown Land Use Type';
        const address = feature.properties.E911ADDR || 'No address available';
        const value = feature.properties.REAL_FLV
          ? `$${(feature.properties.REAL_FLV / 1000000).toFixed(2)}M`
          : '$0';
        const tooltipContent = `
            <strong>Owner:</strong> ${owner}<br>
            <strong>Land Use Category:</strong> ${landuseType}<br>
            <strong>Address:</strong> ${address}<br>
            <strong>Total Listed Value:</strong> ${value}`;
        layer.bindTooltip(tooltipContent, {
          sticky: true,
          direction: 'top',
          opacity: 0.8,
        }).openTooltip();
        layer.setStyle({
          color: '#bf826a',
          fillColor: '#bf826a',
          weight: 2.5,
          fillOpacity: 0.2,
        });
      });
      layer.on('mouseout', function() {
        layer.setStyle({
          color: '#bf826a',
          fillColor: '#bf826a',
          weight: 0,
          fillOpacity: 0.2,
        });
        layer.closeTooltip();
      });
      layer.on('click', function() {
        layer.getElement().style.outline = 'none';
      });
    },
  }).addTo(map);

  L.geoJSON(waterFeatures, {
    style: {
      color: '#73B2FF',
      fillColor: '#1e7d8b',
      weight: 0,
      fillOpacity: 0.8,
    },
  }).addTo(map);
}

export {addWaterParcel};
