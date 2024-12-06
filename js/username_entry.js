import { debounce } from "./debounce.js";
// 
function initializeUsernameEntry(usernameEl, eventBus) {
  
  usernameEl.addEventListener('input', () => debounce(handleUsernameEntry(usernameEl.value, eventBus), 500));
}

function handleUsernameEntry(username, eventBus) {

  // event when username is entered
  const usernameEntryEvt = new CustomEvent('username-entered', { detail: { username: username }});

  console.log("Username entered " + username);
  
  eventBus.dispatchEvent(usernameEntryEvt);
}

export {
  initializeUsernameEntry,
};