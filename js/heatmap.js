// heatmap.js
let heatLayer = null;

export function initializeHeatmap(map, floodReports) {
  if (heatLayer) {
    map.removeLayer(heatLayer);
    heatLayer = null;
  }

  if (!floodReports || floodReports.length === 0) {
    console.log('No flood reports to display on heatmap');
    return;
  }

  // [lat, lng, intensity]
  const heatData = floodReports.map((r) => [
    r.location.lat,
    r.location.lng,
    getDepthIntensity(r.depth),
  ]);

  heatLayer = L.heatLayer(heatData, {
    radius: 25,
    blur: 15,
    maxZoom: 17,
    max: 1.0,
    gradient: {
      0.0: '#313695',
      0.25: '#4575b4',
      0.5: '#91bfdb',
      0.7: '#fee090',
      0.85: '#fc8d59',
      1.0: '#d73027',
    },
  }).addTo(map);

  heatLayer._canvas.getContext('2d', { willReadFrequently: true });
  console.log('Heatmap initialized with', floodReports.length, 'points');
}

export function toggleHeatmap(map, floodReports, show) {
  if (show) {
    initializeHeatmap(map, floodReports);
  } else {
    if (heatLayer) {
      map.removeLayer(heatLayer);
      heatLayer = null;
    }
  }
}

export function updateHeatmapData(map, floodReports) {
  const heatmapToggle = document.querySelector('.layer-item[data-layer="heatmap"]');
  if (heatmapToggle && heatmapToggle.classList.contains('active')) {
    initializeHeatmap(map, floodReports);
  }
}

function getDepthIntensity(depth) {
  switch (depth) {
  case 'shallow': return 0.3;
  case 'moderate': return 0.5;
  case 'deep': return 0.7;
  case 'severe': return 1.0;
  default: return 0.5;
  }
}
