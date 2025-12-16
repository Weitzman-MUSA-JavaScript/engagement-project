let map3;
let map3Initialized = false;
let enableLabeling = false; // 控制標籤功能的開關

// 地圖上的所有標記實例
const markerInstances = [];

// 渲染單個標記
function renderMarker(marker, id) {
  const mapMarker = L.marker([marker.lat, marker.lng])
    .addTo(map3)
    .bindPopup(
      `<b>${marker.name}</b><br>
       Current Nationality: ${marker.nationality || 'Unknown'}
       <button onclick="deleteMarker('${id}')">Cancel your label</button>`
    );
  markerInstances.push(mapMarker); // 保存到實例列表
}

// 加載所有標記從服務器
function loadMarkersFromServer() {
  fetch('http://localhost:5000/markers') // 替換為您的後端地址
    .then(response => response.json())
    .then(markers => {
      markers.forEach(marker => {
        renderMarker(marker);
      });
    })
    .catch(error => console.error('Error loading markers:', error));
}

// 添加新標記到地圖和服務器
function addMarker(lat, lng, name, nationality) {
  const newMarker = { lat, lng, name, nationality };

  // 發送到服務器
  fetch('http://localhost:5000/markers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newMarker)
  })
    .then(response => response.json())
    .then(marker => {
      renderMarker(marker); // 在地圖上渲染
    })
    .catch(error => console.error('Error saving marker:', error));
}

// 初始化地圖
function initMap3() {
  if (map3Initialized) return; // 防止重複初始化
  map3Initialized = true;

  // 初始化地圖
  map3 = L.map('map3').setView([20, 0], 2); // 世界中心

  // 添加 OpenStreetMap 圖層
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map3);

  // 加載 GeoJSON 圖層
  loadGeoJSON();

  // 加載服務器上的標記
  loadMarkersFromServer();

  // 點擊地圖時的標註功能
  map3.on('click', (e) => {
    if (!enableLabeling) return; // 如果標籤功能未啟動，直接返回

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // 提示用戶輸入姓名
    const userName = prompt("Please insert your name:");
    if (!userName) return;

    // 提示用戶輸入當前國籍
    const nationality = prompt("Please insert your current nationality:");
    if (!nationality) return;

    // 添加標記
    addMarker(lat, lng, userName, nationality);
  });
}

// 加載 GeoJSON 圖層並控制彈窗行為
function loadGeoJSON() {
  const geojsonUrl = 'data_his/1800.geojson'; // 替換為正確的 GeoJSON 文件路徑

  fetch(geojsonUrl)
    .then(response => response.json())
    .then(data => {
      // 如果已有 GeoJSON 圖層，先移除
      if (geojsonLayer) {
        map3.removeLayer(geojsonLayer);
      }

      geojsonLayer = L.geoJSON(data, {
        style: feature => {
          const countryName = feature.properties.NAME || 'Unknown';
          return {
            color: '#000000', // 邊框顏色
            weight: 1, // 邊框粗細
            fillColor: generateColor(feature.properties.NAME), // 使用之前的 generateColor 函數
            fillOpacity: 0.7 // 填充透明度
          };
        },
        onEachFeature: (feature, layer) => {
          // 根據標籤功能狀態決定是否綁定彈窗
          if (!enableLabeling && feature.properties && feature.properties.NAME) {
            layer.bindPopup(`<strong>${feature.properties.NAME}</strong>`);
          }
        }
      }).addTo(map3);
    })
    .catch(error => {
      console.error('無法加載 GeoJSON 數據:', error);
    });
}

// 切換標籤功能
function toggleLabeling() {
  enableLabeling = !enableLabeling;
  const button = document.getElementById('toggle-labeling');
  button.textContent = enableLabeling ? 'Disable Labeling' : 'Enable Labeling';

  // 重新加載 GeoJSON，根據狀態切換彈窗行為
  loadGeoJSON();
}
