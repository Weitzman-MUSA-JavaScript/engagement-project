// Define a function to load project page dynamically
import { loadProjectsData } from './projects_data.js';
import { getProjectComments } from './firebase.js';

async function loadProjectPage() {
  // Load projects data
  const projectsData = await loadProjectsData();

  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');

  const project = projectsData.find((project) => project.id === projectId);

  if (project) {
    // Load project header dynamically
    loadProjectHeader(project);

    // Load project images and descriptions dynamically
    const contentList = document.getElementById('project-content-list');
    await loadProjectContent(project, contentList);

    // Load project comments dynamically
    const commentsList = document.getElementById('project-comments-list');
    await loadProjectComments(project.id, commentsList);
  } else {
    document.body.innerHTML = '<h1>Project not found</h1>';
  }
}

// Define a function to load project header dynamically
function loadProjectHeader(project) {
  const titleElement = document.getElementById('project-title');
  const descriptionsElement = document.getElementById('project-descriptions');

  titleElement.textContent = project.title;
  descriptionsElement.textContent = project.description;
}

// Define a function to load project images and descriptions dynamically
async function loadProjectContent(project, contentList) {
  contentList.innerHTML = '';

  const folder = project.folder;
  const maxImages = 10;
  const imagePromises = [];
  const descriptionPromises = [];

  for (let i = 1; i <= maxImages; i++) {
    const imagePath = `${folder}/Image_${i}.jpg`;
    const descriptionPath = `${folder}/Description_${i}.txt`;

    const imagePromise = fetch(imagePath)
      .then((response) => (response.ok ? imagePath : null))
      .catch(() => null);

    const descriptionPromise = fetch(descriptionPath)
      .then((response) => (response.ok ? response.text() : null))
      .catch(() => null);

    imagePromises.push(imagePromise);
    descriptionPromises.push(descriptionPromise);
  }

  const images = await Promise.all(imagePromises);
  const descriptions = await Promise.all(descriptionPromises);

  images.forEach((image, index) => {
    if (image) {
      const description = descriptions[index] || 'No description available';
      const listItem = document.createElement('li');
      listItem.classList.add('project-content-item');

      listItem.innerHTML = `
      <div class="project-image-container">
        <img src="${image}" class="project-image" alt="Image ${index + 1}">
      </div>
      <p>${description}</p>
    `;
      contentList.appendChild(listItem);
    }
  });
}

// Define a function to load project comments dynamically
async function loadProjectComments(projectId, commentsList) {
  // Download comments for a specific project from Firebase
  const comments = await getProjectComments(projectId);

  // Clear the commentsList
  commentsList.innerHTML = '';

  // Fullfill the commentsList with comments
  for (const comment of comments) {
    const commentItem = document.createElement('li');
    commentItem.className = 'comment-item';
    commentItem.innerHTML = `
      <div class="line-one">
        <span class="comment-name">${comment.name}</span>
        <span class="comment-time">${comment.time}</span>
      </div>
      <div class="line-two">
        <span class="comment-content">${comment.content}</span>
      </div>
    `;
    commentsList.appendChild(commentItem);
  }
}

export { loadProjectPage };
