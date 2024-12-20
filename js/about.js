// Add a click event to show the resume when the button is clicked
const button = document.querySelector('.view-resume-button');
const popupOverlay = document.getElementById('popup-overlay');

button.addEventListener('click', () => {
  popupOverlay.style.display = 'flex';
});

// Hide the resume when clicking outside the image
popupOverlay.addEventListener('click', (event) => {
  if (event.target === popupOverlay) {
    popupOverlay.style.display = 'none';
  }
});

// Display the page after it is loaded
window.addEventListener('load', () => {
  document.body.classList.add('loaded'); // Add the loaded class to the body
});
