import * as storage from './storage.js';

/**
* When user selection is made, display the relevant data in the results section
* 
* @param {EventTarget} eventBus - The event bus to listen for the event on
*/
export function displayUserData(eventBus) {
    eventBus.addEventListener('stopData', (event) => {
        const resultElement = document.querySelector('#user-results-contents');
        const resultData = event.detail.data;
        
        // Clear previous results
        resultElement.innerHTML = '';
        
        if (resultData.features.length === 0 | resultData.features.length > 1) {
            resultElement.textContent = `Please make a valid selection using the drop-down menus above.`;
            return;
        }
        
        // Pull out relevant fields from the result
        const resultsFields = resultData.features[0].properties;
        const routeId = resultsFields.route_id;
        const tripHeadsign = resultsFields.trip_headsign;
        const weekPeriod = resultsFields.week_period;
        const timeOfDay = resultsFields.time_of_day;
        const stopName = resultsFields.stop_name;
        const arrivalsBeforeCuts = resultsFields.arrivals_before_cuts;
        const arrivalsDuringCuts = resultsFields.arrivals_during_cuts;
        const arrivalsChange = resultsFields.percent_change;
        const waitTimeDifference = resultsFields.expected_wait_time_difference;
        
        // Some derived calculations for display
        const arrivalsChangePercent = (arrivalsChange >= 0) ? `an increase of ${Math.round(arrivalsChange * 100)}%` : `a decrease of ${Math.abs(Math.round(arrivalsChange * 100))}%`;
        const waitTimeDifferenceText = (waitTimeDifference >= 0) ? `${waitTimeDifference} minutes longer` : `${Math.abs(waitTimeDifference)} minutes less`;
        
        // Display the results
        resultElement.innerHTML = 
        `<p>For your trip <i>(Route ${routeId} going towards ${tripHeadsign} during ${weekPeriod}s starting at ${stopName}</i>),
        an average of <b>${arrivalsBeforeCuts}</b> buses came in the ${timeOfDay} before the August 2025 service cuts.</p>
        
        <p>However, during the cuts, an average of <b>${arrivalsDuringCuts}</b> buses came, <b>${arrivalsChangePercent}</b> from the pre-cut average.
        This meant that on average you waited <b>${waitTimeDifferenceText}</b> for your bus during the period of the service cuts.</p>`;
        
    });
};

/**
* Display stored community data summary statistics in the community-summary section
* 
* @param {string} context - 'init' for initial display, 'update' for after user data stored
*/
export async function displayCommunityDataSummary(context) {
    const displayData = await storage.calculateSummaryStatistics();

    // Values for display
    const contextText = (context === 'init') ? 'trips' : 'trips (including your own)';
    const numTrips = displayData.totalSubmissions;
    const averagePercentChange = (displayData.averagePercentChange >= 0) ? `${Math.round(displayData.averagePercentChange * 100)}% increase` : `${Math.abs(Math.round(displayData.averagePercentChange * 100))}% decrease`;
    const totalWaitTimeAverage = (displayData.totalWaitTimeDifference / displayData.totalSubmissions);
    const totalWaitTimeDisplay = (totalWaitTimeAverage >= 0) ? `${Math.round(totalWaitTimeAverage)} additional minutes` : `${Math.abs(Math.round(totalWaitTimeAverage))} fewer minutes`;
    
    const summaryElement = document.querySelector('.community-results');
    summaryElement.innerHTML = `
        <h3>Affects on community trips</h3>
        <p>Riders on the <b>${numTrips}</b> ${contextText} summitted by users of this tool saw a <b>${averagePercentChange}</b> in the number of buses arriving during their travel window during the August 2025 service cuts.</p>
        <p>This meant that the riders of these trips waited <b>${totalWaitTimeDisplay}</b> for their bus to come compared to before the service cuts, on average.</p>
        `;
};

/**
 * Listen for user data storage event and update community data summary display
 *
 * @param {EventTarget} eventBus - The event bus to listen for the event on
 */
export function updateCommunityDataSummary(eventBus) {
    eventBus.addEventListener('userDataStored', async () => {
        await displayCommunityDataSummary('update');
    });
};
