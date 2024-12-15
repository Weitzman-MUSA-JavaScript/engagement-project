// This is the main script for the projects page.
import { loadProjectsData } from './projects_data.js';
import { initProjectsSelect } from './projects_select.js';

// Load projects data
const projectsData = await loadProjectsData();

// Create project list items
const projectsListItems = {};
function initListItems() {
  for (const project of projectsData) {
    const listItem = document.createElement('li');
    listItem.className = 'project-item';
    listItem.setAttribute('data-project-id', project.id);

    // Create the list item content
    listItem.innerHTML = `
      <div class="project-cover-container">
        <img src="${project.folder}/cover.jpg" class="project-cover" alt="${project.title} Cover">
      </div>

      <div class="project-details">
        <div class="line-one">
          <span class="project-number">${project.number}</span>
          <span class="project-title">${project.title}</span>
        </div>
        <div class="line-two">
          <span class="project-type">${project.type}</span>
          <span class="project-keyword">${project.keyword}</span>
          <span class="project-time">${project.time}</span>
        </div>
        <div class="line-three">
          <span class="project-description">${project.description}</span>
        </div>
      </div>
    `;

    // Add the list item to the list
    projectsListItems[project.id] = listItem;
  }
}
initListItems();
console.log(projectsListItems); // Print the list items

// Initialize the selected projects list
const projectsListEl = document.querySelector('#projects-list');
initProjectsSelect(projectsListEl, projectsListItems, projectsData);

// Control the maximum height of the project details manually after the page is loaded
window.addEventListener('load', () => {
  const projectItems = document.querySelectorAll('.project-item');

  projectItems.forEach((item, index) => {
    const coverPart = item.querySelector('.project-cover-container');
    const detailsPart = item.querySelector('.project-details');

    if (!coverPart || !detailsPart) {
      console.warn(`Missing elements for index ${index}`);
      return;
    }

    // Get the height of the cover and details parts
    const coverHeight = coverPart.offsetHeight;
    const detailsHeight = detailsPart.scrollHeight;

    console.log(`Cover Part ${index} - Height: ${coverHeight}`);
    console.log(`Details Part ${index} - Height: ${detailsHeight}`);

    // Set the max height of the details part depending on the cover part
    if (detailsHeight > coverHeight) {
      detailsPart.style.maxHeight = `${coverHeight}px`; // Limit the max height
      detailsPart.style.overflowY = 'auto'; // Enable the scroll bar
    } else {
      detailsPart.style.maxHeight = 'none'; // Set back to default
      detailsPart.style.overflowY = 'hidden'; // Disable the scroll bar
    }
  });

  // Display the page after it is loaded
  document.body.classList.add('loaded'); // Add the loaded class to the body
});
