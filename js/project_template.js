import { loadProjectPage } from './project_page.js';

// The function to dynamically load the project page contents
loadProjectPage();

// Display the page after it is loaded
window.addEventListener('load', () => {
  document.body.classList.add('loaded'); // Add the loaded class to the body
});
