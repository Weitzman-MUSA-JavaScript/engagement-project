// This is the main script for the comments page.
import { loadProjectsData } from './projects_data.js';
import { initProjectsSelect } from './projects_select.js';
import { loadComments } from './comments_load.js';
import { commentsControl } from './comments_control.js';
import { submitComments } from './comments_submit.js';
// import { loadProjectPage } from './project_page.js';
// import { setupProjectButtons } from './project_button.js';

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
        <div class="project-cover-container" data-project-id="${project.id}">
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

// Initialize the comments submit function
submitComments();

// Add a event listener to the load the project template page
// document.addEventListener('DOMContentLoaded', () => {
//   const isProjectPage = window.location.pathname.includes('project_template.html');

//   if (isProjectPage) {
//     loadProjectPage();
//   } else {
//     setupProjectButtons('.project-cover-container', 'data-project-id', 'project-template.html');
//   }
// });

// Display the page after it is loaded
window.addEventListener('load', () => {
  document.body.classList.add('loaded'); // Add the loaded class to the body
});
