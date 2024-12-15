// Control the show/hide comments switch
// When the toggle switch is set to `show`, all comments will be loaded and displayed.
// When the toggle switch is set to `hide`, all comments will be cleared.
// However, when the toggle switch is set to `hide`, the comments will be loaded and displayed when the mouse hovers over the project cover.
import { loadComments } from './comments_load.js';

function commentsControl() {
  const toggleSwitch = document.querySelector('.toggle-switch');
  const allCommentsParts = document.querySelectorAll('.comments-part');
  const projectCoverContainers = document.querySelectorAll('.project-cover-container');

  let isShowActive = true; // Initialize the state of toggle switch to `show`

  // A function to handle mouse enter event
  function handleMouseEnter(event) {
    if (isShowActive) return; // Ensure the mouse logic is disabled in `show` state

    const projectId = event.currentTarget.closest('.project-item').dataset.projectId;
    const relatedComments = document.querySelector(`#comments-${projectId}`);
    if (relatedComments) {
      const commentsList = relatedComments.querySelector('.comments-list');
      loadComments(projectId, commentsList); // Add comments to the project item
    }
  }

  // A function to handle mouse leave event
  function handleMouseLeave(event) {
    if (isShowActive) return; // Ensure the mouse logic is disabled in `show` state

    const projectId = event.currentTarget.closest('.project-item').dataset.projectId;
    const relatedComments = document.querySelector(`#comments-${projectId}`);
    if (relatedComments) {
      const commentsList = relatedComments.querySelector('.comments-list');
      commentsList.innerHTML = ''; // Clear the comments of the project item
    }
  }

  // Update mouse event listeners status
  function updateMouseEventListeners() {
    if (isShowActive) {
      projectCoverContainers.forEach((coverContainer) => {
        coverContainer.removeEventListener('mouseenter', handleMouseEnter);
        coverContainer.removeEventListener('mouseleave', handleMouseLeave);
      });
    } else {
      projectCoverContainers.forEach((coverContainer) => {
        coverContainer.addEventListener('mouseenter', handleMouseEnter);
        coverContainer.addEventListener('mouseleave', handleMouseLeave);
      });
    }
  }

  // Initialize mouse event listeners
  projectCoverContainers.forEach((coverContainer) => {
    coverContainer.addEventListener('mouseenter', handleMouseEnter);
    coverContainer.addEventListener('mouseleave', handleMouseLeave);
  });

  // Make sure the hover effect is disabled when the page is first loaded
  document.querySelector('.projects-list').classList.add('no-hover');

  // Load and clear all comments based on the toggle switch state
  toggleSwitch.addEventListener('click', (event) => {
    if (event.target.classList.contains('comments-show')) {
      toggleSwitch.querySelector('.comments-show').setAttribute('active', true);
      toggleSwitch.querySelector('.comments-hide').removeAttribute('active');

      // Load all comments to the project items
      allCommentsParts.forEach((commentsPart) => {
        const projectId = commentsPart.closest('.project-item').dataset.projectId;
        const commentsList = commentsPart.querySelector('.comments-list');
        loadComments(projectId, commentsList); // Add comments dynamically
      });

      document.querySelector('.projects-list').classList.add('no-hover'); // Remove the hover effect

      isShowActive = true; // Set the toggle switch to `show` state
    } else if (event.target.classList.contains('comments-hide')) {
      toggleSwitch.querySelector('.comments-hide').setAttribute('active', true);
      toggleSwitch.querySelector('.comments-show').removeAttribute('active');

      // Clear all comments from the project items
      allCommentsParts.forEach((commentsPart) => {
        const commentsList = commentsPart.querySelector('.comments-list');
        commentsList.innerHTML = ''; // Remove comments dynamically
      });

      document.querySelector('.projects-list').classList.remove('no-hover'); // Restore the hover effect

      isShowActive = false; // Set the toggle switch to `hide` state
    }
  });

  // Update the mouse event listeners status when the toggle switch is clicked
  toggleSwitch.addEventListener('click', updateMouseEventListeners);
}

export { commentsControl };
