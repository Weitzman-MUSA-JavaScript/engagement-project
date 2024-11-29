
function initializePopupSlides(popupEl, eventBus) {

  let slideNumbers = [0,1,2,3,4];

  // Load all popup slides onto the array
  let popupSlides = slideNumbers.map((slideNumber) => popupEl.querySelector('.popup-slide-' + slideNumber));

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

  // Enable all back buttons
  [1,2,3,4].forEach((slideNumber) => {
    // Add listener for back button
    popupEl.querySelector('.popup-back-' + slideNumber).addEventListener("click", () => {
      backSlide(slideNumber);
      //console.log(popupSlides);
    })
  });

  // Grey out next buttons initially
  [1,2,3].forEach((buttonNum) => popupEl.querySelector('.popup-next-' + buttonNum).classList.add("grayout"));

  // TESTING Enable first next button 
  popupEl.querySelector('.popup-next-0').addEventListener("click", () => {
    nextSlide(0);
    //console.log(popupSlides);
  })

  // Enable next button only when question is answered. Only for slides 1,2,3 which have maps
  eventBus.addEventListener("map-click", (evt) => {

    // Ungrey the next button
    popupEl.querySelector('.popup-next-' + evt.detail.qn).classList.remove("grayout");

    popupEl.querySelector('.popup-next-' + evt.detail.qn).addEventListener("click", () => {
      nextSlide(evt.detail.qn);
      //console.log(popupSlides);
    })
  })

  // Enable close button
  popupEl.querySelector('.popup-close-0').addEventListener("click", () => {
    closePopup(popupEl);
    //console.log(popupSlides);
  })

}

function openPopup(popupEl){
  popupEl.classList.add("open-popup");
}

function closePopup(popupEl){
  popupEl.classList.remove("open-popup");
}

export { initializePopupSlides, openPopup, closePopup };
