document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.createElement('button');
    toggleButton.innerText = '☰'; // Hamburger icon
    toggleButton.id = 'sidebar-toggle';
    toggleButton.style.position = 'fixed';
    toggleButton.style.top = '15px';
    toggleButton.style.left = '15px';
    toggleButton.style.zIndex = '1100';
    document.body.appendChild(toggleButton);

    // Toggle sidebar visibility
    toggleButton.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent the event from bubbling up
        sidebar.classList.toggle('open');
    });

    // Close sidebar if clicking outside of it
    document.addEventListener('click', function (e) {
        if (!sidebar.contains(e.target) && e.target !== toggleButton) {
            sidebar.classList.remove('open');
        }
    });

    const links = document.querySelectorAll('#sidebar nav ul li a');

    // Function to reset underline to default state for inactive links
    function resetUnderline(link) {
        link.classList.remove('active-link');
    }

    // Add click event to update the active link when navigating
    links.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default link behavior for smooth scrolling

            // Get target section based on the href attribute
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                // Smooth scrolling to the section
                window.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: 'smooth'
                });
            }

            // Temporarily keep the clicked link as active until scroll completes
            link.classList.add('active-link');
        });
    });

    // Add scroll event to update the active link based on the section in view
    window.addEventListener('scroll', function () {
        let currentSection = '';

        // Loop through each section to determine which one is currently in view
        links.forEach(link => {
            const section = document.querySelector(link.getAttribute('href'));
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const scrollPos = window.scrollY + window.innerHeight / 2; // Get the middle of the screen

            // Check if the current scroll position is within the section bounds
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                currentSection = link.getAttribute('href');
            }
        });

        // Remove active class and reset underline from all links
        links.forEach(link => {
            if (link.getAttribute('href') !== currentSection) {
                resetUnderline(link);
            }
        });

        // Set the active link for the current section
        if (currentSection) {
            const currentLink = document.querySelector(`a[href="${currentSection}"]`);
            if (currentLink) {
                currentLink.classList.add('active-link');
            }
        }
    });
});
