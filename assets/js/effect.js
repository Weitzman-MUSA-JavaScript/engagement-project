function applyTitleFadeEffect(sectionClass) {
    const introSection = document.querySelector(sectionClass); 
    const introTextElements = introSection.querySelectorAll('h1, p');
    
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    const sectionTop = introSection.getBoundingClientRect().top + scrollPosition;
    const fadeOutStart = sectionTop; 
    const fadeOutEnd = sectionTop + introSection.offsetHeight;
    
    introTextElements.forEach(element => {
        if (scrollPosition < fadeOutStart) {
            element.style.opacity = 1;
        }
        else if (scrollPosition >= fadeOutStart && scrollPosition < fadeOutEnd) {
            const progress = (scrollPosition - fadeOutStart) / (fadeOutEnd - fadeOutStart);
            element.style.opacity = 1 - progress;
        }
        else {
            element.style.opacity = 0;
        }
    });
}

window.addEventListener('scroll', () => applyTitleFadeEffect('.title'));


function applyTextFadeEffect(sectionClass, inOutPosition) {
    const sections = document.querySelectorAll(sectionClass); 
    if (!sections) return; 

    sections.forEach(section => {
        const textElements = section.querySelectorAll('h1, h2, p');
        const viewportHeight = window.innerHeight;
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

        const sectionTop = section.getBoundingClientRect().top + scrollPosition;
        const fadeInStart = sectionTop - viewportHeight * (1 - inOutPosition); 
        const fadeOutStart = sectionTop - viewportHeight * inOutPosition;
        const fadeOutEnd = sectionTop + section.offsetHeight; 

        textElements.forEach(element => {
            if (scrollPosition < fadeInStart) {
                element.style.opacity = 0;
            } else if (scrollPosition >= fadeInStart && scrollPosition < fadeOutStart) {
                const emergeProgress = (scrollPosition - fadeInStart) / (fadeOutStart - fadeInStart);
                element.style.opacity = emergeProgress;
            } else if (scrollPosition >= fadeOutStart && scrollPosition < fadeOutEnd) {
                const fadeProgress = (scrollPosition - fadeOutStart) / (fadeOutEnd - fadeOutStart);
                element.style.opacity = 1 - fadeProgress;
            } else {
                element.style.opacity = 0;
            }
        });
    });
}

window.addEventListener('scroll', () => applyTextFadeEffect('.intro', 1/8));

window.addEventListener('scroll', () => applyTextFadeEffect('.slide-section .slide', 1/8));

window.addEventListener('scroll', () => applyTextFadeEffect('.ending', 1/8));


