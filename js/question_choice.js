
// Handles when question is chosen on view screen
function initializeQuestionChoice(changeQnEl, qnMenuEl, allQnChoiceEls, changeQnButtonEl, eventBus) {

  // Text for rendering question
  const questionText = changeQnButtonEl.querySelector("p");

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

      questionText.value = el.value;
      fillQuestionChoice(questionText);

      // Close qn choice menu
      clearAllQuestionChoices(allQnChoiceEls);
      qnMenuEl.classList.remove("view-change-qn-menu-open");

    });
  });

  // Fill question 1 first
  questionText.value = 1;
  fillQuestionChoice(questionText);

}

function fillQuestionChoice(qnChoiceEl) {
  if (qnChoiceEl.value == 1) {
    qnChoiceEl.innerHTML = "Qn 1: Where's your favourite singer from?";
  } else if (qnChoiceEl.value == 2) {
    qnChoiceEl.innerHTML = "Qn 2: Where would you like to live if money was no concern?";
  } else if (qnChoiceEl.value == 3) {
    qnChoiceEl.innerHTML = "Qn 3: What's your favourite place in Philadelphia?";
  }

  qnChoiceEl.classList.add("view-qn-choice-open");
}

function clearAllQuestionChoices(allQnChoiceEls) {
  allQnChoiceEls.forEach((el) => {
    el.innerHTML = "";
    el.classList.remove("view-qn-choice-open")
  });
}


export { initializeQuestionChoice };