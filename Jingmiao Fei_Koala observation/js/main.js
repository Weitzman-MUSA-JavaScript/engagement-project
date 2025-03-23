import { initializeMap, addPointToMap, removeFirestoreMarkers } from './map.js';
import { initializeChart, updateChart } from './chart.js';
import { filterPointsByYear, processChartData } from './filter.js';
import { setupReportForm } from './report.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { db } from './firebase-config.js';

// Initialize map and barchart
const map = initializeMap();
const chart = initializeChart();

// Slide bar logic
const yearSlider = document.getElementById('year-slider');
const yearLabel = document.getElementById('year-label');
const years = ['2020', '2021', '2022', '2023', '2024', 'all'];

// Load data from Firestore and process it
function loadDataFromFirestore(map, chart, year) {
    const koalaObservationsRef = collection(db, "koalaObservations");
  
    getDocs(koalaObservationsRef)
      .then((querySnapshot) => {
        const firestoreData = [];
        removeFirestoreMarkers();

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          // 仅在年份匹配时添加标记
        if (year === 'all' || data.year === parseInt(year) ) {
            addPointToMap(map, data.location, data.province, data.year);
          }

          
          firestoreData.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [data.location.lon, data.location.lat],
            },
            properties: {
              year: data.year,
              stateProvi: data.province,
              individual: data.numberOfKoalas,
            },
          }); 
        });
  
        // 加载静态 GeoJSON 数据并合并 Firestore 数据
        fetch('data/koalaRecords.geojson')
          .then(response => response.json())
          .then(staticData => {
            const mergedData = {
              type: 'FeatureCollection',
              features: [
                ...staticData.features,
                ...firestoreData, // 合并 Firestore 数据
              ],
            };
  
            // 更新热力图数据
            const koalaSource = map.getSource('koala-records');
            if (koalaSource) {
              koalaSource.setData(mergedData); // 更新地图数据源
            }
  
            // 更新图表
            const chartData = processChartData(mergedData, year, []); // Firestore 数据已合并
            updateChart(chart, chartData);
          });
      })
      .catch((error) => {
        console.error("Error loading Firestore data: ", error);
      });
  }
  
  
// 在滑动条更新时调用
yearSlider.addEventListener('input', () => {
    const yearIndex = parseInt(yearSlider.value);
    const currentYear = years[yearIndex];
    yearLabel.innerText = `Year: ${currentYear === 'all' ? '2020 ~ 2024' : currentYear}`;
  
    filterPointsByYear(map, currentYear);
    loadDataFromFirestore(map, chart, currentYear);
    

});
  
// Set up user report form
setupReportForm(map, chart, loadDataFromFirestore);

// Load initial data
loadDataFromFirestore(map, chart, 'all', []); // Load all data by default (no filter)
