// Maybe remove the -compat
import { initializeMap } from "./create_map.js";
import { initializeHist } from "./chart.js";
import { getData } from "./data_cleaning.js";
import { initializePopupSlides, openPopup, closePopup } from "./popup_slides.js";
import { initializeList } from "./neighborhood_list.js";
import { initializeMapRendering } from "./map_rendering.js";
import { initializeStatDisplay } from "./stat_displaying.js";
import { initializeIconSelect} from "./icon_select.js";
import { initializeAddressEntry } from "./address-input.js";
import { initializeResponseStorage } from "./response_handler.js";
import { initializeQR } from "./qr_builder.js";
import { app, db, getDataFS, addDataFS } from "./firebase.js";
import { initializeLookupSession } from "./lookup_session.js";
// Event bus
const eventBus = new EventTarget(); 

// Construct map
// const mapEl = document.querySelector(".map");
// const map = initMap(mapEl);

// const test = await getDataFS();

// addDataFS("testy1", "testy2");

// Process data
// const {data, dataGeoJSON, neighborhoods} = await getData();

// Initialize search box
// initializeAddressEntry();

// Create neighborhood list
// initializeList(neighborhoods, evt));

// Initialize map point rendering
// initializeMapRendering(dataGeoJSON, map, evt);

let popupEl = document.querySelector(".popup");

initializePopupSlides(popupEl, eventBus);



document.querySelector(".popup-button").addEventListener("click", () => {
  openPopup(popupEl);
})

openPopup(popupEl);

// Initialize maps and search boxes on all slides
[1,2,3].forEach((questionNumber) => {
  initializeMap(document.querySelector("#map-" + questionNumber), eventBus, questionNumber);
  initializeAddressEntry(document.querySelector("#popup-search-bar-" + questionNumber), 
                         document.querySelector("#popup-search-dropdown-"  + questionNumber), 
                         eventBus);
})

// Initialize icon select
initializeIconSelect(document.querySelector(".popup-icon-container"), eventBus)

// Initialize response saving
initializeResponseStorage(document.querySelector(".popup-submit"), eventBus);

// Initialize QR code
initializeQR(document.querySelector(".qr-code"), 
             document.querySelector(".qr-container"),
             document.querySelector(".session-id-input"),
             eventBus);

// Initialize component to look up session ID on firebase
initializeLookupSession(document.querySelector(".session-id-input"),
                        document.querySelector(".session-error-msg"),
                        eventBus)
