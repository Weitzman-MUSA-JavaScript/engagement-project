
const mapboxglAccessToken = 'pk.eyJ1IjoiamFzbWluZTQwNCIsImEiOiJjbTEybGFoMXExMm93MnFwdjltNTVuYTY5In0.jcDywHe2QQm4DhVU0hPV9A';

let firestoreMarkers = []; // 全局数组，存储 Firestore 标记
let selectedLayer = 'points'; // 定义为全局变量

function removeFirestoreMarkers() {
  firestoreMarkers.forEach(marker => marker.remove()); // 移除所有动态标记
  firestoreMarkers = []; // 清空数组
}

function initializeMap() {
    mapboxgl.accessToken = mapboxglAccessToken;
  
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [146.5, -32.5],
      zoom: 5,
      attributionControl: false, // 禁用默认 attribution
      });
  
    map.addControl(new mapboxgl.NavigationControl());
  
    map.addControl(
      new mapboxgl.AttributionControl({
        customAttribution: '<a href="https://doi.ala.org.au/doi/d05d323e-8f64-4315-8da0-c30ff709713a" target="_blank">Data Source: Atlas of Living Australia</a> | <a href="https://www.flaticon.com/free-icons/koala" title="koala icons">Koala icons created by Freepik - Flaticon</a> <br> <a href="https://www.flaticon.com/free-icons/koala" title="koala icons">Koala icons created by Freepik - Flaticon</a>'

      })
    );
  
    // 在地图加载时添加数据源和图层
    map.on('load', () => {
      map.addSource('koala-records', {
        type: 'geojson',
        data: 'data/koalaRecords.geojson'
      });
  
      // 添加点图层
      map.addLayer({
        id: 'koala-points',
        type: 'circle',
        source: 'koala-records',
        paint: {
          'circle-radius': 5,
          'circle-opacity': 0.5,
          'circle-color': [
            'match',
            ['get', 'stateProvi'],
            'Queensland', '#F4A6A1',
            'New South Wales', '#64B5F6',
            'Victoria', '#81C784',
            'South Australia', '#7986CB',
            'Australian Capital Territory', '#FFEB3B',
            '#AAAAAA',
          ]
        }
      });
  
      // 添加热力图层
      map.addLayer({
        id: 'koala-heatmap',
        type: 'heatmap',
        source: 'koala-records',
        maxzoom: 15,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'individual'], // 使用点的考拉数量
            0, 0,
            100, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            15, 3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.1, 'royalblue',
            0.3, 'cyan',
            0.5, 'lime',
            0.7, 'yellow',
            1, 'red'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            15, 20
          ],
          'heatmap-opacity': 0.6
        }
      });
  
      // 默认显示点图层，隐藏热力图层
      map.setLayoutProperty('koala-heatmap', 'visibility', 'none');
    });
  
    // 下拉菜单切换事件监听器
    const layerSelect = document.getElementById('layer-toggle-select');
    layerSelect.addEventListener('change', () => {
      selectedLayer = layerSelect.value;
    //   console.log('In map.js:', selectedLayer);  // 这里可以访问 selectedLayer
  
      if (selectedLayer === 'points') {
        map.setLayoutProperty('koala-points', 'visibility', 'visible');
        map.setLayoutProperty('koala-heatmap', 'visibility', 'none');
      } else if (selectedLayer === 'heatmap') {
        map.setLayoutProperty('koala-points', 'visibility', 'none');
        map.setLayoutProperty('koala-heatmap', 'visibility', 'visible');
        removeFirestoreMarkers();
      }


    });
  
    return map;
  }
  
  
// add firestore points
  function addPointToMap(map, location, province, year, selectedLayer) {
    const { lat, lon } = location;
  
    // 创建一个新的 div 元素作为 Marker 的内容
    const markerElement = document.createElement('div');
    markerElement.style.width = '10px';
    markerElement.style.height = '10px';
    markerElement.style.backgroundColor = getMarkerColor(province);
    markerElement.style.borderRadius = '50%';
    markerElement.style.opacity = '0.5';
    markerElement.style.cursor = 'pointer';
  
    // 创建标记并添加到地图
    
    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat([lon, lat]);
    if (selectedLayer === "points"){
      marker.addTo(map);
    }
      
  
    // 将年份信息绑定到标记对象上
    marker.year = year;
  
    firestoreMarkers.push(marker); // 存储到全局数组
  }
  
  function getMarkerColor(province) {
    const colors = {
      'Queensland': '#F4A6A1',
      'New South Wales': '#64B5F6',
      'Victoria': '#81C784',
      'South Australia': '#7986CB',
      'Australian Capital Territory': '#FFEB3B',
      'Others': '#AAAAAA'
    };
    return colors[province] || '#AAAAAA';
  }
  
export{mapboxglAccessToken, initializeMap, addPointToMap, removeFirestoreMarkers};