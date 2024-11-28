import { getFloodReports } from './firebase.js';

async function loadReports() {
  const newReports = await getFloodReports();
  const reports = [];
  let totalDamageValue = 0; // To sum total property loss
  let totalDamagedHouses = 0; // To count damaged houses
  let severelyDamagedHouses = 0; // To count severely damaged houses
  let reportsNoInsurance = 0; // To count reports with insurance
  let residentialCount = 0; // To count residential properties
  let commercialCount = 0; // To count commercial properties
  let industrialCount = 0; // To count industrial properties

  newReports.forEach((doc) => {
    const report = doc.data();
    const { Cat, Lat, Lon, Value, Damage, Housing, Insurance } = report;

    if (Damage !== 'No') {
      totalDamagedHouses += 1;
      if (Damage === 'Severe' || Damage === 'Catastrophic') {
        severelyDamagedHouses += 1;
      }
    }
    const damageValue = parseFloat(Value) || 0; // Ensures NaN is converted to 0
    totalDamageValue += damageValue;
    if (Insurance === 'No') {
      reportsNoInsurance += 1;
    }

    // Check the category of the property and increment the appropriate counter
    if (Cat === 'Residential') {
      residentialCount += 1;
    } else if (Cat === 'Commercial') {
      commercialCount += 1;
    } else if (Cat === 'Industrial') {
      industrialCount += 1;
    }

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
    reports.push(newPoint);
  });

  const totalDamageInMillions = (totalDamageValue / 1_000_000).toFixed(2);
  const summaryContainer = document.getElementById('contributions-container');
  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <div style="background-color: #f4f7f9; padding: 20px; font-family: 'Lato', sans-serif; max-width: 800px; margin: auto;">
      
        <h2 style="font-size: 25px; color: #86202d;">Contributed Report Summary</h2>

        <p style="font-size: 1em; color: #333; line-height: 1.6; margin-bottom: 20px;">
          The following table provides a summary of the submitted flood damage reports, including the number of reported damaged houses, the total property loss value, and the breakdown of residential and commercial properties. The data also highlights the number of properties affected by severe flooding and those lacking flood insurance. This information is valuable for understanding the extent of flood damage and the gaps in insurance coverage for affected properties.
          If you just submitted a report, please refresh the page to see the updated summary.
        </p>

        <table style="
            width: 100%; 
            border-collapse: collapse; 
            font-size: 1em; 
            font-family: Lato, serif; 
            margin-top: 10px;
            border: 1px solid #ddd;
            border-radius: 6px; /* Rounded corners for the table */
            overflow: hidden; /* Ensures the corners are properly clipped */
        ">
            <thead style="background-color: #86202d; color: #fff; border-bottom: 2px solid #ddd;">
                <tr>
                    <th style="text-align: left; padding: 10px; border-right: 1px solid #ddd;">Attribute</th>
                    <th style="text-align: left; padding: 10px;">Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Number of submitted reports:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${reports.length}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Number of damaged houses:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${totalDamagedHouses}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Number of severely damaged houses (Severe or Catastrophic):</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${severelyDamagedHouses}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Reported residential properties:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${residentialCount}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Reported industrial properties:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${industrialCount}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Reported commercial properties:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${commercialCount}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total property loss value:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${totalDamageInMillions} million</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Properties reported without flood insurance:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${reportsNoInsurance}</td>
                </tr>
            </tbody>
        </table>
      </div>
    `;
  }

  return reports;
}

export { loadReports };
