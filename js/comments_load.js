const commentsData = [
  { projectId: 'project_1', name: 'Landscape', time: '2022-06', content: 'Ecological Planning | Low-intervention' },
  { projectId: 'project_1', name: 'Urban Design', time: '2023-01', content: 'Community Engagement | Mixed-Use' },
  { projectId: 'project_2', name: 'Architecture', time: '2023-03', content: 'High-performance | Sustainable Design' },
  // Comments from firebase
];

function loadComments(projectId, commentsList) {
  // 筛选出当前项目的评论数据
  const projectComments = commentsData.filter((comment) => comment.projectId === projectId);

  // 清空现有评论（如果需要重新加载）
  commentsList.innerHTML = '';

  // 遍历并动态生成评论列表项
  for (const comment of projectComments) {
    const commentItem = document.createElement('li');
    commentItem.className = 'comment';
    commentItem.innerHTML = `
      <span class="comment-name">${comment.name}</span>
      <span class="comment-time">${comment.time}</span>
      <span class="comment-content">${comment.content}</span>
    `;
    commentsList.appendChild(commentItem);
  }
}

export { loadComments };
