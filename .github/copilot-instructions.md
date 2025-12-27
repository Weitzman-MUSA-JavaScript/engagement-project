# AI Coding Assistant Instructions for SEPTA Service Cuts Engagement Project

## Project Overview
This is a client-side web application that visualizes the impact of SEPTA bus service cuts on Philadelphia residents. Users enter their address or use geolocation to see how cuts affected bus routes in their Pennsylvania Senate district. The app uses Leaflet maps, Turf.js for geospatial analysis, and Census geocoding API.

## Architecture
- **Modular ES6**: Code split into `js/` modules (main.js, map.js, location.js, utils.js) with event-driven communication via a shared EventTarget bus.
- **Data Flow**: User location → geocoding → district lookup → filter/display route impacts.
- **No Build System**: Static files served directly; use ES modules and CDN libraries (Leaflet, Turf.js, Lodash).
- **Data Sources**: Pre-processed GeoJSON files in `data/` (routes, stops, districts) generated from R scripts.

## Key Conventions
- **Event Bus Pattern**: Use `events.dispatchEvent(new CustomEvent('eventName', { detail: data }))` for inter-module communication (e.g., `userLocationAcquired`, `districtData`).
- **Async Data Loading**: Fetch JSON with `await fetch('data/filename.json')` in `utils.js`.
- **Geospatial Ops**: Use Turf.js for point-in-polygon (district lookup) and masking.
- **Debounced Inputs**: Apply Lodash `_.debounce()` to address search for performance.
- **CORS Handling**: Route external API calls through `https://corsproxy.io/?url=` for Census geocoding.

## Developer Workflows
- **Linting**: Run `npm run js-lint` (ESLint) and `npm run css-lint` (Stylelint) before commits.
- **Data Processing**: Use R scripts in `r/` to transform raw CSV arrivals data into GeoJSON (e.g., `export_to_geojson.R`).
- **Local Development**: Open `index.html` in browser; no server needed for static assets.
- **Testing**: Manually test geolocation, address input, and map interactions across districts.

## Common Patterns
- **Map Styling**: Define Leaflet styles as functions returning objects (e.g., `standardStyle(feature)` in `map.js`).
- **District Overlay**: Use Turf `turf.mask()` to create inverted polygons for focus areas.
- **Error Handling**: Alert users for geolocation failures; log console errors for debugging.
- **Responsive Design**: CSS in `styles.css` handles sidebar/map layout.

## Integration Points
- **Leaflet Map**: Initialized in `map.js` with CartoDB basemap; add GeoJSON layers with custom styles.
- **Census API**: Geocode addresses via `https://geocoding.geo.census.gov/geocoder/locations/address` with Philadelphia bounds.
- **Turf.js**: Perform spatial queries like `turf.booleanPointInPolygon(point, polygon)`.

## File Structure Highlights
- `js/main.js`: Entry point, loads data, sets up event listeners.
- `js/location.js`: Handles geolocation and address search with debounced API calls.
- `js/map.js`: Manages Leaflet map, legend, and district masking.
- `data/`: Static GeoJSON (septa_routes.json, arrivals_and_stops.json, districts.json).
- `r/`: Data processing scripts for generating JSON from raw CSVs.</content>
<parameter name="filePath">/Users/chkim/Documents/Projects/classes/musa-javascript/septa-cuts-engagement/.github/copilot-instructions.md