// 获取必要的 DOM 元素
const dataAnalysisButton = document.getElementById('data-analysis-btn');
const reportObservationButton = document.getElementById('report-observation-btn');
const sliderContainer = document.getElementById('slider-container');
const chartContainer = document.getElementById('chart-container');
const reportForm = document.getElementById('report-form');

// 初始状态设置
function initializeUI() {
  sliderContainer.style.display = 'block'; // 默认显示滑块
  chartContainer.style.display = 'block'; // 默认显示条形图
  reportForm.style.display = 'none'; // 默认隐藏表单

  // 设置“Data Analysis”按钮为激活状态
  dataAnalysisButton.classList.add('active');
}

// 点击“Data Analysis”按钮时的逻辑
dataAnalysisButton.addEventListener('click', () => {
  sliderContainer.style.display = 'block'; // 显示滑块
  chartContainer.style.display = 'block'; // 显示条形图
  reportForm.style.display = 'none'; // 隐藏表单

  // 可选：添加按钮激活状态样式
  dataAnalysisButton.classList.add('active');
  reportObservationButton.classList.remove('active');
});

// 点击“Report Observation”按钮时的逻辑
reportObservationButton.addEventListener('click', () => {
  sliderContainer.style.display = 'none'; // 隐藏滑块
  chartContainer.style.display = 'none'; // 隐藏条形图
  reportForm.style.display = 'block'; // 显示表单

  // 可选：添加按钮激活状态样式
  reportObservationButton.classList.add('active');
  dataAnalysisButton.classList.remove('active');
});

// 初始化
initializeUI();
