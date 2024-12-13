import { loadProjectsData } from './projects_data.js';
import { initProjectsSelect } from './projects_select.js';
import { commentsControl } from './comments_control.js';
import { loadComments } from './comments_load.js';

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
          <button class="project-comment-button">
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
const projectsListEl = document.querySelector('#project-list');
initProjectsSelect(projectsListEl, projectsListItems, projectsData);

// Initialize the comments control
commentsControl();
