# User Engagement Project

by Frank Chen

## Project Description
Welcome to **Retail Insights**, an interactive web platform designed to visualize and analyze critical trends in local economies and consumer behavior over the past five years. By mapping income changes, customer numbers, median spending, and dwell time in stores, our tool provides valuable insights for **small business owners**, **urban planners**, **researchers**, and **engaged consumers**. 

What sets Retail Insights apart is its community-driven approach—users can actively contribute their own spending habits and in-store experiences, enriching the dataset and fostering a collaborative environment. This project not only empowers businesses and policymakers with data-driven decision-making capabilities but also enhances consumer awareness and participation in shaping their local economic landscape.

Join us in building a comprehensive, real-time picture of our community’s economic health and consumer dynamics through your valuable contributions.

## Data Sources

I use two data sets from Dewey, a big data platform which is accessible to all PennID holders. I use API to acquire the data of July of each year, and the total size would be hundreds of gigabytes. The two data sets are:

1. [ADVAN monthly foot traffic data](https://app.deweydata.io/products/5acc9f39-1ca6-4535-b3ff-38f6b9baf85e/package). It includes aggregated raw counts of visits to POIs from a panel of mobile devices over a given month, detailing how often people visit, how long they stay, where they came from, where else they go, and more.

2. [SafeGraph monthly spend patterns data](https://app.deweydata.io/products/eb6e748a-0fdd-4bc7-9dd7-bbed0890948d/package). It includes aggregated, anonymized credit and debit transaction data associated to specific POIs, including median spend per day, median spend per customer, and other detailed statistics, as well as where else consumers spend money and the breakdown of online/offline spending.

The two data sets can be joined by a shared column called PlaceKey, which is the unique and persistent ID tied to a POI.

The images are from [Visit Philadelphia](https://www.visitphilly.com/).

## How to Use

Upon visiting the website, you'll encounter an introduction page. Scroll down to learn more, and click the button to navigate to the dashboard.

### Dashboard Features

- **Interactive Map:** The dashboard displays a map with Points of Interest (POIs) marked.
- **Year Selection:** Use the dropdown in the top-left corner to select a specific year and visualize data for that period.
- **Selecting POIs:**
  - **Map Click:** Click directly on a POI marker on the map.
  - **Search Bar:** Alternatively, search for a POI by name using the search bar at the top.
- **POI Details:** Once a POI is selected, detailed information will appear on the right side of the map.
- **Data Trends:** Below the map and detailed information, you can view the trend data for the selected POI over the past five years.

### Contribute to the Project

We welcome your contributions! Click the red **"TAKE SURVEY"** button at the top of the page to participate. By completing the survey, you can share your spending habits and in-store time. Your responses will be added to our dataset and visualized on the map, helping to enhance the project.