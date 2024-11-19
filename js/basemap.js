import { displayParcelInfo } from './parcelInfo.js';

function initMap(el, shadow, buildings, landuse, parcelLayers) {
  // set up the map
  const map = L.map(el, {scrollWheelZoom: true}).setView([44.26053976443341, -72.583011566153], 14);
  const mapboxStyle = 'mapbox/light-v11';
  const mapboxKey = 'pk.eyJ1IjoiZW16aG91IiwiYSI6ImNtMG9henVrdjA2bGwya3EwNWh6OGh1emgifQ.d2Xo2TLSYAGCMqvccySJSA';

  const baseTileLayer = L.tileLayer(
    `https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/{z}/{x}/{y}{r}?access_token=${mapboxKey}`,
    {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.mapbox.com/" target="_blank">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      tileSize: 512,
      zoomOffset: -1,
    },
  );
  baseTileLayer.addTo(map);

  // add landuse
  L.geoJSON(landuse, {
    style: {
      color: '#deeada',
      fillColor: 'white',
      weight: 1.,
      fillOpacity: 0.3,
    },
    onEachFeature: function(feature, layer) {
      layer.options.interactive = true;
      layer.on('click', function() {
        displayParcelInfo(parcelLayers, feature);
      });
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
          color: '#b6ceae',
          weight: 2.5,
          fillOpacity: 0,
        });
      });
      layer.on('mouseout', function() {
        layer.setStyle({
          color: '#deeada',
          weight: 1.4,
          fillOpacity: 0.3,
        });
        layer.closeTooltip();
      });
      layer.on('click', function() {
        layer.getElement().style.outline = 'none';
      });
    },
  }).addTo(map);


  // add building footprints
  L.geoJSON(shadow, {
    style: {
      color: 'black',
      fillColor: '#6f6f6f',
      weight: 0,
      fillOpacity: 0.8,
    },
  }).addTo(map);

  L.geoJSON(buildings, {
    style: {
      color: 'white',
      fillColor: '#d3d1d2',
      weight: 0,
      fillOpacity: 1,
      lineJoin: 'round',
    },
  }).addTo(map);


  return map;
}


export { initMap };

