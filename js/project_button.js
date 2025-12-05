import { loadProjectsData } from './projects_data.js';

async function setupProjectButtons(containerSelector, projectIdAttribute = 'data-project-id', defaultPage = 'project_template.html') {
  const containers = document.querySelectorAll(containerSelector);

  if (containers.length === 0) {
    console.warn(`No containers found for selector: ${containerSelector}`);
    return;
  }

  // Load projects data
  const projects = await loadProjectsData();

  // Add click event listener to the project containers
  containers.forEach((container) => {
    container.addEventListener('click', (event) => {
      const target = event.target.closest(`[${projectIdAttribute}]`);

      if (target) {
        const projectId = target.getAttribute(projectIdAttribute);
        const project = projects.find((p) => p.id === projectId);

        if (project) {
          const projectUrl = project.url || defaultPage;
          window.location.href = `${projectUrl}?id=${projectId}`;
        } else {
          console.error('Project not found for ID:', projectId);
        }
      }
    });
  });
}

export { setupProjectButtons };
