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

window.addEventListener('load', () => {
  document.body.classList.add('loaded'); // 添加 "loaded" 类，触发过渡效果
});

