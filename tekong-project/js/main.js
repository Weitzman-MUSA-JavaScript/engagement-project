
/* 
Welcome to main.js!
An overview of its structure:

1. Interactions on the main landing page
- Clicking on the HDB image
- Moving the mouse to rotate the HDB image
- Show / hide the content panel

2. Function to check for mobile devices


*/

/* ###################################################### */

/* Clicking on the HDB image */

document.getElementById('hdb-image').addEventListener('click', function () {
    alert(
        "This interactive web app is not affiliated with the Urban Redevelopment Authority, the Housing & Development Board, nor with the Government of Singapore.\n\n" +
        "Believing that this website is actual policy is like marrying someone based on their dating app profile.\n\n" +
        "For legal purposes, NONE of the information here reflects the planning intention of the Government. Please refer to the adopted Master Plan instead.\n\n" +
        "TLDR: For demonstration purposes only!\n" +
        "bairun@upenn.edu\n\n" +
        "Visit the MUSA website:\n" +
        "https://www.design.upenn.edu/musa/about"
    );
});

/* ###################################################### */

/* Moving the mouse to rotate the HDB image */

function handleMouseMove(event) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const angle = Math.atan2(deltaY, deltaX) * (45 / Math.PI) / 10; // Convert to degrees

    gsap.to("#hdb-image", {
        rotation: angle,
        duration: 0.3,
        ease: "power1.out"
    });
}

window.addEventListener("mousemove", handleMouseMove);


/* ###################################################### */

/* Show / hide the content panel */

// Select elements
const contentPanel = document.getElementById('description-panel');
const mapPanel = document.getElementById('map');
const toggleBtn = document.getElementById('toggle-panel-btn');

// Initial state
let isPanelVisible = true;

$(document).ready(function () {
    $('#toggle-panel-btn').tooltip({ placement: 'right' }); // Initialize tooltip
});

toggleBtn.addEventListener('click', () => {
    if (isPanelVisible) {
        // Hide content panel
        contentPanel.style.width = '0';
        contentPanel.style.padding = '0'; // Remove padding for smooth collapse
        mapPanel.style.width = '100%';

        // Change the innerHTML of the toggle button
        toggleBtn.innerHTML = `<i class="bi bi-chevron-right"></i><i class="bi bi-chevron-right"></i>`;

        // Remove and reinitialize the tooltip after the button moves
        $('#toggle-panel-btn').tooltip('dispose'); // Destroy the existing tooltip
        $('#toggle-panel-btn').tooltip({ placement: 'right' });; // Reinitialize the tooltip

    } else {
        // Show content panel
        contentPanel.style.width = '30%';
        contentPanel.style.padding = '2rem'; // Restore padding
        mapPanel.style.width = '70%';

        // Change the innerHTML of the toggle button
        toggleBtn.innerHTML = `<i class="bi bi-chevron-left"></i><i class="bi bi-chevron-left"></i>`;

        // Remove and reinitialize the tooltip after the button moves
        $('#toggle-panel-btn').tooltip('dispose'); // Destroy the existing tooltip
        $('#toggle-panel-btn').tooltip({ placement: 'right' });; // Reinitialize the tooltip
    }

    // Resize the map after layout changes
    setTimeout(() => {
        map.resize(); // Adjust the Mapbox map to fit the updated #map panel
    }, 300); // Delay to ensure the CSS transition completes

    // Toggle panel visibility state
    isPanelVisible = !isPanelVisible;
});


/* ###################################################### */

// Function to check for mobile devices
function checkMobileDevice() {
    const width = window.innerWidth;

    // Check if the device is mobile (less than 768px for mobile, 768px to 1024px for tablets)
    if (width < 768) {
        alert("You are viewing this page on mobile. The interface is best used on tablets / laptops / desktops. Better for your eyes!");
    }
}

window.onload = checkMobileDevice;

document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', event => {
      window.open(link.href, '_blank');
    });
  });