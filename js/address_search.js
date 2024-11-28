import { htmlToElement } from './dom_utils.js';
import _debounce from 'https://esm.run/lodash/debounce';

function initAddressSearch(el, events) {
  const mapboxKey = 'pk.eyJ1IjoiZW16aG91IiwiYSI6ImNtMG9henVrdjA2bGwya3EwNWh6OGh1emgifQ.d2Xo2TLSYAGCMqvccySJSA';
  const autocompleteOptionsList = document.createElement('ol');
  autocompleteOptionsList.classList.add('autocomplete-options');
  el.after(autocompleteOptionsList);

  async function showAutocompleteOptions() {
    const query = el.value;
    const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${query}&access_token=${mapboxKey}&bbox=-73.4377,42.7195,-71.4660,45.0101&types=place,neighborhood,address,street`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const places = data.features;

      autocompleteOptionsList.classList.remove('hidden');
      autocompleteOptionsList.innerHTML = '';

      for (const place of places) {
        const option = htmlToElement(`
          <li class="autocomplete-option">
            ${place.properties.full_address}
          </li>
        `);
        option.addEventListener('click', () => {
          // Create a custom feature, so that we're not tied to the mapbox format.
          const feature = {
            type: 'Feature',
            geometry: place.geometry,
            properties: {
              name: place.properties.name_preferred,
              address: place.properties.full_address,
            },
          };
          const autocompleteEvt = new CustomEvent('autocompleteselected', { detail: feature });
          events.dispatchEvent(autocompleteEvt);

          const manualAdjustEvt = new CustomEvent('manualadjust', { detail: place.geometry.coordinates });
          events.dispatchEvent(manualAdjustEvt);

          el.value = place.properties.full_address;
          autocompleteOptionsList.classList.add('hidden');
        });
        autocompleteOptionsList.appendChild(option);
      }
    } catch (error) {
      console.error(error);
    }
  }

  el.addEventListener('input', _debounce(showAutocompleteOptions, 500));
}

export { initAddressSearch };
