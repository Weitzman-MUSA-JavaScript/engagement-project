
// Controls the little popup that comes up when response submitted 
function initializeSubmissionPopup(submissionPopupEl, eventBus) {
  
  eventBus.addEventListener('response-submitted', () => {
    // Make popup come down
    submissionPopupEl.classList.remove("submit-slide-top");

    console.log("MOVE SUBMISSION DOWN");

    // Move popup back up
    setTimeout(() => {submissionPopupEl.classList.add("submit-slide-top")}, 2000);
  });
}


export {
  initializeSubmissionPopup,
};