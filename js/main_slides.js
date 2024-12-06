
function initializeMainSlides({mainMenuEl, popupEl, contributeButtonEl, viewEl, viewBackEl, viewSessionEl, 
  viewButtonEl, viewSessionBack, viewSessionNext, viewSessionID, newSessionEl, newSessionButton, 
  newSessionBack}, eventBus) {

  // Main menu to popup contribute section
  contributeButtonEl.addEventListener("click", () => {
    slideLeft(mainMenuEl, popupEl);
  })

  // Contribute popup to main menu by back button
  popupEl.querySelector('.popup-close-0').addEventListener("click", () => {
    slideRight(popupEl, mainMenuEl);
  })

  // Go back to main menu on submission
  eventBus.addEventListener("response-submitted", () => {
    slideRight(popupEl, mainMenuEl);
  })

  // Main menu to view session
  viewButtonEl.addEventListener("click", () => {

    // TODO: Study if we can skip the session screen if the hash is valid
    // Will also need to manually let the viewSession screen cross from left to right if we do.
    slideLeft(mainMenuEl, viewSessionEl);
  })

  // View to main menu 
  viewBackEl.addEventListener("click", () => {
    slideRight(viewEl, mainMenuEl);
    slideFullRight(viewSessionEl)
  })

  // View session to main menu 
  viewSessionBack.addEventListener("click", () => {
    slideRight(viewSessionEl, mainMenuEl);
  })

  // Needed so that I can remove and add the ability to move to next slide
  function sessionToView() {
    // Dispatch event to load data and load question 1
    const loadDataEvt = new CustomEvent('load-results', { detail: { sessionID: viewSessionID.value }});
            
    console.log("Session Loaded " + viewSessionID.value);
    
    eventBus.dispatchEvent(loadDataEvt);

    slideLeft(viewSessionEl, viewEl);
  }

  // Enable next button only valid Session ID is found
  eventBus.addEventListener("session-found", (e) => {

    if (e.detail.key == "view") {

      // Ungrey the next button
      viewSessionNext.classList.remove("grayout");

      // View session ID to view results
      viewSessionNext.addEventListener("click", sessionToView);
    }
  });

  // Disable next button when session ID is not valid
  eventBus.addEventListener("session-not-found", (e) => {

    if (e.detail.key == "view") {
      // Ungrey the next button
      viewSessionNext.classList.add("grayout");

      viewSessionNext.removeEventListener("click", sessionToView);
    }
  });

  // Main menu to new session
  newSessionButton.addEventListener("click", () => {
    slideLeft(mainMenuEl, newSessionEl);
  });

  // New session to main menu
  newSessionBack.addEventListener("click", () => {
    slideRight(newSessionEl, mainMenuEl);
  });

  // Go back to main menu on creation
  eventBus.addEventListener('creation-submitted', () => {
    slideRight(newSessionEl, mainMenuEl);
  })

}

function slideRight(fromEl, toEl) {

  console.log("Slide right");

  fromEl.classList.add("right");
  fromEl.classList.remove("center");

  toEl.classList.add("center");
  toEl.classList.remove("left");
}

function slideLeft(fromEl, toEl) {

  console.log("Slide left");

  fromEl.classList.add("left");
  fromEl.classList.remove("center");

  toEl.classList.add("center");
  toEl.classList.remove("right");
}

// For moving element from all the way on the left to the right without being seen in the center
// Allows for skipping slides when moving right back to the main menu
async function slideFullRight(el, delay = 1000) {
  // Add hidden during the transition
  el.classList.add("hidden");

  el.classList.remove("left");
  el.classList.add("right");

  // Set timeout to ensure that the el moves all the way before making visible again
  setTimeout(() => el.classList.remove("hidden"), delay);
}

export { initializeMainSlides };
