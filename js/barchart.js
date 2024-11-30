const barInstances = {};

function initBar(barEl, positionMedians, statNames, playerStats, playerPercentiles) {
  const statCategories = {
    speed: ['10Y Sprint', 'Flying 10'],
    agility: ['Pro Agility', 'L Drill', '60Y Shuttle'],
    power: ['Vertical Jump', 'Broad Jump', 'Hang Clean', 'Power Clean'],
    strength: ['Squat', 'Bench', '225lb Bench'],
    anthro: ['Weight', 'Height', 'Wingspan'],
  };

  const category = barEl.id.replace('-chart', '').toLowerCase();
  const metrics = statCategories[category];
  const filteredStatNames = [];
  const filteredPositionMedians = [];
  const filteredPlayerStats = [];
  const filteredPlayerPercentiles = [];

  statNames.forEach((statName, index) => {
    if (metrics.includes(statName)) {
      filteredStatNames.push(statName);
      filteredPositionMedians.push(positionMedians[index]);
      filteredPlayerStats.push(playerStats[index]);
      filteredPlayerPercentiles.push(playerPercentiles[index]);
    }
  });

  const columns = [
    ['x', ...filteredStatNames],
    ['Percentile', ...filteredPlayerPercentiles],
  ];

  if (barInstances[barEl.id]) {
    barInstances[barEl.id].destroy();
  }

  const colors = getColor(filteredPlayerPercentiles);

  // eslint-disable-next-line no-undef
  barInstances[barEl.id] = bb.generate({
    title: {
      text: category.charAt(0).toUpperCase() + category.slice(1),
    },
    data: {
      x: 'x',
      columns: columns,
      labels: true,
      type: 'bar',
      color: function (color, d) {
        if (d && d.index !== undefined) {
          return colors[d.index];
        }
        return color;
      },
    },
    bar: {
      padding: 1,
      radius: {
        ratio: 0.2,
      },
      width: {
        max: 60,
      },
    },
    axis: {
      rotated: false,
      x: {
        show: true,
        type: 'category',
        categories: filteredStatNames,
      },
      y: {
        show: false,
        max: 110,
        padding: {
          top: 0,
          bottom: 0,
        },
      },
    },
    legend: {
      show: false,
    },
    tooltip: {
      show: true,
      contents: function(data) {
        const d = data[0];
        const statIndex = d.index;
        const statName = filteredStatNames[statIndex];
        const median = filteredPositionMedians[statIndex] || 'N/A';
        const value = filteredPlayerStats[statIndex] || 'N/A';
        const percentile = d.value;
        return `
          <div class="bb-tooltip">
            <div class="tooltip-title">${statName}</div>
            <div class="tooltip-row">
              <span class="tooltip-label">Percentile: </span>
              <span class="tooltip-value">${percentile}%</span>
            </div>
            <div class="tooltip-row">
              <span class="tooltip-label">Median: </span>
              <span class="tooltip-value">${median}</span>
            </div>
            <div class="tooltip-row">
              <span class="tooltip-label">Value: </span>
              <span class="tooltip-value">${value}</span>
            </div>
          </div>
        `;
      },
    },

    bindto: barEl,
  });

  function getColor(percentiles) {
    return percentiles.map((percentile) => {
      if (percentile >= 80) {
        return 'rgba(0, 139, 139, 0.7)';
      } else if (percentile >= 60) {
        return 'rgba(255, 215, 0, 0.7)';
      } else if (percentile >= 40) {
        return 'rgba(250, 128, 114, 0.7)';
      } else {
        return 'rgba(211, 211, 211, 0.7)';
      }
    });
  }
}

export { initBar };
