import { getProjectComments } from './firebase.js';

// Define a function to load project comments dynamically
async function loadTemplateComments(projectId, commentsList) {
  // Download comments for a specific project from Firebase
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
}

export { loadTemplateComments };
