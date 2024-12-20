import _debounce from 'https://esm.run/lodash/debounce';

// Define a global variable to store the selected whale species
let selectedSpecies = 'All';

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
  el.after(autocompleteOptionsList);  // Add the dropdown after the input field

  function showAutocompleteOptions() {
    const query = el.value.trim();

    // Hide the dropdown if the input is empty
    if (query === "") {
      autocompleteOptionsList.classList.add('hidden');
      return;
    }

    const filteredWhales = whaleDataset.filter(whale => whale.toLowerCase().startsWith(query));

    autocompleteOptionsList.classList.remove('hidden');
    autocompleteOptionsList.innerHTML = '';  // Clear previous results

    if (filteredWhales.length === 0) {
      const noResults = document.createElement('li');
      noResults.textContent = "No results";
      noResults.classList.add('no-results');
      autocompleteOptionsList.appendChild(noResults);
    } else {
      filteredWhales.forEach(whale => {
        const option = document.createElement('li');  // Create each option
        option.classList.add('autocomplete-option');
        option.textContent = whale;
        option.addEventListener('click', () => {
          el.value = whale;  // Set input value to the selected whale
          autocompleteOptionsList.classList.add('hidden');  // Hide dropdown after selection

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
  if (selectedSpecies === 'All' || !selectedSpecies) {
      return sightings; // Return all sightings if "All" is selected or no species is selected
  }

  return sightings.filter(sighting => sighting.species === selectedSpecies);
}

export { initWhaleSearch };
export { filterWhaleSpecies };
