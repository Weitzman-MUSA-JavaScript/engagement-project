// js/sec_2.js

let map2;
let geojsonLayer;
let map2Initialized = false;

function initMap2() {
  if (map2Initialized) return;
  map2Initialized = true;

  // 只显示一份世界地图，锁定范围
  map2 = L.map('map2', {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    worldCopyJump: false,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0
  });

  const worldBounds = L.latLngBounds([[-85, -180], [85, 180]]);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    noWrap: true,           // 不重复平铺
    bounds: worldBounds
  }).addTo(map2);

  // 年份下拉事件
  const yearSelect = document.getElementById('year-select');
  if (yearSelect) {
    yearSelect.addEventListener('change', () => {
      loadGeoJSONForYear(yearSelect.value);
    });
  }

  // 默认加载 100 年
  loadGeoJSONForYear('100');
}

// 生成稳定颜色（按名称哈希）
function generateColor(name) {
  if (!name) return '#cccccc';
  const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

function loadGeoJSONForYear(year) {
  const geojsonUrl = `data_his/${year}.geojson`;

  // 清理旧图层
  if (geojsonLayer) {
    map2.removeLayer(geojsonLayer);
    geojsonLayer = null;
  }

  fetch(geojsonUrl)
    .then(r => r.json())
    .then(data => {
      geojsonLayer = L.geoJSON(data, {
        style: f => ({
          color: '#000000',
          weight: 1,
          fillColor: generateColor(f.properties?.NAME),
          fillOpacity: 0.7
        }),
        onEachFeature: (feature, layer) => {
          const n = feature.properties?.NAME || 'Unknown';
          layer.bindPopup(`<strong>${n}</strong>`);
        }
      }).addTo(map2);

      // 让视图适配图层（若数据为空则跳过）
      try {
        const b = geojsonLayer.getBounds();
        if (b.isValid()) map2.fitBounds(b, { padding: [10, 10] });
      } catch (e) {
        // ignore
      }
    })
    .catch(err => {
      console.error('無法加載 GeoJSON 數據:', err);
    });
}
