import * as utils from './utils.js';
import { initMap } from './map.js';
import * as dropdown from './dropdown.js';
import * as htmlDisplay from './htmlDisplay.js';
import * as storage from './storage.js';

// Events in event bus:
// routeData - dispatched when route is selected
// directionData - dispatched when trip direction is selected
// weekdayData - dispatched when day of week is selected
// timeData - dispatched when time of day is selected
// stopData - dispatched when stop is selected
// userDataStored - dispatched when user data is stored in Firestore
const events = new EventTarget();

const mapElement = document.querySelector('#map');

// Read geoJSON data
const septaNetwork = await utils.getGeojsonCollection('septa_routes.json');
const arrivalsAndStops = await utils.getGeojsonCollection('arrivals_and_stops.json');

// Initialize map
initMap(events, mapElement, septaNetwork);

// Display existing user data summary statistics
htmlDisplay.displayCommunityDataSummary('init');

// Populate route dropdown
dropdown.populateDropdown(events, arrivalsAndStops, 'route', 'route_id', 'Please choose your route');

// Populate trip direction dropdown based on selected route
dropdown.cascadeDropdown(events, 'routeData', 'direction', 'trip_headsign', 'Please choose your trip direction');

// Populate day of week dropdown based on previous selections
dropdown.cascadeDropdown(events, 'directionData', 'weekday', 'week_period', 'Please choose the day of the week');

// Populate day of week dropdown based on previous selections
dropdown.cascadeDropdown(events, 'weekdayData', 'time', 'time_of_day', 'Please choose your stop');

// Populate stop dropdown based on previous selections
dropdown.cascadeDropdown(events, 'timeData', 'stop', 'stop_name', 'Please choose your stop');

// In user-results section, listen for final stop selection and display results
htmlDisplay.displayUserData(events);

// Store user data to Firestore
storage.storeUserData(events);

// Update user data summary statistics when user's own data is stored
htmlDisplay.updateCommunityDataSummary(events);
