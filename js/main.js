// Maybe remove the -compat
import { initializeMap } from "./create_map.js";
// import { initializeHist } from "./chart.js";
// import { getData } from "./data_cleaning.js";
import { initializePopupSlides} from "./popup_slides.js";
// import { initializeList } from "./neighborhood_list.js";
// import { initializeMapRendering } from "./map_rendering.js";
// import { initializeStatDisplay } from "./stat_displaying.js";
import { initializeIconSelect} from "./icon_select.js";
import { initializeAddressEntry } from "./address-input.js";
import { initializeResponseStorage } from "./response_handler.js";
import { initializeQR } from "./qr_builder.js";
// import { getDataFS, addDataFS } from "./firebase.js";
import { initializeLookupSession } from "./lookup_session.js";
import { initializeUsernameEntry } from "./username_entry.js";
import { initializeMainSlides } from "./main_slides.js";
import { initializeQuestionChoice } from "./question_choice.js";
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

// Initialize logic for navigation between main slides 
initializeMainSlides({mainMenuEl: document.querySelector(".main-menu"),
                      popupEl: document.querySelector(".popup"),
                      contributeButtonEl: document.querySelector(".mm-contribute-button"),
                      viewEl: document.querySelector(".view-results"),
                      viewSessionEl: document.querySelector(".view-session"),
                      viewButtonEl: document.querySelector(".mm-view-results-button"),
                      viewBackEl: document.querySelector(".view-back"),
                      viewSessionBack: document.querySelector(".view-session-back"),
                      viewSessionNext: document.querySelector(".view-session-next"),
                    },
                     eventBus);

// POPUP / RESPONSE FORM SECTION: 

// Initialize logic for moving between popup slides
initializePopupSlides(document.querySelector(".popup"), eventBus);

// Initialize maps and search boxes on all slides
[1,2,3, "view"].forEach((questionNumber) => {
  initializeMap(document.querySelector("#map-" + questionNumber), eventBus, questionNumber);
  initializeAddressEntry(document.querySelector("#popup-search-bar-" + questionNumber), 
                         document.querySelector("#popup-search-dropdown-"  + questionNumber), 
                         eventBus);
})

// Initialize username entry
initializeUsernameEntry(document.querySelector(".username-input"), eventBus);

// Initialize icon select
initializeIconSelect(document.querySelector(".popup-icon-container"), eventBus);

// Initialize response saving
initializeResponseStorage(document.querySelector(".popup-submit"), eventBus);

// Initialize QR code
initializeQR(document.querySelector(".popup .qr-code"), 
             document.querySelector(".popup .qr-container"),
             eventBus);

// Initialize component to look up session ID on firebase
initializeLookupSession(document.querySelector(".session-id-input"),
                        document.querySelector(".session-error-msg"),
                        eventBus);

// VIEW RESULTS SECTION:

// Initialize QR code for view results menu
initializeQR(document.querySelector(".view-session .qr-code"), 
             document.querySelector(".view-session .qr-container"),
             eventBus);

// Initialize component to look up session ID on firebase for view results menu
initializeLookupSession(document.querySelector(".view-session .session-id-input"),
                        document.querySelector(".view-session .session-error-msg"),
                        eventBus);

// Handle question choice event
initializeQuestionChoice(document.querySelector(".change-qn-button"),
                         document.querySelector(".view-change-qn-menu"),
                         document.querySelectorAll(".view-qn-choice"), 
                         document.querySelector(".change-qn-button"),
                         eventBus);
