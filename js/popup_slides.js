
function initializePopupSlides(popupEl, eventBus) {

  // All slide numbers in the popup
  let slideNumbers = [0,1,2,3,4];

  // Load all popup slides onto the array
  let popupSlides = slideNumbers.map((slideNumber) => popupEl.querySelector('.popup-slide-' + slideNumber));

  // Stored sessionID for dispatching when initial popup window confirms the session
  let sessionID = null;

  // Controls which slide should go into center
  // The slidenumber corresponds to the slide that the "Next" button is on
  function nextSlide(slideNumber){

      if (slideNumber === popupSlides.length) {
          return;
      }

      // Send next slide to center
      popupSlides[slideNumber + 1].classList.add("popup-slide-center");
      popupSlides[slideNumber + 1].classList.remove("popup-slide-right");
      
      // Send slideNumber slide to left
      popupSlides[slideNumber].classList.remove("popup-slide-center");
      popupSlides[slideNumber].classList.add("popup-slide-left");
  }

  // Controls which slide should go into center
  // The slidenumber corresponds to the slide that the "Back" button is on
  function backSlide(slideNumber){

      if (slideNumber == 0) {
          return;
      }

      // Send previous slide to center
      popupSlides[slideNumber-1].classList.add("popup-slide-center");
      popupSlides[slideNumber-1].classList.remove("popup-slide-left");
      
      // Send slideNumber slide to right
      popupSlides[slideNumber].classList.remove("popup-slide-center");
      popupSlides[slideNumber].classList.add("popup-slide-right");
  }

  // Enable next slide for just the initial slide 0 next when valid session ID is provided
  // Special case for to allow for adding and removing the event listener.
  // Also triggers the event recording the session id
  function nextSlide0(){
    nextSlide(0);

    // session ID is confirmed and locked in
    const sessionSelected = new CustomEvent('session-selected', { detail: { sessionID: sessionID }});

    console.log("session ID selected " + sessionID);
    
    eventBus.dispatchEvent(sessionSelected);
  }

  function fullReset(delay = 1000){
    // Hide all slides temporarily
    setTimeout(() => {
      popupSlides.forEach((slideEl) => slideEl.classList.add("hidden"))
    
      // Remove either left or center
      popupSlides[0].classList.remove("popup-slide-left");
      popupSlides[1].classList.remove("popup-slide-left");
      popupSlides[2].classList.remove("popup-slide-left");
      popupSlides[3].classList.remove("popup-slide-left");
      popupSlides[4].classList.remove("popup-slide-center");

      // Set back to initial state
      popupSlides[0].classList.add("popup-slide-center");
      popupSlides[1].classList.add("popup-slide-right");
      popupSlides[2].classList.add("popup-slide-right");
      popupSlides[3].classList.add("popup-slide-right");
      popupSlides[4].classList.add("popup-slide-right");


      popupSlides.forEach((slideEl) => slideEl.classList.remove("hidden"))
    }, delay);

    console.log("RESET")
  }

  // Enable all back buttons
  [1,2,3,4].forEach((slideNumber) => {
    // Add listener for back button
    popupEl.querySelector('.popup-back-' + slideNumber).addEventListener("click", () => {
      backSlide(slideNumber);
      //console.log(popupSlides);
    })
  });

  // Grey out next buttons initially
  [0,1,2,3].forEach((buttonNum) => popupEl.querySelector('.popup-next-' + buttonNum).classList.add("grayout"));

  // TESTING Enable first next button 
  

  // Enable next button only valid Session ID is found
  eventBus.addEventListener("session-found", (e) => {

    if (e.detail.key == "popup") {
      // Record session ID found
      sessionID = e.detail.sessionID;

      // Ungrey the next button
      popupEl.querySelector('.popup-next-0').classList.remove("grayout");

      popupEl.querySelector('.popup-next-0').addEventListener("click", nextSlide0);
    }

  });

  // Disable next button when session ID is not valid
  eventBus.addEventListener("session-not-found", (e) => {

    if (e.detail.key == "popup") {
      // Ungrey the next button
      popupEl.querySelector('.popup-next-0').classList.add("grayout");

      popupEl.querySelector('.popup-next-0').removeEventListener("click", nextSlide0);
    }
    
  });

  // Enable next button only when question is answered. Only for slides 1,2,3 which have maps
  eventBus.addEventListener("map-click", (evt) => {

    // Ungrey the next button
    popupEl.querySelector('.popup-next-' + evt.detail.qn).classList.remove("grayout");

    popupEl.querySelector('.popup-next-' + evt.detail.qn).addEventListener("click", () => {
      nextSlide(evt.detail.qn);
      //console.log(popupSlides);
    })
  })

  // Reset pop up slides on form submission
  eventBus.addEventListener("response-submitted", () => {
    fullReset();
  })

}

export { initializePopupSlides };
