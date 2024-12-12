function initProjectsSelect(projectsListEl, projectsListItems, projects) {
  const asideFilter = document.querySelector('.aside-project-type-filter');
  const mainFilter = document.querySelector('.main-project-type-filter');

  function populateList(projects) {
    projectsListEl.innerHTML = '';

    for (const project of projects) {
      const projectItem = projectsListItems[project.id];
      projectsListEl.append(projectItem);
    }
  }
  populateList(projects);
}

export { initProjectsSelect };
