let map2;
let geojsonLayer;
let map2Initialized = false;

function initMap2() {
  map2Initialized = true;

  // 初始化地圖
  map2 = L.map('map2').setView([20, 0], 5);
  

  // 添加 OpenStreetMap 圖層
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
    attribution: '© OpenStreetMap'
  }).addTo(map2);

  // 初始化年份選單的事件
  const yearSelect = document.getElementById('year-select');
  yearSelect.addEventListener('change', () => {
    const selectedYear = yearSelect.value;
    loadGeoJSONForYear(selectedYear);
  });

  // 加載默認年份的 GeoJSON（例如 100 年）
  loadGeoJSONForYear('100');
}

// 生成唯一顏色的函數
function generateColor(name) {
  if (!name) return '#cccccc'; // 如果沒有國家名，使用默認顏色
  const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360; // 生成 0-359 的色調
  return `hsl(${hue}, 70%, 60%)`; // 使用 HSL 顏色空間生成顏色
}

function loadGeoJSONForYear(year) {
  const geojsonUrl = `data_his/${year}.geojson`; // 根據年份加載對應的 GeoJSON 文件

  // 如果已有圖層，先移除
  if (geojsonLayer) {
    map2.removeLayer(geojsonLayer);
  }

  // 加載新的 GeoJSON 數據
  fetch(geojsonUrl)
    .then(response => response.json())
    .then(data => {
      geojsonLayer = L.geoJSON(data, {
        style: feature => {
          const countryName = feature.properties.NAME || 'Unknown'; // 確保有名稱可用
          return {
            color: '#000000', // 邊框顏色
            weight: 1, // 邊框粗細
            fillColor: generateColor(feature.properties.NAME), // 每个国家的填充颜色
            fillOpacity: 0.7 // 填充不透明度
          };
        },
        onEachFeature: (feature, layer) => {
          // 添加彈窗顯示屬性信息
          if (feature.properties && feature.properties.NAME) {
            layer.bindPopup(`<strong>${feature.properties.NAME}</strong>`);
          } else {
            layer.bindPopup(`</strong> Unknown`);
        }
        }
      }).addTo(map2);

      // 調整地圖視圖到 GeoJSON 範圍
      map2.fitBounds(geojsonLayer.getBounds());
    })
    .catch(error => {
      console.error('無法加載 GeoJSON 數據:', error);
    });
}
