// This is the main script for the comments page.
import { loadProjectsData } from './projects_data.js';
import { initProjectsSelect } from './projects_select.js';
import { loadComments } from './comments_load.js';
import { commentsControl } from './comments_control.js';

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
      <div class="project-part">
        <div class="project-cover-container">
          <img src="${project.folder}/cover.jpg" class="project-cover" alt="${project.title} Cover">
        </div>
        <div class="project-title-container">
          <div class="project-info">
            <span class="project-number">${project.number}</span>
            <span class="project-title">${project.title}</span>
          </div>
          <button class="project-comment-button" id="add-comment-${project.id}">
            <img src="img/comment-icon.svg" class="comment-icon" alt="Comment Icon">
            <span>Add Comment</span>
          </button>
        </div>
      </div>

      <div class="comments-part" id="comments-${project.id}">
        <ul class="comments-list"></ul>
      </div>
    `;

    const commentsList = listItem.querySelector('.comments-list');
    loadComments(project.id, commentsList);

    // Add the list item to the list
    projectsListItems[project.id] = listItem;
  }
}
initListItems();
console.log(projectsListItems); // Print the list items

// Initialize the selected projects list
const projectsListEl = document.querySelector('#projects-list');
initProjectsSelect(projectsListEl, projectsListItems, projectsData);

// Initialize the control of showing/hiding comments
commentsControl();

// Control the maximum height of the project comments part manually after the page is loaded
window.addEventListener('load', () => {
  const projectItems = document.querySelectorAll('.project-item');
  console.log('Project Items:', projectItems);

  projectItems.forEach((item, index) => {
    const projectPart = item.querySelector('.project-part');
    const commentsPart = item.querySelector('.comments-part');

    if (!projectPart || !commentsPart) {
      console.warn(`Missing elements for index ${index}`);
      return;
    }

    // Get the height of the project and comments parts
    const projectHeight = projectPart.offsetHeight;
    const commentsHeight = commentsPart.scrollHeight;

    console.log(`Project Part ${index} - Height: ${projectHeight}`);
    console.log(`Comments Part ${index} - Height: ${commentsHeight}`);

    // Set the max height of the comments part depending on the project part
    if (commentsHeight > projectHeight) {
      commentsPart.style.maxHeight = `${projectHeight}px`; // Limit the max height
      commentsPart.style.overflowY = 'auto'; // Enable the scroll bar
    } else {
      commentsPart.style.maxHeight = 'none'; // Set back to default
      commentsPart.style.overflowY = 'hidden'; // Disable the scroll bar
    }
  });

  document.body.classList.add('loaded'); // Add the loaded class to the body
});
