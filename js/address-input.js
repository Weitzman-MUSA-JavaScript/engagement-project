import { debounce } from './debounce.js';

// const addressEntry = document.querySelector('#entry');
// const addressChoiceList = document.querySelector(`#address-choices`);

function initializeAddressEntry(addressEntryEl, addressChoiceListEl, questionNumber, eventBus) {

  function debouncedAddressEntry() {
    debounce(handleAddressEntryChange(addressEntryEl, addressChoiceListEl, questionNumber, eventBus), 500); // should be in this format because I need to control what event in events; this wil "clean" the 'input' event input and use the later click event in the functions below
  }; // if want to add debounce, need to add it here. wrap up the above function
  
  addressEntryEl.addEventListener('input', debouncedAddressEntry);

  // Select all text event
  addressEntryEl.addEventListener('click', () => {
    addressEntryEl.select();
  });
}

// mapbox api
async function handleAddressEntryChange(addressEntry, addressChoiceList, questionNumber, eventBus) { // await fetch should always be in async function
  addressChoiceList.classList.remove('hidden'); // First remove the hidden style of ol
  console.log('handling address change');
  const partialAddress = addressEntry.value; // .value gets the text of the entry
  const apiKey = 'pk.eyJ1IjoianVueWl5IiwiYSI6ImNsbm03NGszNDFrbHgybW1uZXBrMTMwZ3EifQ.VJyFnRhnQtJ9yU5gl0SdoA';
  const bbox = [-75.3002, 39.8544, -74.9995, 40.0649].join(',');
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${partialAddress}.json?&access_token=${apiKey}`; // use ``

  // remove the ol style when there is no input
  // have this before the fetch data from API to save energy from fetching empty data
  if (partialAddress == ``) {
    addressChoiceList.classList.add('hidden'); // add a hidden label to "remove", style hidden in CSS
    return;
  }

  const resp = await fetch(url); // use the url above to get a response
  const data = await resp.json(); // get data from reponse

  let html = '';
  for (const feature of data.features) { // .feature is just select json contents to have an array
    const lihtml = `
    <li data-lat="${feature.center[1]}" data-lon="${feature.center[0]}">
      ${feature.place_name}
    </li>
    `;
    html += lihtml;
  }
  addressChoiceList.innerHTML = html;

  // this part handles click event
  const choices = addressChoiceList.querySelectorAll('li'); // select all the children of address choice list that match li
  for (const choice of choices) {
    choice.addEventListener('click', (locationChoice) => {
      handleAddressChoice(addressEntry, addressChoiceList, locationChoice, questionNumber, eventBus);
    });
  }
}

function handleAddressChoice(addressEntry, addressChoiceList, locationChoice, questionNumber, eventBus) {
  const li = locationChoice.target; // .target is just get the object you click
  
  console.log(li);
  
  const lat = li.getAttribute('data-lat'); // This will always be string, not numbers
  const lon = li.getAttribute('data-lon');
  // const lon = li.dataset.data-lon; // .dataset is get the attribute in html (get your customized attribute!)

  // put the click selection text to the input box
  const text = li.innerText; // .innerText is similar to innerHTML but only get the text content
  addressEntry.value = text;
  addressChoiceList.classList.add('hidden'); // hide the list

  // handles when address is entered onto searchbar
  const addressLL = new CustomEvent('address-zoom-map-'+questionNumber, { detail: { coordinates: [lat, lon] }}); 
  
  console.log("CHOSEN " + lat + " and " + lon + " for " + questionNumber);
  
  eventBus.dispatchEvent(addressLL);
}

export {
  initializeAddressEntry,
};