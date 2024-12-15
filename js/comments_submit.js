import { loadComments } from './comments_load.js';
import { addProjectComment } from './firebase.js';

// Define a function to submit comments
function submitComments() {
  const modal = document.getElementById('comment-modal');
  const nameInput = document.getElementById('name-input');
  const contentInput = document.getElementById('content-input');
  const submitButton = document.getElementById('submit-comment');
  const closeButton = document.getElementById('close-modal');
  let currentProjectId = null; // Store the current project ID

  // Add click event listeners to all comment buttons
  document.querySelectorAll('.project-comment-button').forEach((button) => {
    button.addEventListener('click', () => {
    // Extract the project ID from the button ID
      currentProjectId = button.id.split('-').pop();
      modal.classList.remove('hidden'); // Show the modal
    });
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
      alert('Comment added successfully!');

      // Get the comments list of the current project
      const listItem = document.querySelector(`#add-comment-${currentProjectId}`).closest('li');
      const commentsList = listItem.querySelector('.comments-list');

      // Check the current state of the toggle switch
      const toggleSwitch = document.querySelector('.toggle-switch');
      const commentsShow = toggleSwitch.querySelector('.comments-show');

      if (commentsShow.hasAttribute('active')) {
      // if comments are shown, reload the comments, if not, do nothing
        await loadComments(currentProjectId, commentsList);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
    // Hide the modal and clear the input fields
      modal.classList.add('hidden');
      nameInput.value = '';
      contentInput.value = '';
      currentProjectId = null; // Reset the project ID
    }
  });

  // Add click event listener to the close button
  closeButton.addEventListener('click', () => {
    modal.classList.add('hidden'); // Hide the modal
    nameInput.value = '';
    contentInput.value = '';
    currentProjectId = null; // Reset the project ID
  });
}

export { submitComments };
