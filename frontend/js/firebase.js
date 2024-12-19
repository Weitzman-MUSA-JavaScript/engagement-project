let map3;
window.map3Initialized = false;
let enableLabeling = false; // 控制標籤功能的開關

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

// 地圖上的所有標記實例
const markerInstances = [];

// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyBlsGpk0gwGTd0qPLKNbB_XJY08-SsK4p0",
    authDomain: "jiatong-62941.firebaseapp.com",
    projectId: "jiatong-62941",
    storageBucket: "jiatong-62941.firebasestorage.app",
    messagingSenderId: "934877011111",
    appId: "1:934877011111:web:4b966debd8c5db6cac4f82",
    measurementId: "G-FEPNS2V1BC"
  };


// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 渲染單個標記
function renderMarker(marker, id) {
  const mapMarker = L.marker([marker.lat, marker.lng])
    .addTo(map3)
    .bindPopup(
      `<b>${marker.name}</b><br>
       Current Nationality: ${marker.nationality || 'Unknown'}
       <button onclick="deleteMarker('${id}')"></button>`

    );
  markerInstances.push(mapMarker); // 保存到實例列表
}

// 從 Firebase 加載所有標記
async function loadMarkersFromFirebase() {
  const pointCollection = collection(db, "label_point");
  const markerRefs = await getDocs (pointCollection);
  markerRefs.forEach((markerRef) => {
    const marker = markerRef.data();
    console.log(markerRef.id);
    console.log(marker);

    renderMarker (marker);
    // if (markers) {
    //   // 清理地圖上的舊標記
    //   markerInstances.forEach(instance => map3.removeLayer(instance));
    //   markerInstances.length = 0;

    //   // 渲染每個標記
    //   Object.values(markers).forEach(marker => {
    //     renderMarker(marker);
    //   });
    // }
  });
}

// 將標記保存到 Firebase
async function saveMarkerToFirebase(lat, lng, name, nationality) {
  const newMarker = { lat, lng, name, nationality };
  const pointCollection = collection(db, "label_point");
  const markerRef = await addDoc(pointCollection, newMarker);
  const marker = markerRef.data();

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

  // 加載 Firebase 上的標記
  loadMarkersFromFirebase();

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

    // 保存標記到 Firebase
    saveMarkerToFirebase(lat, lng, userName, nationality);
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

//export {map3Initialized}
window.initMap3 = initMap3
window.toggleLabeling = toggleLabeling