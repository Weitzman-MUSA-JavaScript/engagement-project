async function waterParcel(level) {
  // Construct dynamic file paths using the 'level' parameter
  const waterPath = `data/water/water_${level}.geojson`;
  const parcelPath = `data/parcel/parcel_${level}.geojson`;

  // Load water data
  const waterResponse = await fetch(waterPath);
  if (!waterResponse.ok) {
    throw new Error(`Failed to load water data from ${waterPath}`);
  }
  const waterCollection = await waterResponse.json();
  const waterFeatures = waterCollection.features;

  // Load parcel data
  const parcelResponse = await fetch(parcelPath);
  if (!parcelResponse.ok) {
    throw new Error(`Failed to load parcel data from ${parcelPath}`);
  }
  const parcelCollection = await parcelResponse.json();
  const parcelFeatures = parcelCollection.features;

  return { waterFeatures, parcelFeatures };
}

export { waterParcel };
