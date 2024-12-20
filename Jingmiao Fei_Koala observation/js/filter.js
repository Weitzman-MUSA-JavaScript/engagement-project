function filterPointsByYear(map, year) {
    const filter = year === 'all'
      ? ['has', 'year']
      : ['==', ['get', 'year'], parseInt(year)];
    
    // 设置点图层过滤
    map.setFilter('koala-points', filter);
  
    // 设置热力图层过滤
    map.setFilter('koala-heatmap', filter);
  }
  
  
function processChartData(data, year, firestoreData) {
const filteredData = [
    ...data.features.filter(feature => year === 'all' || feature.properties.year === parseInt(year)),
    ...firestoreData.filter(doc => year === 'all' || doc.year === parseInt(year))  // 合并 Firestore 数据
];

const stateCounts = {};

filteredData.forEach(item => {
    const state = item.properties ? item.properties.stateProvi : item.province;  // 从 geojson 或 firestore 中提取
    const individual = item.properties ? item.properties.individual : item.numberOfKoalas;  // 同上

    stateCounts[state] = (stateCounts[state] || 0) + individual;
});

const result = Object.keys(stateCounts)
    .map(state => ({ state, individual: stateCounts[state] }))
    .filter(item => item.individual > 0)
    .sort((a, b) => b.individual - a.individual);

return result;
}
   
  
  
  export{filterPointsByYear, processChartData}