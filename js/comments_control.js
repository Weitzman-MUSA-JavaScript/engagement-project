import { loadComments } from './comments_load.js';

function commentsControl() {
  const toggleSwitch = document.querySelector('.toggle-switch');
  const allCommentsParts = document.querySelectorAll('.comments-part');
  const projectCoverContainers = document.querySelectorAll('.project-cover-container');

  let isShowActive = true; // 初始状态为显示

  // 鼠标事件处理函数
  function handleMouseEnter(event) {
    if (isShowActive) return; // 确保鼠标逻辑在 `show` 状态下停用

    const projectId = event.currentTarget.closest('.project-item').dataset.projectId;
    const relatedComments = document.querySelector(`#comments-${projectId}`);
    if (relatedComments) {
      const commentsList = relatedComments.querySelector('.comments-list');
      loadComments(projectId, commentsList); // 动态加载评论
    }
  }

  function handleMouseLeave(event) {
    if (isShowActive) return; // 确保鼠标逻辑在 `show` 状态下停用

    const projectId = event.currentTarget.closest('.project-item').dataset.projectId;
    const relatedComments = document.querySelector(`#comments-${projectId}`);
    if (relatedComments) {
      const commentsList = relatedComments.querySelector('.comments-list');
      commentsList.innerHTML = ''; // 清空评论
    }
  }

  // 初始化鼠标事件监听
  projectCoverContainers.forEach((coverContainer) => {
    coverContainer.addEventListener('mouseenter', handleMouseEnter);
    coverContainer.addEventListener('mouseleave', handleMouseLeave);
  });

  // 点击切换逻辑
  toggleSwitch.addEventListener('click', (event) => {
    if (event.target.classList.contains('comments-show')) {
      toggleSwitch.querySelector('.comments-show').setAttribute('active', true);
      toggleSwitch.querySelector('.comments-hide').removeAttribute('active');

      // 渲染所有评论
      allCommentsParts.forEach((commentsPart) => {
        const projectId = commentsPart.closest('.project-item').dataset.projectId;
        const commentsList = commentsPart.querySelector('.comments-list');
        loadComments(projectId, commentsList); // 动态加载评论
      });

      document.querySelector('.project-list').classList.add('no-hover'); // 禁用悬停效果

      isShowActive = true; // 切换到 `show` 状态
    } else if (event.target.classList.contains('comments-hide')) {
      toggleSwitch.querySelector('.comments-hide').setAttribute('active', true);
      toggleSwitch.querySelector('.comments-show').removeAttribute('active');

      // 清空所有评论内容
      allCommentsParts.forEach((commentsPart) => {
        const commentsList = commentsPart.querySelector('.comments-list');
        commentsList.innerHTML = ''; // 清空评论
      });

      document.querySelector('.project-list').classList.remove('no-hover'); // 恢复悬停效果

      isShowActive = false; // 切换到 `hide` 状态
    }
  });

  // 监听状态变化调整鼠标事件
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

  // 初始化状态确保悬停效果禁用
  document.querySelector('.project-list').classList.add('no-hover');

  // 初始渲染所有评论
  allCommentsParts.forEach((commentsPart) => {
    const projectId = commentsPart.closest('.project-item').dataset.projectId;
    const commentsList = commentsPart.querySelector('.comments-list');
    loadComments(projectId, commentsList); // 动态加载评论
  });

  // 每次状态切换后更新鼠标事件监听
  toggleSwitch.addEventListener('click', updateMouseEventListeners);
}

export { commentsControl };
