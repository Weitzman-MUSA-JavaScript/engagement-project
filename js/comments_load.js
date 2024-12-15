import { getProjectComments } from './firebase.js';

// Define a function to load comments for a specific project
async function loadComments(projectId, commentsList) {
  // Download comments for specific project from Firebase
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

  // Adjust the height of commentsList after the comments are loaded
  // This needs to be run every time after the comments are loaded because the comments data are dynamic
  adjustCommentsHeight(projectId);
}

// Define a function to adjust the height of comments part based on the height of project part
function adjustCommentsHeight(projectId) {
  const listItem = document.querySelector(`[data-project-id="${projectId}"]`);
  if (!listItem) return;

  const projectPart = listItem.querySelector('.project-part');
  const commentsPart = listItem.querySelector('.comments-part');

  if (!projectPart || !commentsPart) return;

  // Get the height of the project and comments parts
  const projectHeight = projectPart.offsetHeight;
  const commentsHeight = commentsPart.scrollHeight;

  // Set the max height of the comments part depending on the project part
  if (commentsHeight > projectHeight) {
    commentsPart.style.maxHeight = `${projectHeight}px`; // Limit the max height
    commentsPart.style.overflowY = 'auto'; // Enable the scroll bar
  } else {
    commentsPart.style.maxHeight = 'none'; // Set back to default
    commentsPart.style.overflowY = 'hidden'; // Disable the scroll bar
  }
}

export { loadComments };
