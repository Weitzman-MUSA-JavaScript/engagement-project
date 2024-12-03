import { renderNewMap } from './newmap.js';
import { homeView } from './default.js';

// creative.js

function loadCreativeMode() {
    let contentPanel = document.getElementById('description-panel');
    contentPanel.innerHTML = `
        <div class="text-left mb-2" id="creativeIcon">
            <div id="creative-brush">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" class="bi bi-feather" viewBox="0 0 16 16">
                <path d="M15.807.531c-.174-.177-.41-.289-.64-.363a3.8 3.8 0 0 0-.833-.15c-.62-.049-1.394 0-2.252.175C10.365.545 8.264 1.415 6.315 3.1S3.147 6.824 2.557 8.523c-.294.847-.44 1.634-.429 2.268.005.316.05.62.154.88q.025.061.056.122A68 68 0 0 0 .08 15.198a.53.53 0 0 0 .157.72.504.504 0 0 0 .705-.16 68 68 0 0 1 2.158-3.26c.285.141.616.195.958.182.513-.02 1.098-.188 1.723-.49 1.25-.605 2.744-1.787 4.303-3.642l1.518-1.55a.53.53 0 0 0 0-.739l-.729-.744 1.311.209a.5.5 0 0 0 .443-.15l.663-.684c.663-.68 1.292-1.325 1.763-1.892.314-.378.585-.752.754-1.107.163-.345.278-.773.112-1.188a.5.5 0 0 0-.112-.172M3.733 11.62C5.385 9.374 7.24 7.215 9.309 5.394l1.21 1.234-1.171 1.196-.027.03c-1.5 1.789-2.891 2.867-3.977 3.393-.544.263-.99.378-1.324.39a1.3 1.3 0 0 1-.287-.018Zm6.769-7.22c1.31-1.028 2.7-1.914 4.172-2.6a7 7 0 0 1-.4.523c-.442.533-1.028 1.134-1.681 1.804l-.51.524zm3.346-3.357C9.594 3.147 6.045 6.8 3.149 10.678c.007-.464.121-1.086.37-1.806.533-1.535 1.65-3.415 3.455-4.976 1.807-1.561 3.746-2.36 5.31-2.68a8 8 0 0 1 1.564-.173"/>
                </svg>
            </div>
        </div>
        <h3><span style="font-size: 1.3em;">Creative mode</span></h3>
        <p>Welcome to the creative mode!</p>
        <p>Here, Tekong is your canvas — each colour represents a type of land use. To get started, click on "New map", select a colour, and start creating your very own map!</b></p>

        <!-- Buttons Section -->
        <div class="button-container">
            <button class="btn btn-secondary d-block mb-2 w-100" id="new-map-btn">New map</button>
            <button class="btn btn-secondary d-block mb-2 w-100" id="clear-canvas-btn">Clear canvas</button>
            <button class="btn btn-secondary w-100" id="upload-btn">Upload map to cloud</button>
        </div>

        <!-- Back Icon Section -->
        <div class="d-flex align-items-center mt-3" id="back-icon-section">
            <i class="bi bi-arrow-left-circle-fill" style="font-size: 1.5em; cursor: pointer; margin-right: 10px;"></i>
            <span style="font-size: 1.1em; cursor: pointer;" id="return-home">Return to home</span>
        </div>
    `;

    document.getElementById("new-map-btn").addEventListener("click", function() {
        renderNewMap();
        clearCanvas();
    });
    
    document.getElementById("clear-canvas-btn").addEventListener("click", function() {
        const userConfirmation = confirm("Clear map canvas and start over?");
        
        // If the user clicks "Yes", run the clearCanvas function
        if (userConfirmation) {
            clearCanvas();
        }
    });

    // Show modal when the "Upload Map" button is clicked
    document.getElementById("upload-btn").addEventListener("click", function() {
        const uploadModal = new bootstrap.Modal(document.getElementById("uploadModal"));
        uploadModal.show(); // Show the modal when the button is clicked
    });

    // Add "creative-brush" hover effect using CSS
    const brushIcon = document.getElementById('creative-brush');
    brushIcon.addEventListener('mouseover', () => {
        brushIcon.style.transform = 'scale(1.05)'; // Enlarge the icon
        brushIcon.style.transition = 'transform 0.3s ease'; // Smooth transition
    });
    brushIcon.addEventListener('mouseout', () => {
        brushIcon.style.transform = 'scale(1)'; // Return to normal size
    });

    function handleMouseMoveCreative(event) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;

        const mouseX = event.clientX;
        const mouseY = event.clientY;

        const deltaX = mouseX - centerX;
        const deltaY = mouseY - centerY;
        const angle = Math.atan2(deltaY, deltaX) * (45 / Math.PI) / 10; // Convert to degrees

        // Use GSAP to animate the rotation of the brush icon
        gsap.to("#creative-brush", {
            rotation: angle / 6,
            duration: 0.5,
            ease: "power1.out"
        });
    }

    window.addEventListener("mousemove", handleMouseMoveCreative);

    // "Return to home" functionality
    document.getElementById('back-icon-section').addEventListener('click', () => {
        homeView();
    });

    brushIcon.addEventListener('click', () => {
        alert("You cannot spell housing without U and I");
    });
}

function clearCanvas() {
    const defaultColors = {
        A1: '#f4f2ec',
        A2: '#f4f2ec',
        A3: '#f4f2ec',
        A4: '#f4f2ec',
        A5: '#f4f2ec',
        A6: '#f4f2ec',
        A7: '#f4f2ec',
        A8: '#f4f2ec',
        A9: '#f4f2ec',
        A10: '#f4f2ec',
        A11: '#f4f2ec',
        A12: '#f4f2ec',
        A13: '#f4f2ec',
        A14: '#f4f2ec',
        A15: '#f4f2ec',
        A16: '#f4f2ec',
        A17: '#f4f2ec',
        A18: '#f4f2ec',
        A19: '#f4f2ec',
        A20: '#f4f2ec',
        A21: '#f4f2ec',
        A22: '#f4f2ec',
        A23: '#f4f2ec',
        A24: '#f4f2ec',
        A25: '#f4f2ec',
        A26: '#f4f2ec',
        A27: '#f4f2ec',
        A28: '#f4f2ec',
        A29: '#f4f2ec',
        A30: '#f4f2ec',
        A31: '#f4f2ec',
        A32: '#f4f2ec',
        A33: '#f4f2ec',
        A34: '#f4f2ec',
        A35: '#f4f2ec',
        A36: '#f4f2ec',
        A37: '#f4f2ec',
        A38: '#f4f2ec',
        A39: '#f4f2ec',
        A40: '#f4f2ec',
        A41: '#f4f2ec',
        A42: '#f4f2ec',
        A43: '#f4f2ec',
        A44: '#bedef3',
        A45: '#516702',
        A46: '#516702',
        A47: '#516702',
        A48: '#516702',
        A49: '#516702',
        A50: '#abb20c'
    };

    // Reset all color values in localStorage
    for (const polygonName in defaultColors) {
        localStorage.setItem(`colour${polygonName}`, defaultColors[polygonName]);
    }

    console.log("Canvas cleared: All polygon colors reset to default values.");

    const polygonNames = [
        "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10",
        "A11", "A12", "A13", "A14", "A15", "A16", "A17", "A18", "A19", "A20",
        "A21", "A22", "A23", "A24", "A25", "A26", "A27", "A28", "A29", "A30",
        "A31", "A32", "A33", "A34", "A35", "A36", "A37", "A38", "A39", "A40",
        "A41", "A42", "A43", "A44", "A45", "A46", "A47", "A48", "A49", "A50"
    ];

    // Create an array of the colors for all polygons (re-render map)
    const colorArray = polygonNames.map(polygon => {
        return localStorage.getItem(`colour${polygon}`) || "#c300ba"; // Fallback to default color if not found
    });

    // Update the layer with the new colors for all polygons
    map.setPaintProperty('A-grid-20241116-3', 'fill-color', [
        "match",
        ["get", "Name"],
        ...polygonNames.flatMap((polygon, index) => [polygon, colorArray[index]]), // Map polygon names to their colors
        "#c300ba" // default color if no match (fallback)
    ]);
}

export { loadCreativeMode, clearCanvas };