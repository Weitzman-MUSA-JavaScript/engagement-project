function initializeQR(qrEl, qrContainer, sessionEl, eventBus) {

  // Generate QR code at qrEl
  function generateQR(sessionID) {
    new QRCode(qrEl, {
      text: 'http://127.0.0.1:3000/#' + sessionID,
      width: 175,
      height: 175,
      colorDark : '#262626',
      colorLight : '#fff',
      correctLevel : QRCode.CorrectLevel.H
    });
  }


  qrContainer.classList.add("hidden");

  eventBus.addEventListener("session-found", (evt) => {
    generateQR(evt.detail.sessionID);
    qrContainer.classList.remove("hidden");
  });
  eventBus.addEventListener("session-not-found", () => {
    qrEl.innerHTML = "";
    qrContainer.classList.add("hidden");
  });
}



export {
  initializeQR,
};