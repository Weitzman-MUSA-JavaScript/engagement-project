import { loadProjectPage } from './project_page.js';

document.addEventListener('DOMContentLoaded', () => {
  const isProjectPage = window.location.pathname.includes('project-template.html');

  if (isProjectPage) {
    loadProjectPage();
  } else {
    setupProjectButtons();
  }
});


