function initializeQR(qrEl, qrContainer, key, eventBus) {

  // Generate QR code at qrEl
  function generateQR(sessionID) {
    new QRCode(qrEl, {
      text: 'https://theta1112.github.io/engagement-project/#' + sessionID,
      width: 175,
      height: 175,
      colorDark : '#262626',
      colorLight : '#fff',
      correctLevel : QRCode.CorrectLevel.H
    });
  }

  eventBus.addEventListener("session-found", (evt) => {
    if (evt.detail.key == key) {
      qrEl.innerHTML = "";
      generateQR(evt.detail.sessionID);
      console.log(qrContainer);
      qrContainer.classList.remove("hidden");
    }

  });

  eventBus.addEventListener("session-not-found", (evt) => {
    if (evt.detail.key == key) {
      qrEl.innerHTML = "";
      qrContainer.classList.add("hidden");
    }
  });
}



export {
  initializeQR,
};