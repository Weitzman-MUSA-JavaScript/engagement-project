import { debounce } from './debounce.js';
import { getDataFS } from "./firebase.js";
// 
function initializeLookupSession(sessionEl, sessionErrorMsg, eventBus) {

  function debouncedLookup() {
    debounce(lookupSession(sessionEl, sessionErrorMsg, eventBus), 500); 
  }; // if want to add debounce, need to add it here. wrap up the above function
  

  console.log(sessionEl);

  // Initialize using hash
  // if (window.location.hash);
  if (window.location.hash !== ""){
    sessionEl.value = window.location.hash.substring(1, window.location.hash.length);
    debouncedLookup();
  };


  sessionEl.addEventListener('input', debouncedLookup);
}

async function lookupSession(sessionEl, sessionErrorMsg, eventBus) {
  let enteredSessionID = sessionEl.value;

  // Check firestore for session ID
  const sessionsRaw = await getDataFS("session-collection");
  const sessions = sessionsRaw.map((e) => e.sessionID);

  if (sessions.includes(enteredSessionID)) {
    // session found and dispatch event to generate the qr code
    const sessionFound = new CustomEvent('session-found', { detail: { sessionID : enteredSessionID }});
  
    eventBus.dispatchEvent(sessionFound);

    sessionErrorMsg.innerHTML = "";
  } else {
    sessionErrorMsg.innerHTML = "SESSION ID NOT FOUND"; 

    const sessionNotFound = new CustomEvent('session-not-found', { detail: { sessionID : enteredSessionID }});

    eventBus.dispatchEvent(sessionNotFound);
  }

  console.log("LOOK UP EVENT");
}



export {
  initializeLookupSession,
};