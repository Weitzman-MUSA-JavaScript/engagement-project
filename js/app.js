/* global flatpickr */

import { saveFloodReport, loadFloodReports } from './firestore.js';
import { initializeHeatmap, toggleHeatmap } from './heatmap.js';

// ========================================
// i18n
// ========================================
const i18nDict = {
  zh: {
    'title-main': '杭州内涝上报系统',
    'title-sub': 'Inundation Reporting',
    'stat-total': '上报总数 / Reports',
    'stat-today': '今日 / Today',
    'layer-title': '图层 / Layers',
    'layer-roads': '道路 Roads',
    'layer-water': '水体 Water',
    'layer-parks': '绿地 Parks',
    'layer-amenities': '设施 Amenities',
    'layer-metro': '地铁站 Metro',
    'layer-floods': '内涝点 Flood Reports',
    'layer-heatmap': '热力图 Heatmap',
    'filter-title': '筛选内涝上报 / Filter Reports',
    'filter-date-from': '开始日期 Start Date',
    'filter-date-to': '结束日期 End Date',
    'filter-all': '全部 All',
    'filter-shallow': '浅 <10cm',
    'filter-moderate': '中 10-30cm',
    'filter-deep': '深 30-50cm',
    'filter-severe': '严重 >50cm',
    'panel-title': '上报内涝事件',
    'panel-subtitle': 'Report Inundation Event',
    'mode-report': '上报内涝<br><small>Report Flood</small>',
    'mode-view': '查看记录<br><small>View Reports</small>',
    'form-location-label': '位置 Location (点击地图选择 / Click map)',
    'form-location-placeholder': '请在地图上点击选择位置<br>Click on the map to select location',
    'form-date-label': '日期 <span aria-hidden="true">Date</span>',
    'form-time-label': '时间 <span aria-hidden="true">Time</span>',
    'form-depth-label': '积水深度 Water Depth',
    'depth-shallow': '浅 Shallow',
    'depth-moderate': '中 Moderate',
    'depth-deep': '深 Deep',
    'depth-severe': '严重 Severe',
    'form-situation-label': '情况类型 Situation Type',
    'situation-home': '家附近 Near Home',
    'situation-commute': '通勤路上 Commuting',
    'situation-work': '工作地点 Workplace',
    'situation-other': '其他 Other',
    'form-location-desc-label': '详细位置描述 Location Details',
    'form-location-desc-placeholder': '如：XX路与XX路交叉口 / e.g., Intersection of XX Road and XX Street',
    'form-submit': '提交上报 Submit Report',
    'report-list-title': '历史上报记录 / Report History',
    'instructions-text': '点击地图选择内涝位置 / Click on the map to select flood location',
    'toast-success': '上报成功！Thank you for your report!',
  },
  en: {
    'title-main': 'Hangzhou Inundation Reporting',
    'title-sub': 'Inundation Reporting',
    'stat-total': 'Reports',
    'stat-today': 'Today',
    'layer-title': 'Layers',
    'layer-roads': 'Roads',
    'layer-water': 'Water',
    'layer-parks': 'Parks',
    'layer-amenities': 'Amenities',
    'layer-metro': 'Metro',
    'layer-floods': 'Flood Reports',
    'layer-heatmap': 'Heatmap',
    'filter-title': 'Filter Reports',
    'filter-date-from': 'Start Date',
    'filter-date-to': 'End Date',
    'filter-all': 'All',
    'filter-shallow': 'Shallow <10cm',
    'filter-moderate': 'Moderate 10-30cm',
    'filter-deep': 'Deep 30-50cm',
    'filter-severe': 'Severe >50cm',
    'panel-title': 'Report Inundation Event',
    'panel-subtitle': 'Report Inundation Event',
    'mode-report': 'Report Flood<br><small>Report Flood</small>',
    'mode-view': 'View Reports<br><small>View Reports</small>',
    'form-location-label': 'Location (Click map)',
    'form-location-placeholder': 'Click on the map to select location',
    'form-date-label': 'Date',
    'form-time-label': 'Time',
    'form-depth-label': 'Water Depth',
    'depth-shallow': 'Shallow',
    'depth-moderate': 'Moderate',
    'depth-deep': 'Deep',
    'depth-severe': 'Severe',
    'form-situation-label': 'Situation Type',
    'situation-home': 'Near Home',
    'situation-commute': 'Commuting',
    'situation-work': 'Workplace',
    'situation-other': 'Other',
    'form-location-desc-label': 'Location Details',
    'form-location-desc-placeholder': 'e.g., Intersection of XX Road and XX Street',
    'form-submit': 'Submit Report',
    'report-list-title': 'Report History',
    'instructions-text': 'Click on the map to select flood location',
    'toast-success': 'Thank you for your report!',
  },
};

let currentLang = 'zh';

function setLang(lang) {
  currentLang = lang;
  const dict = i18nDict[lang];
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.tagName.match(/INPUT|TEXTAREA/)? el.value=dict[key]: el.innerHTML=dict[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
  });
  refreshLayerPopups();
}

function refreshLayerPopups() {
  ['floods', 'amenities', 'metro'].forEach((layerKey)=>{
    if (window.layers && window.layers[layerKey]) {
      window.layers[layerKey].eachLayer((marker)=>{
        if (marker.reportData) marker.setPopupContent(createFloodPopup(marker.reportData));
        else if (marker.feature?.properties) {
          if (layerKey==='amenities') marker.bindPopup(createAmenityPopup(marker.feature.properties));
          if (layerKey==='metro') marker.bindPopup(createMetroPopup(marker.feature.properties));
        }
      });
    }
  });
}

// ========================================
// Map & Layers
// ========================================
let map;
const layers = { roads: null, water: null, parks: null, amenities: null, metro: null, floods: null, boundary: null, heatmap: null };
let currentMarker = null;
let floodReports = [];
let formState = { location: null, depth: null, situation: null };

document.addEventListener('DOMContentLoaded', async ()=>{
  // i18n
  document.querySelectorAll('.lang-btn').forEach((btn)=>{
    btn.addEventListener('click', function() {
      document.querySelectorAll('.lang-btn').forEach((b)=>b.classList.remove('active'));
      event.currentTarget.classList.add('active');
      setLang(event.currentTarget.dataset.lang);
    });
  });
  setLang(currentLang);

  // Map & Layers
  initializeMap();
  initializeLayerGroups();
  await loadGeoJSONData();
  initializeEventListeners();
  setDefaultDateTime();
  await reloadReports();
  flatpickrLoad();
  leafletLoad();
  initializeHeatmap(map, floodReports);
});

function initializeMap() {
  map = L.map('map', { center: [30.25, 120.15], zoom: 11, zoomControl: true });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19,
  }).addTo(map);
  map.on('click', handleMapClick);
}

function initializeLayerGroups() {
  Object.keys(layers).forEach((key) => layers[key] = L.layerGroup());
  map.addLayer(layers.boundary);
  map.addLayer(layers.roads);
  map.addLayer(layers.water);
  map.addLayer(layers.parks);
  map.addLayer(layers.floods);
}

async function loadGeoJSONData() {
  const loadLayer = async (url, name, options, targetLayer) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const layer = L.geoJSON(data, options).addTo(targetLayer);
      if (name === 'boundary') map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    } catch (error) {
      console.error(`Failed to load ${name}:`, error);
    }
  };

  await loadLayer('data/HZ_Center.geojson', 'boundary', { style: { color: '#00A5D6', weight: 3, fillColor: '#00A5D6', fillOpacity: 0.05, dashArray: '10,5' } }, layers.boundary);
  await loadLayer('data/roads_simplified.geojson', 'roads', { style: { color: '#4a4a4a', weight: 0.5, opacity: 0.6 } }, layers.roads);
  await loadLayer('data/water.geojson', 'water', { style: { color: '#3498DB', weight: 0, fillColor: '#3498DB', fillOpacity: 0.7 } }, layers.water);
  await loadLayer('data/park.geojson', 'parks', { style: { color: '#27AE60', weight: 0, fillColor: '#27AE60', fillOpacity: 0.7 } }, layers.parks);
  await loadLayer('data/amenity.geojson', 'amenities', {
    pointToLayer: (f, latlng)=>L.circleMarker(latlng, { radius: 2, fillColor: '#E67E22', color: '#E67E22', weight: 1, opacity: 0.8, fillOpacity: 0.6 }),
    onEachFeature: (f, l)=>{
      if (f.properties?.name) l.bindPopup(createAmenityPopup(f.properties));
    },
  }, layers.amenities);
  await loadLayer('data/metrostation.geojson', 'metro', {
    pointToLayer: (f, latlng)=>L.circleMarker(latlng, { radius: 2, fillColor: '#9B59B6', color: '#fff', weight: 1, opacity: 1, fillOpacity: 0.9 }),
    onEachFeature: (f, l)=>{
      if (f.properties?.name) l.bindPopup(createMetroPopup(f.properties));
    },
  }, layers.metro);
}

// ========================================
// Popups & Icons
// ========================================
function createAmenityPopup(props) {
  const addr=currentLang==='en'?'Address:':'地址:';
  return `<div class="popup-content"><div class="popup-header"><div class="popup-icon">🏢</div><div><div class="popup-title">${props.name}</div><div class="popup-subtitle">${props.category||''}</div></div></div>${props.address?`<div class="popup-detail"><span>${addr}</span> ${props.address}</div>`:''}</div>`;
}
function createMetroPopup(props) {
  return `<div class="popup-content"><div class="popup-header"><div class="popup-icon">🚇</div><div><div class="popup-title">${props.name}</div><div class="popup-subtitle">${props.address||''}</div></div></div></div>`;
}
function createFloodPopup(report) {
  const depthLabels=currentLang==='en'?{shallow: 'Shallow <10cm', moderate: 'Moderate 10-30cm', deep: 'Deep 30-50cm', severe: 'Severe >50cm'}:{shallow: '浅 <10cm', moderate: '中 10-30cm', deep: '深 30-50cm', severe: '严重 >50cm'};
  const situationLabels=currentLang==='en'?{home: 'Near Home', commute: 'Commuting', work: 'Workplace', other: 'Other'}:{home: '家附近', commute: '通勤路上', work: '工作地点', other: '其他'};
  const title=currentLang==='en'?'Flood Report':'内涝上报';
  const depthLabel=currentLang==='en'?'Depth:':'深度:';
  const typeLabel=currentLang==='en'?'Type:':'类型:';
  const descLabel=currentLang==='en'?'Description:':'描述:';
  return `<div class="popup-content"><div class="popup-header"><div class="popup-icon">🌊</div><div><div class="popup-title">${title}</div><div class="popup-subtitle">${report.date} ${report.time}</div></div></div><div class="popup-detail"><span>${depthLabel}</span> ${depthLabels[report.depth]}</div><div class="popup-detail"><span>${typeLabel}</span> ${situationLabels[report.situation]}</div>${report.description?`<div class="popup-detail"><span>${descLabel}</span> ${report.description}</div>`:''}</div>`;
}
function createFloodIcon(depth) {
  const colors={shallow: '#85C1E9', moderate: '#3498DB', deep: '#1A5276', severe: '#C0392B'};
  return L.divIcon({className: 'flood-marker', html: `<div style="width:28px;height:28px;background:${colors[depth]};border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">💧</div>`, iconSize: [14, 14], iconAnchor: [7, 7]});
}
function createTempMarkerIcon() {
  return L.divIcon({className: 'temp-marker', html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#E67E22 0%,#C0392B 100%);border:3px solid white;border-radius:50%;box-shadow:0 4px 15px rgba(0,0,0,0.4);animation:pulse 1.5s ease-in-out infinite;"></div>`, iconSize: [32, 32], iconAnchor: [16, 16]});
}

// ========================================
// Event Handlers
// ========================================
function initializeEventListeners() {
  document.querySelectorAll('.depth-option').forEach((o)=>o.addEventListener('click', handleDepthSelect));
  document.querySelectorAll('.situation-chip').forEach((c)=>c.addEventListener('click', handleSituationSelect));
  document.getElementById('eventDate').addEventListener('change', validateForm);
  document.getElementById('eventTime').addEventListener('change', validateForm);
  document.getElementById('reportForm').addEventListener('submit', handleFormSubmit);
  document.querySelectorAll('.layer-item').forEach((item)=>item.addEventListener('click', handleLayerToggle));
  document.querySelectorAll('.mode-btn').forEach((btn)=>btn.addEventListener('click', handleModeToggle));
  document.querySelectorAll('.filter-chip').forEach((chip)=>chip.addEventListener('click', handleFilterChipClick));
  document.getElementById('filterDateFrom').addEventListener('change', filterReports);
  document.getElementById('filterDateTo').addEventListener('change', filterReports);
  document.getElementById('closeInstructions').addEventListener('click', ()=>{
    document.getElementById('instructions').style.display='none';
  });
  document.querySelector('.layer-title')?.addEventListener('click', ()=>document.querySelector('.layer-controls')?.classList.toggle('collapsed'));
  document.querySelector('.filter-title')?.addEventListener('click', ()=>document.querySelector('.filter-panel')?.classList.toggle('collapsed'));
}

function handleMapClick(e) {
  const latlng=e.latlng;
  if (currentMarker) map.removeLayer(currentMarker);
  currentMarker=L.marker(latlng, {icon: createTempMarkerIcon()}).addTo(map);
  formState.location=latlng;
  updateLocationDisplay(latlng);
  document.getElementById('instructions').style.display='none';
  validateForm();
}
function handleDepthSelect() {
  document.querySelectorAll('.depth-option').forEach((o)=>o.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  formState.depth=event.currentTarget.dataset.depth;
  validateForm();
}
function handleSituationSelect() {
  document.querySelectorAll('.situation-chip').forEach((c)=>c.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  formState.situation=event.currentTarget.dataset.situation;
  validateForm();
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const report={
    location: {lat: formState.location.lat, lng: formState.location.lng},
    date: document.getElementById('eventDate').value,
    time: document.getElementById('eventTime').value,
    depth: formState.depth,
    situation: formState.situation,
    description: document.getElementById('locationDesc').value,
    timestamp: new Date().toISOString(),
  };
  await saveFloodReport(report);
  await reloadReports();
  showToast();
  resetForm();
}

function handleLayerToggle() {
  const layerName=event.currentTarget.dataset.layer;
  event.currentTarget.classList.toggle('active');
  if (layerName==='heatmap') {
    toggleHeatmap(map, floodReports, event.currentTarget.classList.contains('active')); return;
  }
  event.currentTarget.classList.contains('active')? map.addLayer(layers[layerName]) : map.removeLayer(layers[layerName]);
}

function handleModeToggle() {
  document.querySelectorAll('.mode-btn').forEach((b)=>b.classList.remove('active'));
  event.currentTarget.classList.add('active');
  const mode=event.currentTarget.dataset.mode;
  document.getElementById('reportForm').style.display=mode==='report'?'block':'none';
  document.getElementById('reportList').style.display=mode==='report'?'none':'block';
}
function handleFilterChipClick() {
  document.querySelectorAll('.filter-chip').forEach((c)=>c.classList.remove('active'));
  event.currentTarget.classList.add('active');
  filterReports();
}

// ========================================
// UI Updates
// ========================================
function updateLocationDisplay(latlng) {
  const loc=document.getElementById('locationDisplay');
  loc.innerHTML=`<div class="location-icon">📍</div><div class="location-coords"><div class="location-coords-label">选择的位置 Selected Location</div><div class="location-coords-value">${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}</div></div>`;
}
function updateStats() {
  document.getElementById('totalReports').textContent=floodReports.length;
  const today=new Date().toISOString().split('T')[0];
  document.getElementById('todayReports').textContent=floodReports.filter((r)=>r.date===today).length;
}
function updateReportList() {
  const container=document.getElementById('reportItems');
  const depthLabels={shallow: '浅', moderate: '中', deep: '深', severe: '严重'};
  container.innerHTML=floodReports.slice().reverse().map((r, i)=>`<div class="report-item" data-id="${i}"><div class="report-header"><div class="report-time">${r.date} ${r.time}</div><div class="report-depth-badge badge-${r.depth}">${depthLabels[r.depth]}</div></div><div class="report-location">${r.description||`${r.location.lat.toFixed(4)}, ${r.location.lng.toFixed(4)}`}</div></div>`).join('');
  container.querySelectorAll('.report-item').forEach((item)=>item.addEventListener('click', function() {
    const report=floodReports[parseInt(event.currentTarget.dataset.id)];
    if (report) map.setView([report.location.lat, report.location.lng], 15);
  }));
}
function showToast() {
  const toast=document.getElementById('toast'); toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 3000);
}
function validateForm() {
  const date=document.getElementById('eventDate').value;
  const time=document.getElementById('eventTime').value;
  document.getElementById('submitBtn').disabled=!(formState.location&&formState.depth&&formState.situation&&date&&time);
}
function setDefaultDateTime() {
  const now=new Date();
  document.getElementById('eventDate').value=now.toISOString().split('T')[0];
  document.getElementById('eventTime').value=now.toTimeString().slice(0, 5);
}
function resetForm() {
  if (currentMarker) {
    map.removeLayer(currentMarker); currentMarker=null;
  }
  formState={location: null, depth: null, situation: null};
  document.getElementById('locationDisplay').innerHTML=`<div class="location-icon">📍</div><div class="location-placeholder">请在地图上点击选择位置<br>Click on the map to select location</div>`;
  document.querySelectorAll('.depth-option').forEach((o)=>o.classList.remove('selected'));
  document.querySelectorAll('.situation-chip').forEach((c)=>c.classList.remove('selected'));
  document.getElementById('locationDesc').value='';
  document.getElementById('submitBtn').disabled=true;
  setDefaultDateTime();
}

// ========================================
// Flood Markers & Filtering
// ========================================
function addFloodMarker(report) {
  const marker=L.marker([report.location.lat, report.location.lng], {icon: createFloodIcon(report.depth)});
  marker.bindPopup(createFloodPopup(report));
  marker.reportData=report;
  marker.addTo(layers.floods);
}

function filterReports() {
  const depthFilter=document.querySelector('.filter-chip.active')?.dataset.depth||'all';
  const dateFrom=document.getElementById('filterDateFrom').value;
  const dateTo=document.getElementById('filterDateTo').value;
  layers.floods.clearLayers();
  const filtered=floodReports.filter((r)=>{
    if (depthFilter!=='all' && r.depth!==depthFilter) return false;
    if (dateFrom && r.date<dateFrom) return false;
    if (dateTo && r.date>dateTo) return false;
    addFloodMarker(r);
    return true;
  });
  const heatmapToggle=document.querySelector('.layer-item[data-layer="heatmap"]');
  if (heatmapToggle?.classList.contains('active')) initializeHeatmap(map, filtered);
}

// ========================================
// Firestore Integration
// ========================================
async function reloadReports() {
  floodReports=await loadFloodReports();
  layers.floods.clearLayers();
  floodReports.forEach(addFloodMarker);
  updateStats();
  updateReportList();
  const heatmapToggle=document.querySelector('.layer-item[data-layer="heatmap"]');
  if (heatmapToggle?.classList.contains('active')) initializeHeatmap(map, floodReports);
}

// ========================================
// Flatpickr & Leaflet Accessibility
// ========================================
function flatpickrLoad() {
  if (window.flatpickr) {
    flatpickr('#eventDate', {dateFormat: 'Y-m-d', ariaDateFormat: 'Y-m-d', allowInput: true, onChange: validateForm});
    flatpickr('#eventTime', {enableTime: true, noCalendar: true, dateFormat: 'H:i', time_24hr: true, ariaDateFormat: 'H:i', allowInput: true, onChange: validateForm});
    flatpickr('#filterDateFrom', {dateFormat: 'Y-m-d', ariaDateFormat: 'Y-m-d', allowInput: true});
    flatpickr('#filterDateTo', {dateFormat: 'Y-m-d', ariaDateFormat: 'Y-m-d', allowInput: true});
  }
}

function leafletLoad() {
  if (window.L) {
    setTimeout(()=>{
      document.querySelector('.leaflet-control-attribution')?.setAttribute('tabindex', '0');
      document.querySelectorAll('.leaflet-control-zoom a').forEach((btn)=>{
        btn.setAttribute('tabindex', '0');
        btn.setAttribute('role', 'button');
        btn.setAttribute('aria-label', btn.title||'Map Zoom Button');
      });
      const mapDiv=document.getElementById('map');
      if (mapDiv) {
        mapDiv.setAttribute('aria-label', 'Map Display Area');
        mapDiv.setAttribute('role', 'region');
        mapDiv.removeAttribute('tabindex');
        mapDiv.setAttribute('aria-hidden', 'true');
      }
      document.querySelectorAll('svg.leaflet-zoom-animated').forEach((svg)=>{
        svg.setAttribute('aria-label', 'Map Graphic Layer');
        svg.setAttribute('role', 'img');
      });
    }, 500);
  }
}
