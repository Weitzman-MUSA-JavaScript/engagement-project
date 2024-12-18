
function addLayers(map) {
  // Add Source Layer
  map.addSource('bases', {
    'type': 'geojson',
    'data': './data/layers/updated_geojson_file 2.geojson',
  });

  // Add a new source from our GeoJSON data and
  // set the 'cluster' option to true. GL-JS will
  // add the point_count property to your source data.
  
  const layers = [
    {
      'id': 'base-borders',
      'source': 'bases',
      'type': 'line',
      'paint': {
        'line-color': [
          'match',
          ['get', 'siteReportingComponent'],
          'usaf', 'rgba(0, 240, 240, 0.5)',
          'usa', 'rgba(0, 240, 0, 0.5)',
          'usmc', 'rgba(240, 0, 0, 0.5)',
          'usn', 'rgba(0, 0, 240, 0.5)',
          'rgba(100, 100, 100, 0.5)',
        ],
        'line-width': 4,
      },
    },
    {
      'id': 'base-fills',
      'source': 'bases',
      'type': 'fill',
      'paint': {
        'fill-color': [
          'match',
          ['get', 'siteReportingComponent'],
          'usaf', 'rgba(0, 240, 240, 0.5)',
          'usa', 'rgba(0, 240, 0, 0.5)',
          'usmc', 'rgba(240, 0, 0, 0.5)',
          'usn', 'rgba(0, 0, 240, 0.5)',
          'rgba(100, 100, 100, 0.5)',
        ],
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          1,
          0.5,
        ],
      },
    },
  ];

  // Add All Layers to the Map
  layers.forEach((layer) => {
    map.addLayer(layer);
  });

}
export { addLayers };
