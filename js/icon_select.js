
// 
function initializeIconSelect(iconContainerEl, eventBus) {
  // Get all icon elements in 
  let icons = iconContainerEl.querySelectorAll('img')

  icons.forEach((iconEl) => initializeIconClick(iconEl, eventBus));

  // Select all text event

}

function initializeIconClick(iconEl, eventBus) {
  // Initialize all icons as greyed out
  iconEl.classList.add("grayout");

  // Event handling when icon is clicked and thus selected
  iconEl.addEventListener('click', () => {

    iconEl.classList.remove("grayout");

    // define a customized event
    const iconClickEvt = new CustomEvent('icon-click', { detail: { iconClicked: iconEl }}); // define your own event

    console.log("Icon clicked " + iconEl);
    
    eventBus.dispatchEvent(iconClickEvt);
  })

  // Event handling when ANOTHER icon is clicked and thus need to grey out
  eventBus.addEventListener('icon-click', (evt) => {

    const iconClicked = evt.detail.iconClicked;

    // If icon is not clicked AND icon is not greyed out, grey it out
    if (iconClicked != iconEl & !iconEl.classList.contains("grayout")) {
      iconEl.classList.add("grayout");
    }
  })
}

export {
  initializeIconSelect,
};