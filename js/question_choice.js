
// Handles when question is chosen on view screen
function initializeQuestionChoice(changeQnEl, qnMenuEl, allQnChoiceEls, changeQnButtonEl, eventBus) {

  // Text for rendering question
  const questionText = changeQnButtonEl.querySelector("p");

  let qn1Text = "Qn 1: Default Qn1";
  let qn2Text = "Qn 2: Default Qn2";
  let qn3Text = "Qn 3: Default Qn3";

  function fillQuestionChoice(qnChoiceEl) {
    if (qnChoiceEl.value == 1) {
      qnChoiceEl.innerHTML = qn1Text;
    } else if (qnChoiceEl.value == 2) {
      qnChoiceEl.innerHTML = qn2Text;
    } else if (qnChoiceEl.value == 3) {
      qnChoiceEl.innerHTML = qn3Text;
    }
  
    qnChoiceEl.classList.add("view-qn-choice-open");
  }

  // Open qn choice menu
  changeQnEl.addEventListener("click", () => {
    console.log("QUESTION CHANGE MENU");
    qnMenuEl.classList.add("view-change-qn-menu-open");

    allQnChoiceEls.forEach((el) => fillQuestionChoice(el));

  });

  // Dispatch event for when question is chosen
  allQnChoiceEls.forEach((el) => {
    el.addEventListener("click", () => {
      console.log("Chosen Question to view: " + el.value);

      questionText.innerHTML = "";

      // event when question is selected
      const qnChoiceEvt = new CustomEvent('qn-choice', { detail: { qnChosen: el.value }});

      eventBus.dispatchEvent(qnChoiceEvt);

      questionText.value = el.value;
      fillQuestionChoice(questionText);

      // Close qn choice menu
      clearAllQuestionChoices(allQnChoiceEls);
      qnMenuEl.classList.remove("view-change-qn-menu-open");

    });
  });



  // Create listener for sessions
  eventBus.addEventListener('session-found', (evt) => {

    if (evt.detail.key == "view") {
      qn1Text = evt.detail.qn1;
      qn2Text = evt.detail.qn2;
      qn3Text = evt.detail.qn3;
  
      // Fill question 1 first
      questionText.value = 1;
      fillQuestionChoice(questionText);
    }

  });

}

function clearAllQuestionChoices(allQnChoiceEls) {
  allQnChoiceEls.forEach((el) => {
    el.innerHTML = "";
    el.classList.remove("view-qn-choice-open")
  });
}


export { initializeQuestionChoice };