// import { map3Initialized } from "./firebase.js";

// 切換 Section 的功能
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    // 分別初始化地圖
    if (sectionId === 'section1' && !map1Initialized) {
      initMap1();
    }
    if (sectionId === 'section2' && !map2Initialized) {
      initMap2();
    }
    if (sectionId === 'section3' && !map3Initialized) {
      initMap3();
    }
  }
  