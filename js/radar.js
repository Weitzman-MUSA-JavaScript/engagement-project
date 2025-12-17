const radarInstances = {};

function initRadar(radarEl, categoryPercentiles) {
  console.log('Category Percentiles', categoryPercentiles);

  let columns;

  if (categoryPercentiles.length < 4) {
    columns = [
      ['x', '💨SPEED', '🐆AGILITY', '⚡POWER', '💪STRENGTH'],
      ['Position Median', 50, 50, 50, 50],
    ];
  } else {
    columns = [
      ['x', '💨SPEED', '🐆AGILITY', '⚡POWER', '💪STRENGTH'],
      ['Position Median', 50, 50, 50, 50],
      ['Athlete', ...categoryPercentiles],
    ];
  }

  if (radarInstances[radarEl.id]) {
    radarInstances[radarEl.id].destroy();
  }

  radarInstances[radarEl.id] = bb.generate({
    data: {
      x: 'x',
      columns: columns,
      type: 'radar',
      labels: true,
      colors: {
        'Position Median': 'gray',
        'Athlete': 'darkcyan',
      },
    },
    radar: {
      axis: {
        max: 100,
      },
      level: {
        depth: 1,
      },
    },
    bindto: '#radar-chart',
  });
}

export { initRadar };
