async function loadProjectsData() {
  try {
    const projectsResponse = await fetch('data/projects.json');
    if (!projectsResponse.ok) {
      throw new Error('Failed to load projects data');
    }
    const projectsData = await projectsResponse.json();
    return projectsData;
  } catch (error) {
    console.error('Error fetching or parsing the projects.json file:', error);
    return [];
  }
}

export { loadProjectsData };
