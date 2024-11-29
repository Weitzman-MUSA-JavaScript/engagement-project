
// Save data from submission data
function initializeResponseStorage(submitButtonEl, eventBus) {
  // Get all icon elements in 
  //sessionStorage.setItem("key", "value");
  
  let userResponse = {
    ans1: null,
    ans2: null,
    ans3: null,
    icon: null
  }

  eventBus.addEventListener("map-click", (evt) => {
    userResponse["ans" + evt.detail.qn] = {lat: evt.detail.lat, lon: evt.detail.lon};

    console.log(userResponse)

    if (checkSubmissionReady(userResponse)) {
      submitButtonEl.classList.remove("grayout");
    }
  })

  // Icon choice
  eventBus.addEventListener("icon-click", (evt) => {
    userResponse.icon = evt.detail.iconClicked.id;

    console.log(userResponse)
    
    if (checkSubmissionReady(userResponse)) {
      submitButtonEl.classList.remove("grayout");
    }
  })
}

function checkSubmissionReady(userResponse) {
  return( userResponse.ans1 !== null 
    & userResponse.ans2 !== null 
    & userResponse.ans3 !== null 
    & userResponse.icon !== null ) 
}

export {
  initializeResponseStorage,
};