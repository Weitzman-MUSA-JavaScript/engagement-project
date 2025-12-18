# Find Your Spot - A Philly Food Finder
Lu Yii Wong

Fall 2025

**Find Your Spot** is a community-driven food discovery tool designed to help people choose restaurants based on *what kind of experience they’re looking for*, not just a single overall rating.

Unlike traditional food rating apps that rank restaurants against each other, this project recognizes that a great $15 noodle shop and a special-occasion restaurant can both be “excellent” but just for different moments. This project was inspired by my personal experience with restaurant rating apps like Beli and Yelp. I wanted to take a crack at creating a product that offers users a tailored experience when selecting their next food destination.

---

## What This Project Is

This application allows users to:

* Explore restaurants on an interactive map
* Filter and discover places based on **context** (e.g. budget, date night, group hang)
* Leave structured reviews that reflect *why* a restaurant is good
* Benefit from other users’ reviews to find spots that match their current mood or need

Restaurants are sourced from **OpenStreetMap (OSM)**, while reviews are stored and shared via **Supabase**, allowing multiple users to contribute to the same dataset. The more that users interact with this application, the more robust and the better the suggestions offered will be.

---

## Intended Users

This project is designed for **ALL FOODIES**! This includes:

* **Students** looking for affordable, reliable food near campus
* **Locals** who want to rediscover their neighborhood
* **Visitors** who want recommendations beyond generic “top 10” lists
* **Food lovers** who think *context matters* when choosing where to eat

Rather than asking “What’s the best restaurant?”, the app asks:

> *What kind of spot are you looking for right now?*

## Key Features

* **Interactive map (Leaflet + CARTO Light)**

  * Clickable restaurant markers
  * Zoom-to-selection behavior
  * Visual highlight for selected places

* **Find a spot panel**

  * Search by restaurant name
  * Filter by “What are you looking for?”
  * Filter by cuisine
  * Minimum review threshold
  * Randomized suggestions when no category is selected

* **Context-based reviews**

  * Star ratings for food, value, and vibe
  * Optional notes and “go-to order”
  * Reviews update rankings in real time

* **Clear user feedback**

  * Confirmation overlay after submitting a review
  * Ability to immediately write another review

---

## Try It Yourself (Example)

To see how the app works with existing data:

1. Open the application
2. In the **Search restaurants** bar, try searching for:

   * **Kalaya**
   * **Sabrina’s Café**
3. Click a restaurant pin or result
4. Explore:

   * existing reviews
   * how rankings change when you select different “What are you looking for?” categories
5. Switch to the **Leave a review** tab to add your own review and see it reflected immediately

These restaurants already have multiple reviews and are good examples of how the ranking system responds to different contexts.

---

## Tech Stack

* **Frontend:** Vanilla JavaScript, HTML, CSS
* **Mapping:** Leaflet.js + CARTO Light basemap
* **Data source:** OpenStreetMap (Overpass API)
* **Backend / Storage:** Supabase (PostgreSQL + Row Level Security)
* **Deployment:** GitHub Pages

---

## Why This Project Matters

This project explores how **community data**, **spatial interfaces**, and **context-aware design** can lead to more meaningful recommendations — especially in cities where food culture is diverse and deeply personal.

Instead of asking users to rank restaurants against each other, *Find Your Spot* helps people find the right place for the right moment.

---

## Areas for Future Improvement

While *Find Your Spot* is fully functional, there are several areas where the application could be further improved.

1. **Restaurant data maintenance:** Restaurant locations are currently sourced from OpenStreetMap (OSM), which means some listings may be outdated, missing, or incomplete. Future iterations could allow users to add new spots, flag closed restaurants, or help keep information current.

2. **Map interaction refinements:** The map successfully zooms to selected restaurants, but centering and animation behavior could be further refined to improve consistency across screen sizes and interactions.

3. **Visual identity and branding:** The current design emphasizes clarity and usability, but the application could benefit from a stronger visual identity through more distinctive colors, custom markers, and refined typography.

4. **Recommendation enhancements:** As more reviews are collected, the ranking logic could be expanded to better surface highly rated places with fewer reviews or incorporate more nuanced recommendation strategies.

5. **Site Accessibility:** Part of the issue with ensuring accessibility on this site is that the markers must remain clickable to users. By making markers not tabbable (to avoid tabbing the 700+ markers) it would make the user experience with the other interactive parts of the application easier. However, it causes other accesibility problems. Hence, accessibility on this tool needs greater refinement moving forward.