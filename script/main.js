import { initializeCampusMap } from './campus-map.js';
import { loadMarkers, initializeFoodForm, initializeCloseButton, initializeFilters } from './firebase.js';

async function initializeApp() {
  const campusMap = initializeCampusMap();
  console.log('Map initialized:', campusMap);
  await loadMarkers();
  initializeFoodForm();
  initializeCloseButton();
  initializeFilters();
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeApp();
    console.log('App initialization complete');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
});
