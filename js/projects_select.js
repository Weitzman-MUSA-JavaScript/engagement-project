// Initialize the projects type filter and list display
function initProjectsSelect(projectsListEl, projectsListItems, projectsData) {
  // Create variables for the filter elements
  const asideFilter = document.querySelector('.aside-project-type-filter');
  const mainFilter = document.querySelector('.main-project-type-filter');
  const mainSelectedText = document.querySelector('.main-project-type-selected p');
  const mainTypeList = document.querySelector('.main-project-type-list');

  // Create a function to populate the list
  function populateList(projects) {
    projectsListEl.innerHTML = '';

    projects.forEach((project, index) => {
      const projectItem = projectsListItems[project.id];
      projectItem.querySelector('.project-number').textContent = String(index + 1).padStart(2, '0');
      projectsListEl.append(projectItem);
    });
  }
  populateList(projectsData); // Populate the list with all projects

  // Create a function to set the active button
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

  // Create a function to handle filter clicks
  function handleFilterClick(type) {
    setActiveButton(asideFilter, type);
    setActiveButton(mainFilter, type);
    mainSelectedText.textContent = `View — ${type.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`;

    const filteredProjects = type === 'all projects' ? projectsData : projectsData.filter((project) => project.type.toLowerCase() === type);
    populateList(filteredProjects);
  }

  // Add event listener to the aside filter elements
  asideFilter.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
      const type = event.target.dataset.type;
      handleFilterClick(type);
    }
  });

  // Add event listener to the main filter elements
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
        }, 10); // Delay the visibility to ensure the click event is handled
      }
    }
  });
}

export { initProjectsSelect };
