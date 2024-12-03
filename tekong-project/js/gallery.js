// gallery.js

import { homeView } from './default.js';
import { getAllMaps } from './firebase.js';

function loadGalleryMode() {
    let contentPanel = document.getElementById('description-panel');
    contentPanel.innerHTML = `
        <div class="text-left mb-2" id="galleryIcon">
            <div id="gallery-svg">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" class="bi bi-palette-fill" viewBox="0 0 16 16">
                    <path d="M12.433 10.07C14.133 10.585 16 11.15 16 8a8 8 0 1 0-8 8c1.996 0 1.826-1.504 1.649-3.08-.124-1.101-.252-2.237.351-2.92.465-.527 1.42-.237 2.433.07M8 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m4.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3M5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
                </svg>
            </div>
        </div>
        <h3><span style="font-size: 1.3em;">Gallery view</span></h3>
        <p>Explore map submissions from other people here!<br>Add your own map to this gallery by returning to the home page and enter creative mode.</b></p>
        
        <!-- Search Bar Section -->
        <div class="input-group mb-3" id="search-bar-container">
            <input type="text" class="form-control" placeholder="Search for maps by title..." id="search-bar" aria-label="Search titles" aria-describedby="search-button">
            <button class="btn btn-outline-secondary" type="button" id="search-button">Search</button>
        </div>

        <!-- Scrollable Titles Section -->
        <div class="scrollable-titles-container" style="overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-bottom: 15px;">
            <ul id="titles-list" style="list-style: none; padding: 0; margin: 0;">
                <li>Loading titles...</li>
            </ul>
        </div>
        <p>Description of selected map:</p>

        <!-- Description Section -->
        <div id="map-description" class="scrollable-description-container" style="overflow-y: auto; border: 1px solid #ddd; padding: 10px;">
            <!-- Select a submission to see its description! -->
        </div>

        <div id="expandable-description">
        <p style="color: #a5a296; text-decoration: underline;">View full description</p>
        </div>

        <!-- Back Icon Section -->
        <div class="d-flex align-items-center mt-3" id="back-icon-section">
            <i class="bi bi-arrow-left-circle-fill" style="font-size: 1.5em; cursor: pointer; margin-right: 10px;"></i>
            <span style="font-size: 1.1em; cursor: pointer;" id="return-home">Return to home</span>
        </div>

        <!-- Modal Section -->
        <div id="description-modal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #fefcf6; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); z-index: 1000; max-height: 80%; width: 50%; overflow-y: auto;">
            <span id="close-modal" style="cursor: pointer; font-weight: bold; float: right;">&times;</span>
            <div id="modal-content"></div>
        </div>
        <div id="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.4); z-index: 999;"></div>
    `;

    const titlesList = document.getElementById('titles-list');
    const searchBar = document.getElementById('search-bar');
    const mapDescription = document.getElementById('map-description');
    
    // Fetch titles from Firestore using the mapsData object
    async function fetchTitles(query = '') {
        
        titlesList.innerHTML = '<li>Loading titles...</li>'; // Show loading message while fetching

        try {
            // Get all maps from Firestore
            const mapsData = await getAllMaps(); // Fetch all map documents

            // Clear the loading message
            titlesList.innerHTML = '';

            const mapEntries = Object.entries(mapsData); // Convert mapsData object to an array of [key, value] pairs

            // Filter maps based on search query
            const filteredMaps = mapEntries.filter(([docId, map]) => {
                return map.title.toLowerCase().includes(query.toLowerCase());
            });

            if (filteredMaps.length === 0) {
                titlesList.innerHTML = '<li>No titles found.</li>';
            } else {
                // Iterate through all the maps (from filteredMaps)
                filteredMaps.forEach(([docId, map]) => {
                    const title = map.title; // Assuming each map has a 'title' field

                    if (title) {
                        // Create a list item for each title
                        const listItem = document.createElement('li');
                        listItem.textContent = title;
                        listItem.style.cursor = 'pointer';
                        listItem.style.marginBottom = '5px';

                        // Add a click handler to show map description and update localStorage colors
                        listItem.addEventListener('click', () => {
                            console.log(`Title clicked: ${title}`);
                        
                            // Update description and author in mapDescription
                            mapDescription.innerHTML = `
                                Map created by: ${map.author || 'No author specified.'}
                                <br><br>
                                ${map.description ? map.description.replace(/\n/g, '<br>') : 'No description available for this map.'}
                            `;
                        
                            // Override localStorage with colors from the selected map
                            const mapColors = map.colors; // Assuming `colors` is an object like { A1: '#color', A2: '#color', ... }
                        
                            for (let i = 1; i <= 50; i++) {
                                const polygonKey = `A${i}`;
                                if (mapColors[polygonKey]) {
                                    // Set the localStorage color for the polygon (A1, A2, A50, etc.)
                                    localStorage.setItem(`colour${polygonKey}`, mapColors[polygonKey]);
                                }
                            }
                        
                            console.log('Updated colors in localStorage:');
                            for (let i = 1; i <= 50; i++) {
                                const polygonKey = `A${i}`;
                                console.log(`${polygonKey}: ${localStorage.getItem(`colour${polygonKey}`)}`);
                            }

                            // Re-render map layer A-grid-20241116-3 with new colors
                            renderMapLayer();

                            // Highlight the selected row
                            highlightSelectedRow(listItem);
                        });

                        titlesList.appendChild(listItem);
                    }
                });
                
            }
        } catch (error) {
            console.error('Error fetching titles:', error);
            titlesList.innerHTML = '<li>Error loading titles.</li>';
        }
    }

    // Call the function to load titles when needed
    fetchTitles();

    // Add debounce function for search input
    let debounceTimer;
    searchBar.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetchTitles(searchBar.value);
        }, 500); // Wait for 500ms after user stops typing
    });

    // "Return to home" functionality
    document.getElementById('back-icon-section').addEventListener('click', () => {
        homeView();
    });

    // Add "creative-brush" hover effect using CSS
    const paletteLogo = document.getElementById('gallery-svg');
    paletteLogo.addEventListener('mouseover', () => {
        paletteLogo.style.transform = 'scale(1.05)'; // Enlarge the icon
        paletteLogo.style.transition = 'transform 0.3s ease'; // Smooth transition
    });
    paletteLogo.addEventListener('mouseout', () => {
        paletteLogo.style.transform = 'scale(1)'; // Return to normal size
    });

    function handleMouseMoveGallery(event) {
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
        gsap.to("#gallery-svg", {
            rotation: angle / 6,
            duration: 0.5,
            ease: "power1.out"
        });
    }

    window.addEventListener("mousemove", handleMouseMoveGallery);

    // document.getElementById('expandable-description').addEventListener('click', () => {
    //     const currentDescription = mapDescription.innerHTML; // Assuming mapDescription already holds the selected map's description
    //     alert(currentDescription);
    // });

    document.getElementById('expandable-description').addEventListener('click', () => {
        const toggleBtn = document.getElementById('toggle-panel-btn');
        const currentDescription = mapDescription.innerHTML; // Get the current description
    
        // Get modal elements
        const modal = document.getElementById('description-modal');
        const modalContent = document.getElementById('modal-content');
        const modalOverlay = document.getElementById('modal-overlay');
    
        // Hide the toggle button
        toggleBtn.style.visibility = 'hidden';
    
        // Set the modal content
        modalContent.innerHTML = currentDescription;
    
        // Show the modal and overlay
        modal.style.display = 'block';
        modalOverlay.style.display = 'block';
    
        // Close the modal when clicking the close button or the overlay
        document.getElementById('close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
            modalOverlay.style.display = 'none';
    
            // Show the toggle button again
            toggleBtn.style.visibility = 'visible';

        });
    
        modalOverlay.addEventListener('click', () => {
            modal.style.display = 'none';
            modalOverlay.style.display = 'none';
    
            // Show the toggle button again
            toggleBtn.style.visibility = 'visible';
        });
    });

}

function renderMapLayer() {
    const polygonsLayer = 'A-grid-20241116-3';

    // Iterate over the polygons in the layer and update their colors based on localStorage
    map.setPaintProperty(polygonsLayer, 'fill-color', [
        'match',
        ['get', 'Name'],
        ...Array.from({ length: 50 }, (_, i) => {
            const polygonKey = `A${i + 1}`;
            const color = localStorage.getItem(`colour${polygonKey}`);
            return [polygonKey, color || '#FFFFFF']; // Default to white if no color is set
        }).flat(),
        '#FFFFFF', // Default color if no match
    ]);
}

function highlightSelectedRow(selectedRow) {
    const rows = document.querySelectorAll('#titles-list li');
    
    // Remove highlight from all rows
    rows.forEach(row => {
        row.style.backgroundColor = ''; 
    });

    // Highlight the selected row
    selectedRow.style.backgroundColor = '#e6e4de'; 
}

export { loadGalleryMode };