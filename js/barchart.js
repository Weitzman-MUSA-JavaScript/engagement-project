const barInstances = {};

function initBar(barEl, positionMedians, statNames, playerStats, playerPercentiles) {
  const statCategories = {
    anthropometrics: ['Weight', 'Height', 'Wingspan'],
    strength: ['Squat', 'Bench', '225lb Bench'],
    power: ['Vertical Jump', 'Broad Jump', 'Hang Clean', 'Power Clean'],
    speed: ['10Y Sprint', 'Flying 10'],
    agility: ['Pro Agility', 'L Drill', '60Y Shuttle'],
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
      color: function(color, d) {
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
        const unit = getUnit(statName);
        const median = filteredPositionMedians[statIndex] !== undefined
          ? `${Number(filteredPositionMedians[statIndex]).toFixed(1)} ${unit}`
          : 'N/A';
        const value = filteredPlayerStats[statIndex] !== undefined
          ? `${Number(filteredPlayerStats[statIndex]).toFixed(1)} ${unit}`
          : 'N/A';
        const percentile = Number(d.value).toFixed(1);

        return `
          <div class="bb-tooltip">
            <div class="tooltip-title">${statName}</div>
            <div class="tooltip-row">
              <span class="tooltip-label">Percentile:&nbsp;</span>
              <span class="tooltip-value"> ${percentile}%</span>
            </div>
            <div class="tooltip-row">
              <span class="tooltip-label">Median:&nbsp;</span>
              <span class="tooltip-value"> ${median}</span>
            </div>
            <div class="tooltip-row">
              <span class="tooltip-label">Value:&nbsp;</span>
              <span class="tooltip-value"> ${value}</span>
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

  function getUnit(stat) {
    const unitMapping = {
      lbs: ['Bench', 'Squat', 'Power Clean', 'Hang Clean', 'Weight'],
      reps: ['225lb Bench'],
      in: ['Vertical Jump', 'Broad Jump', 'Height', 'Wingspan'],
      s: ['10Y Sprint', '60Y Shuttle', 'L Drill', 'Pro Agility', 'Flying 10'],
    };

    for (const [unit, stats] of Object.entries(unitMapping)) {
      if (stats.includes(stat)) {
        return unit;
      }
    }
    return '';
  }
}

export { initBar };
