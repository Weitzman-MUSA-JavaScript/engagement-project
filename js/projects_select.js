function initProjectsSelect(projectsListEl, projectsListItems, projects) {
  const asideFilter = document.querySelector('.aside-project-type-filter');
  const mainFilter = document.querySelector('.main-project-type-filter');
  const mainSelectedText = document.querySelector('.main-project-type-selected p');
  const mainTypeList = document.querySelector('.main-project-type-list');

  function populateList(projects) {
    projectsListEl.innerHTML = '';

    projects.forEach((project, index) => {
      const projectItem = projectsListItems[project.id];
      projectItem.querySelector('.project-number').textContent = String(index + 1).padStart(2, '0');
      projectsListEl.append(projectItem);
    });
  }
  populateList(projects);

  function setActiveButton(filterContainer, type) {
    const buttons = filterContainer.querySelectorAll('button');
    buttons.forEach((button) => {
      if (button.dataset.type === type) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  function handleFilterClick(type) {
    setActiveButton(asideFilter, type);
    setActiveButton(mainFilter, type);
    mainSelectedText.textContent = `View — ${type.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`;

    const filteredProjects = type === 'all projects' ? projects : projects.filter((project) => project.type.toLowerCase() === type);
    populateList(filteredProjects);
  }

  asideFilter.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
      const type = event.target.dataset.type;
      handleFilterClick(type);
    }
  });

  mainFilter.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
      const type = event.target.dataset.type;
      handleFilterClick(type);
      // Ensure the list folds back after a selection
      mainTypeList.classList.remove('visible');
    } else if (event.target.closest('.main-project-type-selected')) {
      // Toggle visibility and ensure reset display
      if (mainTypeList.classList.contains('visible')) {
        mainTypeList.classList.remove('visible');
      } else {
        setTimeout(() => {
          mainTypeList.classList.add('visible');
        }, 10);
      }
    }
  });
}

export { initProjectsSelect };
