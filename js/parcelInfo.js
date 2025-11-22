function displayParcelInfo(parcelLayers, feature) {
  const properties = feature.properties;

  function formatToMillions(value) {
    if (!value || value === 0) {
      return '$0M';
    }
    return `$${(value / 1000000).toFixed(2)}M`;
  }

  const tableHTML = `
        <table style="
            width: 100%; 
            border-collapse: collapse; 
            font-size: 0.9em; 
            font-family: Lato, serif; 
            margin-top: 10px;
            border: 1px solid #ddd;
            border-radius: 6px; /* Rounded corners for the table */
            overflow: hidden; /* Ensures the corners are properly clipped */
        ">
            <thead style="background-color: #f4f4f4; border-bottom: 2px solid #ddd;">
                <tr>
                    <th style="text-align: left; padding: 10px; border-right: 1px solid #ddd;">Attribute</th>
                    <th style="text-align: left; padding: 10px;">Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Owner</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${properties.OWNER1 || 'Unknown'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Description</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${properties.DESCPROP || 'No description available'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Land Use Category</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${properties.CAT || 'Unknown Land Use Type'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Address</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${properties.E911ADDR || 'No address available'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Listed Value</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatToMillions(properties.REAL_FLV)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Homestead Listed Value</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatToMillions(properties.HSTED_FLV)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Nonresidential Listed Value</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatToMillions(properties.NRES_FLV)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Land Listed Value</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatToMillions(properties.LAND_LV)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Improvement Value</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatToMillions(properties.IMPRV_LV)}</td>
                </tr>
                <!-- Last row with blue background -->
                <tr style="background-color: #1e7d8b; color: white;">
                    <td style="padding: 8px;">Will Be Inundated at Water Level</td>
                    <td style="padding: 8px;">${getInundationLevels(parcelLayers, properties)}</td>
                </tr>
            </tbody>
        </table>
    `;

  document.getElementById('parcel-info-table').innerHTML = tableHTML;
}


function getInundationLevels(parcelLayers, properties) {
  const inundationLevels = [];

  for (let level = 515; level <= 526; level++) {
    if (parcelLayers[level]) {
      const parcelFeature = parcelLayers[level].find((feature) => feature.properties.PARCID === properties.PARCID);
      if (parcelFeature) {
        inundationLevels.push(level);
      }
    }
  }

  if (inundationLevels.length > 0) {
    return `${Math.min(...inundationLevels)} ft`;
  } else {
    return 'Not inundated at any recorded level.';
  }
}

export {displayParcelInfo};
