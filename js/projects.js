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

// window.addEventListener('load', () => {
//   const projectItems = document.querySelectorAll('.project-item');
//   console.log('Project Items:', projectItems);

//   projectItems.forEach((item, index) => {
//     const projectPart = item.querySelector('.project-cover-container');
//     const commentsPart = item.querySelector('.project-details');

//     if (!projectPart || !commentsPart) {
//       console.warn(`Missing elements for index ${index}`);
//       return;
//     }

//     // 获取 project-part 和 comments-part 的高度
//     const projectHeight = projectPart.offsetHeight;
//     const commentsHeight = commentsPart.scrollHeight;

//     console.log(`Project Part ${index} - Height: ${projectHeight}`);
//     console.log(`Comments Part ${index} - Height: ${commentsHeight}`);

//     // 动态设置 comments-part 的高度和滚动条
//     if (commentsHeight > projectHeight) {
//       commentsPart.style.maxHeight = `${projectHeight}px`; // 限制最大高度
//       commentsPart.style.overflowY = 'auto'; // 启用垂直滚动条
//     } else {
//       commentsPart.style.maxHeight = 'none'; // 恢复默认高度
//       commentsPart.style.overflowY = 'hidden'; // 禁用滚动条
//     }
//   });
// });

window.addEventListener('load', () => {
  document.body.classList.add('loaded'); // 添加 "loaded" 类，触发过渡效果
});

