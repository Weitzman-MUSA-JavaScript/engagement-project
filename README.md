# 🎄 Philadelphia Restaurants Explorer

An interactive web application designed to help locals and tourists discover, filter, and save their favorite businesses in Philadelphia. Powered by the Yelp Academic Dataset, this project transforms raw data into a festive, user-friendly geospatial dashboard.

## 📖 Project Overview

This application visualizes thousands of businesses on an interactive map, allowing users to filter by cuisine, rating, and amenities. It features a "Wishlist" system that lets users save their favorite spots for later planning—perfect for organizing holiday dinners or weekend trips.

## 🎯 Target Audience

* **Foodies & Explorers:** People looking for specific cuisines or highly-rated hidden gems in the city.
* **Tourists:** Visitors who need a visual guide to find reputable businesses near their location.
* **Holiday Planners:** Users organizing festive gatherings who need to filter venues by specific features (e.g., "Good for Groups", "Has TV") and save them to a wishlist.

## ✨ Key Features

* **Interactive Map:** Built with Leaflet.js and MarkerCluster to efficiently handle thousands of data points.
* **Smart Filtering:**
  * **Cuisine Type:** Filter by American, Chinese, Italian, and more using modern capsule buttons.
  * **Amenities:** Filter by features like "Outdoor Seating", "Kids Friendly", or "Takeout".
  * **Rating Slider:** Easily filter out businesses below a certain star rating.
  * **Search:** Real-time search by business name or street address.
* **My Wishlist (Favorites):** Save interesting spots to a personal "Wishlist" which persists via local storage.
* **Holiday Theme:** A custom festive UI with a snowy header, Christmas color palette, and themed micro-interactions.
* **Data Validation:** Displays real-time counts of loaded businesses to verify data integrity.

## 🛠️ Technology Stack

* **Frontend:** HTML5, CSS3 (Flexbox/Grid), JavaScript (ES6+)
* **Mapping Library:** Leaflet.js & Leaflet.markercluster
* **Data Source:** Yelp Academic Dataset (processed via Python to extract Philadelphia records)
* **No Build Tools Required:** Runs directly in the browser with a simple local server.

## 🚀 How to Run

1. **Clone or Download** this repository.
2. Ensure the `data/philly_business.json` file is present (generated from the Yelp dataset).
3. Because of browser security policies (CORS), you cannot open `index.html` directly. You must run a local server.
4. Open your browser and navigate to `http://localhost:[port]`.

## 📂 File Structure

**Plaintext**

```
/
├── index.html          # Main Map Dashboard
├── favorites.html      # Wishlist Page
├── about.html          # Project Information
├── css/
│   └── style.css       # Custom Styles (Christmas Theme)
├── js/
│   └── map.js          # Core Logic (Map, Filters, Favorites)
└── data/
    └── philly_business.json  # Processed JSON Data
```

---

Happy Holidays & Happy Exploring! 🎅✨
