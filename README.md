# Hangzhou Central District Flood Reporting System

**Resident-Focused Urban Inundation Reporting Tool** 
[Project Link](https://haoyu25.github.io/engagement-project/)

An interactive web-based system designed for **residents of Hangzhou’s central districts** to report urban flooding events. This tool empowers residents to actively participate in flood monitoring, providing spatially referenced data for city planners and emergency management.

## Purpose

1. Collect real-time flood data from residents to inform city planning and disaster response.
2. Provide an intuitive platform for residents to report inundation events with detailed information including location, date, time, water depth, and type of situation.
3. Visualize flood patterns across the central districts of Hangzhou through maps, markers, and heatmaps.

## Features

- **Interactive Map**
  - Overview of Hangzhou Central Districts with zoom and pan functionality.
  - Multiple layers: roads, water bodies, parks, metro stations, amenities, and resident-submitted flood points.
  - Dynamic heatmap showing concentration of flood events.

- **Resident Flood Reporting**
  - Select a location on the map to report a flooding event.
  - Input date, time, water depth, situation type, and optional description.
  - Submitted reports are displayed as interactive markers with popups containing details.

- **Filtering and Exploration**
  - Filter reports by date range and water depth (shallow, moderate, deep, severe).
  - Click on markers to view detailed information about each flood report.
  - Statistics display total reports and reports for today.

- **User-Friendly Interface**
  - Language toggle (Chinese/English).
  - Clear, accessible design suitable for all residents.

## Technologies Used

- Frontend: HTML5, CSS3, JavaScript (ES6 modules)
- Mapping: Leaflet and Leaflet.heat
- Date/Time Selection: Flatpickr
- Data Storage: Firestore (for storing resident flood reports)

## How It Works

1. Residents click on the map to select a location of flooding.
2. They fill in the date, time, water depth, situation type, and optionally add a description.
3. Reports are saved in the backend and displayed on the map as markers.
4. Reports can be filtered and explored to visualize flooding patterns across neighborhoods.
5. Heatmap highlights areas with the highest frequency of flooding reports.

## Intended Users

- Residents: to report real-time flooding events.
- City Planners & Emergency Managers: to use community-sourced data for urban planning, flood mitigation, and emergency response.

## Data Sources

- **Inundation Risk Index:** From one of the author's projects: [Hangzhou Flooding Risk Detection](https://github.com/haoyu25/Hangzhou-Flooding-Risk-Detect)  
- **Amenity and Station POIs:** GaoDe Open Platform ([高德开放平台](https://lbs.amap.com/))

## Team Contributions

- **Annie**: Web page framework setup.
- **Haoyu**: Data collection and processing, Firebase integration, heatmap implementation.
- **Meixi**: Accessibility features and visual optimization.
