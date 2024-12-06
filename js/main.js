// Maybe remove the -compat
import { initializeMap } from "./create_map.js";
import { initializePopupSlides} from "./popup_slides.js";
import { initializeIconSelect} from "./icon_select.js";
import { initializeAddressEntry } from "./address-input.js";
import { initializeResponseStorage } from "./response_handler.js";
import { initializeQR } from "./qr_builder.js";
import { initializeLookupSession } from "./lookup_session.js";
import { initializeUsernameEntry } from "./username_entry.js";
import { initializeMainSlides } from "./main_slides.js";
import { initializeQuestionChoice } from "./question_choice.js";
import { initializeMapView } from "./create_map_view.js";
import { initializeNewSessionCreator } from "./new_session.js";
import { initializePopupQuestion } from "./popup_questions.js";
import { initializeSubmissionPopup } from "./submission_response.js";
import { initializeCreationPopup } from "./creation_response.js";
// Event bus
const eventBus = new EventTarget(); 


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
                      viewSessionID: document.querySelector(".view-session .session-id-input"),
                      newSessionEl: document.querySelector(".new-session"),
                      newSessionButton: document.querySelector(".mm-new-session-button"),
                      newSessionBack: document.querySelector(".new-session-back"),
                    },
                     eventBus);

// POPUP / RESPONSE FORM SECTION: 

// Initialize logic for moving between popup slides
initializePopupSlides(document.querySelector(".popup"), eventBus);

// Initialize maps and search boxes on all slides
[1,2,3].forEach((questionNumber) => {
  initializeMap(document.querySelector("#map-" + questionNumber), eventBus, questionNumber);
  initializeAddressEntry(document.querySelector("#popup-search-bar-" + questionNumber), 
                         document.querySelector("#popup-search-dropdown-"  + questionNumber), 
                         questionNumber,
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
             "popup",
             eventBus);

// Initialize component to look up session ID on firebase
initializeLookupSession(document.querySelector(".session-id-input"),
                        document.querySelector(".session-error-msg"),
                        "popup",
                        eventBus);

// Initialize loading questions when session found
initializePopupQuestion(document.querySelector(".popup-qn1"),
                        document.querySelector(".popup-qn2"),
                        document.querySelector(".popup-qn3"),
                        eventBus);

initializeSubmissionPopup(document.querySelector(".submit-slide"), eventBus);

// VIEW RESULTS SECTION:

// Initialize QR code for view results menu
initializeQR(document.querySelector(".view-session .qr-code"), 
             document.querySelector(".view-session .qr-container"),
             "view",
             eventBus);

// Initialize component to look up session ID on firebase for view results menu
initializeLookupSession(document.querySelector(".view-session .session-id-input"),
                        document.querySelector(".view-session .session-error-msg"),
                        "view",
                        eventBus);

// Handle question choice event
initializeQuestionChoice(document.querySelector(".change-qn-button"),
                         document.querySelector(".view-change-qn-menu"),
                         document.querySelectorAll(".view-qn-choice"), 
                         document.querySelector(".change-qn-button"),
                         eventBus);

// Create map for result viewing
initializeMapView(document.querySelector("#map-view"), eventBus)

// Allow zooming for map for result viewing
initializeAddressEntry(document.querySelector("#popup-search-bar-view"), 
                       document.querySelector("#popup-search-dropdown-view"), 
                       "view",
                        eventBus);

// NEW SESSION SECTION:

initializeNewSessionCreator(document.querySelector(".new-session"), eventBus);

initializeCreationPopup(document.querySelector(".create-slide"), eventBus);
