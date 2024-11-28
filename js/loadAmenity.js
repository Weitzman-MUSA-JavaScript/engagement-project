

async function loadAmenity(level) {
  // Construct dynamic file paths using the 'level' parameter
  const amenityPath = `data/amenity/IP_${level}.csv`;

  try {
    // Use d3.csv to fetch and parse the CSV file
    const amenities = await d3.csv(amenityPath);

    // Process or return the parsed data
    return amenities;
  } catch (error) {
    console.error('Error loading amenity data:', error);
    return [];
  }
}

export { loadAmenity };
