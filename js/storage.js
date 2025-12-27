// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyAp8afrw8k9_kyPgGD0NuthJVvcNSfk8GU',
    authDomain: 'septa-cuts-impacts.firebaseapp.com',
    projectId: 'septa-cuts-impacts',
    storageBucket: 'septa-cuts-impacts.firebasestorage.app',
    messagingSenderId: '260659001862',
    appId: '1:260659001862:web:e3ba37f5b6071dfe4ce187',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
* When stopData event is dispatched, store the user selection data in Firestore
*
* @param {EventTarget} eventBus - The event bus to listen for the event on
*/
export function storeUserData(eventBus) {
    eventBus.addEventListener('stopData', async (event) => {
        const resultData = event.detail.data;
        if (resultData.features.length === 0 | resultData.features.length > 1) {
            console.log('Invalid selection, data not stored.');
            return;
        }
        const resultsFields = resultData.features[0].properties;
        try {
            await addDoc(collection(db, 'stop_data_storage'), {
                route_id: resultsFields.route_id,
                trip_headsign: resultsFields.trip_headsign,
                week_period: resultsFields.week_period,
                time_of_day: resultsFields.time_of_day,
                stop_id: resultsFields.stop_id,
                stop_name: resultsFields.stop_name,
                arrivals_before_cuts: resultsFields.arrivals_before_cuts,
                arrivals_during_cuts: resultsFields.arrivals_during_cuts,
                percent_change: resultsFields.percent_change,
                expected_wait_time_difference: resultsFields.expected_wait_time_difference,
                timestamp: new Date()
            });
            console.log('User data successfully stored.');
        } catch (e) {
            console.error('Error adding document: ', e);
        }

        // After storing user data, dispatch an event to indicate data were stored
        const updateEvent = new Event('userDataStored');
        eventBus.dispatchEvent(updateEvent);
    });
};

/**
* Get stored community data from Firestore
*
* @returns {object} Firestore collection
*/
async function getCommunityData() {
    const communityDataCollection = collection(db, 'stop_data_storage');
    const communityData = await getDocs(communityDataCollection);
    const allCommunityData = [];
    communityData.forEach((doc) => {
        allCommunityData.push({ id: doc.id, ...doc.data() });
    });
    return allCommunityData;
};

/** 
* From the retrieved community data, calculate the following summary statistics:
* - Total number of submissions
* - Total number of arrivals before cuts
* - Total number of arrivals during cuts
* - Average percent change in arrivals
* - Sum of expected wait time difference
* 
* @returns {object} summary statistics
*/
export async function calculateSummaryStatistics() {
    const communityDataArray = await getCommunityData();
    const totalSubmissions = communityDataArray.length;
    let totalArrivalsBeforeCuts = 0;
    let totalArrivalsDuringCuts = 0;
    let totalWaitTimeDifference = 0;
    
    communityDataArray.forEach((data) => {
        totalArrivalsBeforeCuts += data.arrivals_before_cuts;
        totalArrivalsDuringCuts += data.arrivals_during_cuts;
        totalWaitTimeDifference += data.expected_wait_time_difference;
    });
    
    const averagePercentChange = totalSubmissions > 0 ? (totalArrivalsDuringCuts / totalArrivalsBeforeCuts) - 1 : 0;
    
    const returnData =
    {
        totalSubmissions,
        totalArrivalsBeforeCuts,
        totalArrivalsDuringCuts,
        averagePercentChange,
        totalWaitTimeDifference
    };
    
    return returnData;
};
