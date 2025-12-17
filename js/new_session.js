import { getDataFS, addDataFS } from "./firebase.js";
import { debounce } from "./debounce.js";

// Save data from submission data
function initializeNewSessionCreator(newSessionEl, eventBus) {

  let submissionLocked = false;

  const allQns = [newSessionEl.querySelector(".new-qn1"), 
                  newSessionEl.querySelector(".new-qn2"), 
                  newSessionEl.querySelector(".new-qn3")];

  const createButton = newSessionEl.querySelector(".new-session-create");

  // Final submission to create a new session
  function createSession() {
    if (!submissionLocked) {
      submissionLocked = true;

      generateNewSessionID().then((newSessionID) => {
        addDataFS("session-collection", {
          sessionID: String(newSessionID),
          qn1: allQns[0].value,
          qn2: allQns[1].value,
          qn3: allQns[2].value,
        });

        // response submitted to firebase
        const creationSubmitted = new CustomEvent('creation-submitted');

        // Update hash
        window.location.hash = newSessionID;
        
        eventBus.dispatchEvent(creationSubmitted);

        setTimeout(() => submissionLocked = false, 5000);
      })

      

      
    }
  }

  // Check if ready to create
  function checkCreationReady() {

    if ( allQns[0].value !== null 
      && allQns[1].value !== null 
      && allQns[2].value !== null
      && allQns[0].value !== "" 
      && allQns[1].value !== "" 
      && allQns[2].value !== "") {
        console.log("CREATION READY")
        // console.log(allQns[0].value);
        createButton.classList.remove("grayout");

        // Enable submission
        createButton.addEventListener("click", createSession)

      } else {
        createButton.classList.add("grayout");

        // Disable submission
        createButton.addEventListener("click", createSession)
      }
  }

  allQns.forEach((el) => {
    el.addEventListener("input", () => debounce(checkCreationReady()));
  })
  

}

async function generateNewSessionID() {
  const sessionsRaw = await getDataFS("session-collection");
  const sessions = sessionsRaw.map((e) => {
    if ( Number.isInteger(Number(e.sessionID)) ) {
      return( Number(e.sessionID) );
    } else {
      return( 0 );
    }
  });

  return(Math.max(...sessions) + 2);
}

export {
  initializeNewSessionCreator,
};