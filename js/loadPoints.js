import { getFloodReports} from './firebase.js';

async function loadPoints() {
  const fp = await fetch('data/floodedParcel.geojson');
  const fpCollection = await fp.json();
  const floodedParcel = fpCollection.features;

  const newReports = await getFloodReports();
  newReports.forEach((doc) => {
    const report = doc.data();
    const {Cat, Lat, Lon, Value, Damage, Housing, Insurance} = report;
    const newPoint = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [Lon, Lat],
      },
      properties: {
        Cat,
        Value,
        Damage,
        Housing,
        Insurance,
      },
    };
    floodedParcel.push(newPoint);
  });

  return floodedParcel;
}


export { loadPoints };
