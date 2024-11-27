import { addAthleteReport } from './firebase.js';
import { initBar } from './barchart.js';
import { initStatEntry } from './stat_entry.js';
import { calculateChartData } from './chart_data.js';
import { initRadar } from './radar.js';
import { collectAthleteData } from './athlete_report.js';

/*
Custom Events:
- statFilled: Fired when a stat is filled in the form
  Detail: { statName: string, statValue: number }
- positionSelected: Fired when a position is selected in the form
  Detail: { position: string }
*/

// Fetch individual stats data
const indivStatsResponse = await fetch('data/stats_2020_2024.json');
const indivStats = await indivStatsResponse.json();

// Create an event target for custom events
const events = new EventTarget();

// Set up references to DOM elements
const statListEl = document.querySelector('#athlete-stats');
const positionDropdownEl = document.querySelector('#header');

// Extract positions and stat names from data
const positions = Object.keys(indivStats);
const statNames = Object.keys(Object.values(indivStats)[0][0]);

// Initialize stat entry form
initStatEntry(statListEl, positionDropdownEl, statNames, positions, events);

// Calculate chart data based on stats and events
const chartData = calculateChartData(indivStats, events);

// -----------------------------------------------------------------------------
// Chart Rendering
// -----------------------------------------------------------------------------

// Get chart container elements
const strengthEl = document.querySelector('#strength-chart');
const powerEl = document.querySelector('#power-chart');
const speedEl = document.querySelector('#speed-chart');
const agilityEl = document.querySelector('#agility-chart');
const anthroEl = document.querySelector('#anthro-chart');
const radarEl = document.querySelector('#radar-chart');

// Function to render all charts
function renderCharts() {
  const {
    positionMedians,
    playerPercentiles,
    playerStats,
    playerStatsValues,
    categoryPercentiles,
  } = chartData.getCalculatedData();

  // Render bar charts
  initBar(strengthEl, positionMedians, playerStats, playerStatsValues, playerPercentiles);
  initBar(powerEl, positionMedians, playerStats, playerStatsValues, playerPercentiles);
  initBar(speedEl, positionMedians, playerStats, playerStatsValues, playerPercentiles);
  initBar(agilityEl, positionMedians, playerStats, playerStatsValues, playerPercentiles);
  initBar(anthroEl, positionMedians, playerStats, playerStatsValues, playerPercentiles);

  // Render radar chart
  initRadar(radarEl, categoryPercentiles);
}

// -----------------------------------------------------------------------------
// Event Listeners
// -----------------------------------------------------------------------------

// Update charts when stats are filled
events.addEventListener('statFilled', renderCharts);

// Update charts when position is selected
events.addEventListener('positionSelected', renderCharts);

// Save athlete report on button click
document.getElementById('save-athlete').addEventListener('click', () => {
  const data = collectAthleteData();
  console.log('Saving athlete data:', data); // Debugging log
  addAthleteReport(data);
});

// Render charts on page load
renderCharts();
