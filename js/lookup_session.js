import { debounce } from './debounce.js';
import { getDataFS } from "./firebase.js";
// 
function initializeLookupSession(sessionEl, sessionErrorMsg, key, eventBus) {

  function debouncedLookup() {
    debounce(lookupSession(sessionEl, sessionErrorMsg, key, eventBus), 500); 
  }; // if want to add debounce, need to add it here. wrap up the above function
  

  // console.log(sessionEl);

  // Initialize using hash
  // if (window.location.hash);
  if (window.location.hash !== ""){
    sessionEl.value = window.location.hash.substring(1, window.location.hash.length);
    debouncedLookup();
  };

  sessionEl.addEventListener('input', debouncedLookup);
}

async function lookupSession(sessionEl, sessionErrorMsg, key, eventBus) {
  let enteredSessionID = sessionEl.value;

  // Check firestore for session ID
  const sessionsRaw = await getDataFS("session-collection");
  const sessions = sessionsRaw.map((e) => e.sessionID);
  const sessionFound = sessions.find((e) => e.sessionID == enteredSessionID);

  console.log(sessions)

  if (sessionFound !== undefined) {

    // session found and dispatch event to generate the qr code
    const sessionFound = new CustomEvent('session-found', { detail: { 
      sessionID : enteredSessionID, 
      key: key }});
  
    eventBus.dispatchEvent(sessionFound);

    sessionErrorMsg.innerHTML = "";
  } else {
    sessionErrorMsg.innerHTML = "SESSION ID NOT FOUND"; 

    const sessionNotFound = new CustomEvent('session-not-found', { detail: { sessionID : enteredSessionID, key: key }});

    eventBus.dispatchEvent(sessionNotFound);
  }

  console.log("LOOK UP EVENT");
}



export {
  initializeLookupSession,
};