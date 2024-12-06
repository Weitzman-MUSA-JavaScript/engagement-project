
// Controls the little popup that comes up when response submitted 
function initializeCreationPopup(creationPopupEl, eventBus) {
  
  eventBus.addEventListener('creation-submitted', () => {
    // Make popup come down
    creationPopupEl.classList.remove("submit-slide-top");

    console.log("MOVE CREATION SLIDE DOWN");

    // Move popup back up
    setTimeout(() => {creationPopupEl.classList.add("submit-slide-top")}, 1500);
  });
}


export {
  initializeCreationPopup,
};