import { addDataFS } from "./firebase.js";

// Save data from submission data
function initializeResponseStorage(submitButtonEl, eventBus) {
  // Get all icon elements in 
  //sessionStorage.setItem("key", "value");
  
  let userResponse = {
    sessionID: null,
    ans1: null,
    ans2: null,
    ans3: null,
    username: null,
    icon: null
  }

  let submissionLocked = false;

  function submitResponse() {
    if (!submissionLocked) {
      submissionLocked = true;
      addDataFS("user-responses", {response: JSON.stringify(userResponse)});

      // response submitted to firebase
      const responseSubmitted = new CustomEvent('response-submitted');
      
      eventBus.dispatchEvent(responseSubmitted);

      // Unlock after 5s
      setTimeout(() => submissionLocked = false, 5000);
    }
  }

  function checkSubmissionReady() {

    if ( userResponse.sessionID !== null 
      && userResponse.ans1 !== null 
      && userResponse.ans2 !== null 
      && userResponse.ans3 !== null 
      && userResponse.username !== null 
      && userResponse.username !== "" 
      && userResponse.icon !== null ) {
        submitButtonEl.classList.remove("grayout");

        // Enable submission
        submitButtonEl.addEventListener("click", submitResponse)

      } else {
        submitButtonEl.classList.add("grayout");

        // Disable submission
        submitButtonEl.addEventListener("click", submitResponse)
      }
  }

  

  eventBus.addEventListener("session-selected", (evt) => {
    userResponse.sessionID = evt.detail.sessionID;

    console.log(userResponse)

    checkSubmissionReady();
  })

  eventBus.addEventListener("map-click", (evt) => {
    userResponse["ans" + evt.detail.qn] = {lat: evt.detail.lat, lon: evt.detail.lon};

    console.log(userResponse);

    checkSubmissionReady();
  })

  // Username entered
  eventBus.addEventListener("username-entered", (evt) => {
    userResponse.username = evt.detail.username;

    console.log(userResponse);
    
    checkSubmissionReady();
  })


  // Icon choice
  eventBus.addEventListener("icon-click", (evt) => {
    userResponse.icon = evt.detail.iconClicked.id;

    console.log(userResponse)
    
    checkSubmissionReady();
  })
}

export {
  initializeResponseStorage,
};