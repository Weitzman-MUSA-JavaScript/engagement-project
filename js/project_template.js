import { loadProjectPage } from './project_page.js';
import { addProjectComment } from './firebase.js';
import { loadTemplateComments } from './comments_load_template.js';

// The function to dynamically load the project page contents
loadProjectPage();

// Define a function to submit comments using the comment modal
function submitTemplateComments() {
  const button = document.getElementById('comment-button');
  const modal = document.getElementById('comment-modal');
  const nameInput = document.getElementById('name-input');
  const contentInput = document.getElementById('content-input');
  const submitButton = document.getElementById('submit-comment');
  const closeButton = document.getElementById('close-modal');
  const commentsList = document.getElementById('project-comments-list');

  const params = new URLSearchParams(window.location.search);
  const currentProjectId = params.get('id');

  button.addEventListener('click', () => {
    modal.classList.remove('hidden'); // Show the comment modal
  });

  // Add click event listener to the submit button
  submitButton.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const content = contentInput.value.trim();

    if (!name || !content) {
      alert('Please fill in both name and content!');
      return;
    }

    try {
    // Add the comment to the current project in firebase
      await addProjectComment(currentProjectId, name, content);
      await loadTemplateComments(currentProjectId, commentsList);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
    // Hide the modal and clear the input fields
      modal.classList.add('hidden');
      nameInput.value = '';
      contentInput.value = '';
    }
  });

  // Add click event listener to the close button
  closeButton.addEventListener('click', () => {
    modal.classList.add('hidden'); // Hide the modal
    nameInput.value = '';
    contentInput.value = '';
  });
}
submitTemplateComments();

// Display the page after it is loaded
window.addEventListener('load', () => {
  document.body.classList.add('loaded'); // Add the loaded class to the body
});
