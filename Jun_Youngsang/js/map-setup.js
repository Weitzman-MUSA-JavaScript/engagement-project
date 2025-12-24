function setupMap() {
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: [-76.29736398778428, 36.94070755], 
    maxBounds: [
      [-76.44, 36.8], 
      [-76.15, 37.07]  
  ],
    maxZoom: 15,
    minZoom: 1,
    zoom: 13,
  });

  // 내비게이션 및 스케일 컨트롤 추가
  const nav = new mapboxgl.NavigationControl();
  map.addControl(nav, 'top-left');
  map.addControl(new mapboxgl.ScaleControl());

  return map;
}

export { setupMap };
