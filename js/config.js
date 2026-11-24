export const MAPBOX_TOKEN = 'pk.eyJ1IjoiZXZ6aG9uZyIsImEiOiJjbXR1amU4NTgwbDJiMndvcHk0cDY1cXZwIn0.04V1QlAtr7xLGktkYOsBfw';

// firebase web config from Firebase console 
export const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

export const SUGGESTIONS_COLLECTION = 'shelterSuggestions';

export const STOPS_SERVICE =
  'https://arcgis.dvrpc.org/portal/rest/services/transportation/SEPTA_TransitStops/FeatureServer/0';

export const STOPS_FALLBACK = 'data/septa_bus_stops.geojson';

export const START_VIEW = { center: [-75.33, 39.98], zoom: 10.2 };

export const JUMPS = {
  'center-city': { center: [-75.1635, 39.9515], zoom: 15 },
  'north-philly': { center: [-75.1545, 40.0075], zoom: 15 }, 
  'wc-pike': { center: [-75.43, 39.968], zoom: 13 },         
};
