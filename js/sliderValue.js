const levelToYear = {
  526: 'High water mark from flood on 07-11-2023.',
  525: 'High water mark from 1992 ice jam flood.',
  522: 'High water mark from flood on 05-27-2011.',
  521: 'High water mark from flood on 08-29-2011.',
  520: 'High water mark from flood on 01-13-2018.',
  519: 'High water mark from flood on 07-11-2024.',
  515: 'Cellar flooding begins, 7.5 ft.',
};

function updateStatistics(parcelLayers, level) {
  if (parcelLayers[level]) {
    const inundatedFeatures = parcelLayers[level];
    const inundatedCount = inundatedFeatures.length;
    const totalValue = inundatedFeatures.reduce((acc, feature) => acc + feature.properties.REAL_FLV, 0);

    document.getElementById('inundated-parcels').textContent = `${inundatedCount}`;
    document.getElementById('total-value').textContent = `$${(totalValue / 1000000).toFixed(2)}M`;
  } else {
    document.getElementById('inundated-parcels').textContent = '0';
    document.getElementById('total-value').textContent = '$0';
  }
}

function updateSliderValue(parcelLayers, level) {
  document.getElementById('current-level').textContent = level;
  document.getElementById('current-level2').textContent = level;


  const yearInfo = levelToYear[level] ? `${levelToYear[level]}` : 'Unknown.';
  document.getElementById('corresponding-year').textContent = yearInfo;
  document.getElementById('corresponding-year2').textContent = yearInfo;


  updateStatistics(parcelLayers, level);
}

export { updateSliderValue };
