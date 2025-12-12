# Penn Nighttime Safety Dashboard – Engagement Project

This project is an interactive web-based map designed to improve nighttime navigation safety for Penn students.  
It builds upon the Night Safety Map developed in earlier assignments and adds user engagement features, including route explanation and real-time user feedback collection.

---

##  Project Overview

The dashboard allows users to:
- Visualize crime hotspots using a heatmap
- Select start and destination points on campus
- Compare shortest vs safest walking routes
- Understand the trade-offs between different routing strategies
- Provide feedback on whether a recommended route was helpful

The goal of this engagement project is to move beyond visualization and support user interaction, explanation, and participation.


##  Engagement Features Implemented

### 1. Route Strategy Explanation
When a route is generated, a Route Comparison panel appears explaining:
- What the selected routing strategy prioritizes
- Potential trade-offs (distance vs safety)
- Why a user might choose one route over another

This helps users understand why a route was recommended, not just what the route is.


### 2. User Feedback Collection (Firebase Demo)
Users can provide feedback after viewing a route by clicking:
- 👍 Yes, this route was helpful
- 👎 No, this route was not helpful

Feedback is:
- Stored in Firebase Firestore
- Tagged with the selected route type (shortest / safest)
- Timestamped using server time

This demonstrates a minimal but functional example of real user engagement and data persistence.


##  Technologies Used

- HTML / CSS / JavaScript
- Leaflet.js (map rendering)
- Leaflet Heatmap plugin
- Firebase (Firestore database for feedback storage)


##  Notes

- Firebase integration is implemented as a minimal demo for engagement purposes
- No user authentication is required
- The focus of this assignment is interaction design rather than production deployment


##  Author
Author: Hazel Sun
Master of City Planning, University of Pennsylvania
Course: MUSA Dashboard Project


## Data Sources: 
OpenDataPhilly(Crime.geojson, Street_Centerline.geojson)
All datasets are projected in WGS84 (EPSG:4326).

