
// Handles when question is chosen on view screen
function initializePopupQuestion(question1El, question2El, question3El, eventBus) {

  // Create listener for sessions
  eventBus.addEventListener('session-found', (evt) => {

    if (evt.detail.key == "popup") {
      question1El.innerHTML = "Q1: " + evt.detail.qn1;
      question2El.innerHTML = "Q2: " + evt.detail.qn2;
      question3El.innerHTML = "Q3: " + evt.detail.qn3;
    }

  });

}


export { initializePopupQuestion };