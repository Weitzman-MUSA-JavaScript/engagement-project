
function initializeMainSlides({mainMenuEl, popupEl, contributeButtonEl, viewEl, viewBackEl, viewSessionEl, 
  viewButtonEl, viewSessionBack, viewSessionNext, viewSessionID}, eventBus) {

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

  // View session ID to view results
  viewSessionNext.addEventListener("click", () => {

    // Dispatch event to load data and load question 1
    const loadDataEvt = new CustomEvent('load-results', { detail: { sessionID: viewSessionID.value }});
    const qnChoiceEvt = new CustomEvent('qn-choice', { detail: { qnChosen: 1 }});
      
    console.log("Session Loaded " + viewSessionID.value);
    
    eventBus.dispatchEvent(qnChoiceEvt);
    eventBus.dispatchEvent(loadDataEvt);

    slideLeft(viewSessionEl, viewEl);
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
