import _debounce from 'https://esm.run/lodash/debounce';
import { submitSighting, handleSightingSubmission } from './firebase.js';
import { getDocs, collection, getFirestore, query, where, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';


// Include map 
mapboxgl.accessToken = 'pk.eyJ1Ijoic3lsdmlhdXBlbm4iLCJhIjoiY20weTdodGpiMGt4MDJsb2UzbzZnd2FmMyJ9.H6mn-LOHFUdv7swHpM7enA'


const map = new mapboxgl.Map({
    container: 'map', 
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: [0, 0], 
    zoom: 2,
    scrollZoom: true, // Enable zooming via scroll
    interactive: true, 
});

map.doubleClickZoom.disable();

// Fetch and display markers after the map has been loaded
map.on('load', async () => {
  try {
      await populateWhaleDropdown();
      await fetchAndDisplayMarkers();
  } catch (error) {
      console.error("Initialization error:", error);
  }
});


let selectedSpecies = 'All'; // Default value to show all species
let allMarkers = []; // Store all markers to remove them later

const db = getFirestore();

document.addEventListener('DOMContentLoaded', function() {
  const whaleInput = document.querySelector('#whale-type');
  if (whaleInput) {
    initWhaleSearch(whaleInput);
  } else {
    console.error('Element with id "whale-type" not found!');
  }
});

// Whale dataset for autocomplete search
const whaleDataset = [
  "Blue Whale", "Humpback Whale", "Orca Whale", "Beluga Whale", "Narwhal Whale", "Fin Whale", 
  "Whale Shark", "Short-Finned Pilot Whale", "Bowhead Whale", "False Killer Whale", "Sperm Whale", 
  "Unknown"
];

function initWhaleSearch(el) {
  const autocompleteOptionsList = document.createElement('ol');
  autocompleteOptionsList.classList.add('autocomplete-options');
  el.after(autocompleteOptionsList);

  function showAutocompleteOptions() {
    const query = el.value.trim();

    // If the input is empty, reload all markers and hide the dropdown
    if (query === "") {
      selectedSpecies = 'All'; // Reset to show all species
      fetchAndDisplayMarkers(); // Reload all markers
      autocompleteOptionsList.classList.add('hidden');
      return;
    }

    const filteredWhales = whaleDataset.filter(whale => whale.toLowerCase().startsWith(query.toLowerCase()));

    autocompleteOptionsList.classList.remove('hidden');
    autocompleteOptionsList.innerHTML = '';

    if (filteredWhales.length === 0) {
      const noResults = document.createElement('li');
      noResults.textContent = "No results";
      noResults.classList.add('no-results');
      autocompleteOptionsList.appendChild(noResults);
    } else {
      filteredWhales.forEach(whale => {
        const option = document.createElement('li');
        option.classList.add('autocomplete-option');
        option.textContent = whale;
        option.addEventListener('click', () => {
          el.value = whale; // Set input value to the selected whale
          autocompleteOptionsList.classList.add('hidden'); // Hide dropdown after selection

          // Update the global selectedSpecies value
          selectedSpecies = whale;
          fetchAndDisplayMarkers(); // Call the function to update the map markers
        });
        autocompleteOptionsList.appendChild(option);
      });
    }
  }

  el.addEventListener('input', _debounce(showAutocompleteOptions, 300));
}

function filterWhaleSpecies(sightings, selectedSpecies) {
  if (selectedSpecies === 'All') return sightings; // Return all sightings if "All" is selected
  return sightings.filter(sighting => sighting.species === selectedSpecies);
}

async function populateWhaleDropdown() {
  try {
      const querySnapshot = await getDocs(collection(db, "sightings"));
      const speciesSet = new Set();

      querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.species) {
              speciesSet.add(data.species);
          }
      });

      const speciesList = Array.from(speciesSet).sort();
      console.log('Species list:', speciesList); // Log the species list

      const whaleDropdown = document.querySelector('#whale-type');
      if (!whaleDropdown) {
          console.error('Dropdown with id "whale-type" not found!');
          return;
      }

      whaleDropdown.innerHTML = ''; 
      whaleDropdown.appendChild(new Option("All", "All"));

      speciesList.forEach((species) => {
          whaleDropdown.appendChild(new Option(species, species));
      });

      console.log('Dropdown populated with species:', speciesList);
  } catch (error) {
      console.error("Error fetching species from Firebase:", error);
  }
}


document.querySelector('#whale-type').addEventListener('change', (event) => {
  const selectedSpecies = event.target.value.trim();

  // Check if no species is selected or "All" is selected
  if (!selectedSpecies || selectedSpecies.toLowerCase() === "all") {
      fetchAndDisplayMarkers(); // Fetch and display all markers
  } else {
      // Fetch and display markers filtered by the selected species
      fetchAndDisplayMarkers(selectedSpecies);
  }
});

async function fetchAndDisplayMarkers() {
  try {
      const querySnapshot = await getDocs(collection(db, "sightings"));
      const sightings = [];

      querySnapshot.forEach((doc) => {
          const data = doc.data();
          sightings.push({
              longitude: data.longitude,
              latitude: data.latitude,
              audio: data.audio,
              date: data.date,
              description: data.description,
              photo: data.photo,
              video: data.video,
              species: data.species
          });
      });

      // Filter sightings based on selected species
      const filteredSightings = filterWhaleSpecies(sightings, selectedSpecies);

      // Remove the old markers from the map
      clearMarkers();

      // Display the filtered sightings on the map
      displayMarkersOnMap(map, filteredSightings);

  } catch (error) {
      console.error("Error fetching locations from Firebase:", error);
  }
}

function clearMarkers() {
  if (allMarkers.length > 0) {
      allMarkers.forEach(marker => marker.remove()); // Remove markers from the map
      allMarkers = []; // Clear the array
  }
}

function displayMarkersOnMap(map, sightings) {
  sightings.forEach(sighting => {
      // Create a custom marker element
      const markerElement = document.createElement('img');
      markerElement.src = './data/whale.png'; // Path to your PNG
      markerElement.alt = 'Whale Marker';
      markerElement.style.width = '30px';  // Adjust the size of your marker
      markerElement.style.height = '30px';
      markerElement.style.cursor = 'pointer'; // Optional: Change cursor to a pointer

      // Create a new marker for each sighting
      const marker = new mapboxgl.Marker({ element: markerElement }) // Use custom marker element
          .setLngLat([sighting.longitude, sighting.latitude]) // Set marker position
          .addTo(map); // Add marker to the map


      // Create a pop-up instance (but don't add content yet)
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setMaxWidth('400px'); // Optional: Max width for better layout

      // Flag to track if the pop-up is permanent
      let isPopupOpen = false;

      const createPopupContent = () => {
        let species = sighting.species || 'Unknown Species';
        let description = sighting.description || 'No description available';
        let popupContent = `
            <div class="marker-popup">
                <h3>${species}</h3>
                <p>${description}</p>
        `;

        if (sighting.photo) {
            popupContent += `<img src="${sighting.photo}" alt="Whale image" style="width:100%; max-height:150px; object-fit:cover;">`;
        }
        if (sighting.video) {
            popupContent += `
                <video controls style="width:100%; max-height:150px;">
                    <source src="${sighting.video}" type="video/mp4">
                </video>`;
        }
        if (sighting.audio) {
            popupContent += `
                <audio controls style="width:100%;">
                    <source src="${sighting.audio}" type="audio/mpeg">
                </audio>`;
        }
        popupContent += `</div>`;
        return popupContent;
    };

    // Handle mouse enter event to show pop-up if not permanent
    marker.getElement().addEventListener('mouseenter', () => {
      if (!isPopupOpen) {
          popup.setHTML(createPopupContent())
              .setLngLat([sighting.longitude, sighting.latitude])
              .addTo(map);
      }
    });

    // Handle mouse leave event to remove the pop-up if not permanent
    marker.getElement().addEventListener('mouseleave', () => {
      if (!isPopupOpen) {
          popup.remove();
      }
    });

      // Add the new marker to the allMarkers array
      allMarkers.push(marker);
  });
}

let boundingBoxes = {}; // Store the boundingBoxes data

// Function to load JSON data (boundingBoxes)
async function loadBoundingBoxes() {
    try {
        const response = await fetch('./data/boundingBoxes.json'); // Path to your boundingBoxes.json file
        if (!response.ok) {
            throw new Error('Failed to load bounding boxes');
        }
        boundingBoxes = await response.json(); // Parse JSON data
        console.log('Bounding Boxes loaded:', boundingBoxes);
    } catch (error) {
        console.error(error);
    }
}

// Autocomplete and search functionality
document.addEventListener('DOMContentLoaded', function () {
    const locationInput = document.querySelector('#location');
    if (locationInput) {
        initCountrySearch(locationInput);
    } else {
        console.error('Element with id "location-search" not found!');
    }
});

// Initialize autocomplete search
function initCountrySearch(el) {
    const autocompleteOptionsList = document.createElement('ol');
    autocompleteOptionsList.classList.add('autocomplete-options');
    el.after(autocompleteOptionsList); // Add the dropdown after the input field

    function showAutocompleteOptions() {
        const query = el.value.trim().toLowerCase();

        // Hide the dropdown if the input is empty
        if (query === "") {
            autocompleteOptionsList.classList.add('hidden');
            return;
        }

        // Filter countries based on name from the boundingBoxes dataset
        const filteredCountries = Object.entries(boundingBoxes).filter(([countryCode, data]) =>
            data[0].toLowerCase().startsWith(query)
        );

        autocompleteOptionsList.classList.remove('hidden');
        autocompleteOptionsList.innerHTML = ''; // Clear previous results

        if (filteredCountries.length === 0) {
            const noResults = document.createElement('li');
            noResults.textContent = "No results";
            noResults.classList.add('no-results');
            autocompleteOptionsList.appendChild(noResults);
        } else {
            filteredCountries.forEach(([countryCode, data]) => {
                const option = document.createElement('li'); // Create each option
                option.classList.add('autocomplete-option');
                option.textContent = data[0]; // Display the country name here
                
                option.addEventListener('click', () => {
                    el.value = data[0]; // Set input value to the selected country name
                    autocompleteOptionsList.classList.add('hidden'); // Hide dropdown after selection
                    zoomToCountry(countryCode); // Use the country code to pan the map
                });

                autocompleteOptionsList.appendChild(option);
            });
        }
    }

    el.addEventListener('input', _debounce(showAutocompleteOptions, 300));
}

// Function to pan and zoom to a selected country
async function zoomToCountry(countryCode) {
    // Get the bounding box of the country
    const boundingBox = boundingBoxes[countryCode]?.[1];

    if (!boundingBox) {
        console.error(`Bounding box not found for country: ${countryCode}`);
        return;
    }

    const sw = [boundingBox[0], boundingBox[1]]; // [minLng, minLat] for southwest
    const ne = [boundingBox[2], boundingBox[3]]; // [maxLng, maxLat] for northeast

    // Use fitBounds to zoom and pan to the country
    map.fitBounds([sw, ne], {
        padding: 20, // Add padding to the bounds
        maxZoom: 10, // Optional: set a maximum zoom level
    });
}

window.onload = loadBoundingBoxes; 

let currentPopup = null; // Track the current pop-up
let tempMarker = null; // Track the temporary marker
let currentInputs = { // Track the current inputs
    description: '',
    photo: null,
    video: null,
    audio: null,
  };

  map.on('dblclick', (e) => {
    e.originalEvent.stopPropagation();
    console.log('Double-click detected:', e);
    const { lat, lng } = e.lngLat;
  
    if (currentPopup && currentPopup.getElement()) {
        // Ensure the popup exists and check if form elements are still available
        const formElement = currentPopup.getElement().querySelector('form');
        if (formElement) {
            const description = document.querySelector('[name="description"]').value.trim();
            const photo = document.getElementById('photoInput').files[0];
            const video = document.getElementById('videoInput').files[0];
            const audio = document.getElementById('audioInput').files[0];
    
            // If there are unsaved inputs, prompt the user
            if (description || photo || video || audio) {
                const userConfirmed = confirm('You have unsaved data. Do you want to abandon it and create a new entry?');
                if (!userConfirmed) {
                return; // Stop further actions if the user cancels
                }
            }
        }

        // Close the current popup and clear temporary marker
        currentPopup.remove();
        currentPopup = null;
        if (tempMarker) {
          tempMarker.remove();
          tempMarker = null;
        }
      }
  
    if (tempMarker) {
      tempMarker.remove();
      tempMarker = null;
    }
  
     // Set the default date and time values
    const now = new Date();
    const currentDate = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}`; // MM-DD-YYYY format
    const currentTime = now.toTimeString().split(':').slice(0, 2).join(':'); // HH:MM format

    // Create a custom marker element
    const markerElement = document.createElement('img');
    markerElement.src = './data/whale.png'; // Path to your whale PNG
    markerElement.alt = 'Whale Marker';
    markerElement.style.width = '30px'; // Adjust the size as needed
    markerElement.style.height = '30px';
    markerElement.style.cursor = 'pointer'; // Optional: pointer cursor

    // Create and add the temporary marker using the custom element
    tempMarker = new mapboxgl.Marker({
      element: markerElement, // Use the custom marker element
      draggable: false,       // Set to true if you want it draggable
    })
      .setLngLat([lng, lat])   // Set the position to the clicked location
      .addTo(map);
  
    const popupContent = `
      <form id="sightingForm">
        <label>Latitude: <input type="text" name="latitude" value="${lat}" readonly style="width: 100%;" /></label><br/>
        <label>Longitude: <input type="text" name="longitude" value="${lng}" readonly style="width: 100%;" /></label><br/>
        <label>Date: <input type="date" id="dateInput" value="${now.toISOString().split('T')[0]}" required style="width: 100%;" /></label><br/>
        <label>Time: <input type="time" id="timeInput" value="${currentTime}" required style="width: 100%;" /></label><br/>
        <label>Whale Species:
          <select name="whaleSpecies" id="whaleSpecies" required style="width: 100%;">
            <option value="" disabled selected>Select a species</option>
            <option value="Beluga Whale">Beluga Whale</option>
            <option value="Blue Whale">Blue Whale</option>
            <option value="Bowhead Whale">Bowhead Whale</option>
            <option value="False Killer Whale">False Killer Whale</option>
            <option value="Fin Whale">Fin Whale</option>
            <option value="Humpback Whale">Humpback Whale</option>
            <option value="Narwhal Whale">Narwhal Whale</option>
            <option value="Orca Whale">Orca Whale</option>
            <option value="Short-Finned Pilot Whale">Short-Finned Pilot Whale</option>
            <option value="Sperm Whale">Sperm Whale</option>
            <option value="Whale Shark">Whale Shark</option>
            <option value="Unknown">Unknown</option>
          </select>
        </label><br/>
        <label>Description: 
          <textarea name="description" style="width: 100%;" placeholder="Enter description (optional)"></textarea>
        </label><br/>
        <label>Photo: <input type="file" id="photoInput" accept="image/*" style="width: 100%;" /></label><br/>
        <label>Video: <input type="file" id="videoInput" accept="video/*" style="width: 100%;" /></label><br/>
        <label>Audio: <input type="file" id="audioInput" accept="audio/*" style="width: 100%;" /></label><br/>
        <button type="button" id="submitBtn" style="width: 100%;">Submit</button>
      </form>
    `;
  
    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '420px',
    })
      .setLngLat([lng, lat])
      .setHTML(popupContent)
      .addTo(map);
  
    currentPopup = popup;
  
    popup.on('close', () => {
      if (tempMarker) {
        tempMarker.remove();
        tempMarker = null;
      }
    });
  
    popup.getElement().querySelector('#submitBtn').addEventListener('click', async () => {
      const selectedDate = document.getElementById('dateInput').value;
      const selectedTime = document.getElementById('timeInput').value;
      const species = document.getElementById('whaleSpecies').value;
      const description = document.querySelector('[name="description"]').value;
  
      const photoFile = document.getElementById('photoInput').files[0];
      const videoFile = document.getElementById('videoInput').files[0];
      const audioFile = document.getElementById('audioInput').files[0];
  
      if (!selectedDate || !selectedTime || !species) {
        alert('Date, time, and whale species are required.');
        return;
      }

  
      try {
        await submitSighting(lat, lng, species, description, selectedDate, selectedTime, {
          photo: photoFile,
          video: videoFile,
          audio: audioFile,
        });
  
        const permanentMarker = new mapboxgl.Marker({
          element: markerElement,
        })
          .setLngLat([lng, lat])
          .addTo(map);
  
        popup.remove();
        currentPopup = null;
  
        if (tempMarker) {
          tempMarker.remove();
          tempMarker = null;
        }
  
        alert('Sighting submitted successfully!');
      } catch (error) {
        console.error('Failed to submit sighting:', error);
        alert('Failed to save the sighting. Please try again.');
      }
    });
  });  

export { initCountrySearch };
export { fetchAndDisplayMarkers };
