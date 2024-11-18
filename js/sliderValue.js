const levelToYear = {
  526: 'High water mark from flood on 07-11-2023.',
  525: 'High water mark from 1992 ice jam flood.',
  522: 'High water mark from flood on 05-27-2011. Center line of State Street in front of federal building/post office will be flooded.',
  521: 'High water mark from flood on 08-29-2011.',
  520: 'High water mark from flood on 01-13-2018. Street flooding in Montpelier. Low spot in federal building parking lot will be flooded.',
  519: 'High water mark from flood on 12-18-2023, 07-11-2024.',
  515: 'Cellar flooding begins. Equivalent of 7.5 ft mark on Langdon Street bridge.',
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

  const yearInfo = levelToYear[level] ? `${levelToYear[level]}` : 'Unknown.';
  document.getElementById('corresponding-year').textContent = yearInfo;

  updateStatistics(parcelLayers, level);
}

export { updateSliderValue };
