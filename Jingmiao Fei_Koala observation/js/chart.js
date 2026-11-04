function initializeChart() {
    const ctx = document.getElementById('bar-chart').getContext('2d');
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Koala Number by State',
          data: [],
          backgroundColor: 'rgba(135, 206, 250, 0.5)',
          borderColor: 'rgba(135, 206, 250, 1)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false, 
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 100 } },
          y: { beginAtZero: true }
        }
      }
    });
  }
  
  function updateChart(chart, data) {
    chart.data.labels = data.map(item => item.state);
    chart.data.datasets[0].data = data.map(item => item.individual);
    chart.update();
  }

  function updateBarChart(chart) {
    // 此函数可以重新加载条形图的数据
    fetch('data/koalaRecords.geojson')
      .then(response => response.json())
      .then(data => {
        const chartData = processChartData(data, currentYear);
        updateChart(chart, chartData); 
      });
  }
  
  
  export{initializeChart, updateChart, updateBarChart};