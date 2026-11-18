const properties = ['sessionId', 'version', 'kind', 'topic', 'placeLabel', 'description', 'context', 'locationStatus', 'locationSource', 'precision', 'createdAt', 'updatedAt', 'createdPhase', 'revisionPhase', 'reviewEnteredAt', 'fixture'];

export function exportGeoJSON(contributions) {
  return {
    type: 'FeatureCollection',
    name: 'Community safety practice contributions',
    demo: true,
    exportedAt: new Date().toISOString(),
    limitations: 'Fictional examples and practice input, not representative community findings. All available sessions are included, regardless of view filters. Descriptions without a confirmed point have null geometry. Answers, response comments, and participant credentials are omitted.',
    features: contributions.map((pin) => ({
      type: 'Feature',
      id: pin.id,
      geometry: pin.geometry ? { type: 'Point', coordinates: [...pin.geometry.coordinates] } : null,
      properties: { ...Object.fromEntries(properties.filter((key) => Object.hasOwn(pin, key)).map((key) => [key, pin[key]])), demo: true },
    })),
  };
}
