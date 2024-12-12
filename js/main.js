import { loadProjectsData } from './projects_data.js';
import { initProjectsSelect } from './projects_select.js';

const projects = await loadProjectsData();

const projectsListItems = {};
function initListItems() {
  for (const project of projects) {
    const listItem = document.createElement('li');
    listItem.className = 'project-item';

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

    projectsListItems[project.id] = listItem;
  }
}
initListItems();
console.log(projectsListItems);

const projectsListEl = document.querySelector('#project-list');
initProjectsSelect(projectsListEl, projectsListItems, projects);
