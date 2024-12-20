import * as turf from "https://cdn.jsdelivr.net/npm/@turf/turf@7.1.0/+esm";

async function loadRampData() {
  // Load the neighborhood data...
  const hoodsResponse = await fetch("data/philadelphia-neighborhoods.json");
  const hoodsCollection = await hoodsResponse.json();
  const hoods = hoodsCollection.features;

  const rampsResponse = await fetch("data/ramps.json");
  const rampsCollection = await rampsResponse.json();
  const ramps_phl = rampsCollection.features;

  const missingRamps = ramps_phl.filter(
    (ramp) => ramp.properties.status === "MISSING"
  );

  // Update the neighborhoods with station counts and densities...
  for (const hood of hoods) {
    function rampInHood(ramp) {
      return turf.booleanPointInPolygon(ramp, hood);
    }
    const hoodRamps = missingRamps.filter(rampInHood);
    for (const ramp of hoodRamps) {
      ramp.properties.neighborhoodName = hood.properties['NAME'];
    }

    // Shape_Area is in square feet
    const areaSqKm = hood.properties["Shape_Area"] / 3280.84 / 3280.84;
    const rampCount = hoodStations.length;
    const rampDensity = rampCount / areaSqKm;

    Object.assign(hood.properties, { areaSqKm, rampCount, rampDensity });
  }

  return { hoods, ramps: missingRamps };
}

export { loadRam