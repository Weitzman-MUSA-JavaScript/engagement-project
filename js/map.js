document.addEventListener('DOMContentLoaded', () => {
    
    // --- Configuration ---
    const DATA_URL = 'data/philly_business.json';
    const PHILLY_COORDS = [39.9526, -75.1652];
    
    // --- Global State ---
    let allBusinessData = []; 
    const markersLayer = L.markerClusterGroup(); 
    let favorites = JSON.parse(localStorage.getItem('phillyFavorites')) || []; 

    // --- 1. Initialize Map ---
    const map = L.map('map').setView(PHILLY_COORDS, 12);
    
    var CartoDB_Positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    map.addLayer(markersLayer);

    // --- 2. Fetch Data ---
    fetch(DATA_URL)
        .then(res => {
            if (!res.ok) throw new Error("Failed to load data");
            return res.json();
        })
        .then(data => {
            allBusinessData = data;
            console.log(`Loaded ${data.length} businesses.`);
            
            // Initial Render
            renderMap(allBusinessData);
            
            // Render favorites list (if container exists)
            renderFavoritesList();
            
            // Remove loading screen
            const loader = document.getElementById('loading-overlay');
            if (loader) loader.style.display = 'none';
        })
        .catch(err => {
            console.error(err);
            const loader = document.getElementById('loading-overlay');
            if (loader) {
                loader.innerHTML = `<p style="color:red; text-align:center; padding:20px;">Error: ${err.message}<br>Make sure to run a local server (python -m http.server)!</p>`;
            }
        });

    // --- 3. Filter Logic Helpers ---

    /**
     * Check if a business matches selected cuisine categories.
     */
    function matchesCuisine(categories, selectedCuisines) {
        if (!categories) return false;
        // If no cuisine is selected, assume we want to match nothing (or modify logic to match all)
        if (selectedCuisines.length === 0) return false;
        
        const catStr = categories.toLowerCase();
        return selectedCuisines.some(c => catStr.includes(c.toLowerCase()));
    }

    /**
     * Check if a business matches selected features (Amenities).
     * Mapping UI checkboxes to Yelp 'attributes' JSON structure.
     */
    function matchesFeatures(attributes, selectedFeatures) {
        if (!attributes && selectedFeatures.length > 0) return false;
        
        // Iterate through all selected features
        for (const feature of selectedFeatures) {
            switch (feature) {
                case 'tv':
                    if (attributes.HasTV !== 'True') return false;
                    break;
                case 'outdoor':
                    if (attributes.OutdoorSeating !== 'True') return false;
                    break;
                case 'kids':
                    if (attributes.GoodForKids !== 'True') return false;
                    break;
                case 'takeout':
                    if (attributes.RestaurantsTakeOut !== 'True') return false;
                    break;
                default:
                    break;
            }
        }
        return true;
    }

    // --- 4. Main Filter Function ---
    function filterData() {
        // A. Get Filter Values
        const slider = document.getElementById('rating-slider');
        const minRating = slider ? parseFloat(slider.value) : 0;
        
        const searchInput = document.getElementById('search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
        
        const favToggle = document.getElementById('fav-only-toggle');
        const showFavOnly = favToggle ? favToggle.checked : false;
        
        // Get selected cuisine categories
        const cuisineCheckboxes = document.querySelectorAll('input[name="cuisine"]:checked');
        const selectedCuisines = Array.from(cuisineCheckboxes).map(cb => cb.value);

        // Get selected features (New Implementation)
        const featureCheckboxes = document.querySelectorAll('.feature-input:checked');
        const selectedFeatures = Array.from(featureCheckboxes).map(cb => cb.value);

        // Update slider label
        const ratingValueEl = document.getElementById('rating-value');
        if (ratingValueEl) {
            ratingValueEl.innerText = minRating > 0 ? `${minRating}+ Stars` : "Any";
        }

        // B. Filter the Array
        const filtered = allBusinessData.filter(biz => {
            // 1. Basic Geo Check
            if (!biz.latitude || !biz.longitude) return false;
            
            // 2. Favorites Only Check
            if (showFavOnly && !favorites.includes(biz.business_id)) {
                return false;
            }
            
            // 3. Rating Check
            if (biz.stars < minRating) return false;

            // 4. Search Check
            if (searchTerm) {
                const nameMatch = biz.name.toLowerCase().includes(searchTerm);
                const addressMatch = (biz.address || "").toLowerCase().includes(searchTerm);
                if (!nameMatch && !addressMatch) return false;
            }

            // 5. Cuisine Check
            if (!matchesCuisine(biz.categories, selectedCuisines)) return false;

            // 6. Features Check
            // Note: biz.attributes might be undefined for some businesses
            const attributes = biz.attributes || {};
            if (!matchesFeatures(attributes, selectedFeatures)) return false;

            return true;
        });

        console.log(`Filtered down to ${filtered.length} results.`);
        renderMap(filtered);
    }

    // --- 5. Render Map ---
    function renderMap(data) {
        markersLayer.clearLayers();
        
        // Update Sidebar Stats
        const statsCountEl = document.getElementById('stats-count');
        if (statsCountEl) {
            statsCountEl.innerText = data.length.toLocaleString(); 
        }

        data.forEach(biz => {
            const marker = L.marker([biz.latitude, biz.longitude]);
            
            const isFav = favorites.includes(biz.business_id);
            // Use different text based on state
            const favBtnText = isFav ? "❤️ Saved" : "🤍 Save to Wishlist";
            const favBtnClass = isFav ? "fav-btn is-active" : "fav-btn";

            const popupContent = `
                <div class="biz-popup">
                    <h3>${biz.name}</h3>
                    <div class="biz-rating">★ ${biz.stars} <span>(${biz.review_count} reviews)</span></div>
                    <p>📍 ${biz.address}, ${biz.city}</p>
                    <p class="biz-cat">🏷️ ${biz.categories || 'N/A'}</p>
                    <div class="popup-actions">
                        <button class="${favBtnClass}" onclick="toggleFavorite('${biz.business_id}')">
                            ${favBtnText}
                        </button>
                    </div>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            markersLayer.addLayer(marker);
        });
    }

    // --- 6. Favorites System ---
    
    // Global function attached to window for inline onclick access
    window.toggleFavorite = function(bizId) {
        if (favorites.includes(bizId)) {
            favorites = favorites.filter(id => id !== bizId);
        } else {
            favorites.push(bizId);
        }
        
        localStorage.setItem('phillyFavorites', JSON.stringify(favorites));
        
        renderFavoritesList(); // Update list if on Favorites page
        filterData(); // Re-render map to update button state
    };

    function renderFavoritesList() {
        const listContainer = document.getElementById('favorites-list');
        
        // Safety check: if container doesn't exist (e.g., on map page), exit
        if (!listContainer) return; 

        listContainer.innerHTML = '';

        if (favorites.length === 0) {
            listContainer.innerHTML = '<p class="empty-msg">No favorites yet.<br>Click the heart on a map pin!</p>';
            return;
        }

        favorites.forEach(bizId => {
            const biz = allBusinessData.find(b => b.business_id === bizId);
            if (!biz) return;

            const item = document.createElement('div');
            item.className = 'fav-item';
            item.innerHTML = `
                <span class="fav-name">${biz.name}</span>
                <span class="fav-remove" title="Remove">×</span>
            `;

            // Click to pan to location
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('fav-remove')) return; 
                // Only works if map instance is available (on main page)
                if (typeof map !== 'undefined') {
                    map.flyTo([biz.latitude, biz.longitude], 16);
                }
            });

            // Remove button handler
            item.querySelector('.fav-remove').addEventListener('click', () => {
                toggleFavorite(bizId);
            });

            listContainer.appendChild(item);
        });
    }

    // --- 7. Event Listeners ---
    
    // Cuisine Filters
    document.querySelectorAll('input[name="cuisine"]').forEach(i => {
        i.addEventListener('change', filterData);
    });

    // Feature Filters (Need to ensure HTML inputs have class 'feature-input')
    // Note: You need to update index.html to add class="feature-input" and value="tv", etc.
    document.querySelectorAll('.feature-input').forEach(i => {
        i.addEventListener('change', filterData);
    });
    
    // Rating Slider
    const slider = document.getElementById('rating-slider');
    if (slider) slider.addEventListener('input', filterData);
    
    // Search Input
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', filterData);

    // Favorites Toggle
    const favToggle = document.getElementById('fav-only-toggle');
    if (favToggle) favToggle.addEventListener('change', filterData);

    // Reset Button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // Reset Cuisines
            document.querySelectorAll('input[name="cuisine"]').forEach(i => i.checked = true);
            // Reset Features
            document.querySelectorAll('.feature-input').forEach(i => i.checked = false);
            // Reset Slider
            if (slider) slider.value = "0";
            // Reset Search
            if (searchInput) searchInput.value = "";
            // Reset Fav Toggle
            if (favToggle) favToggle.checked = false;
            
            filterData();
        });
    }

});

// --- UI Helper Functions ---

/**
 * Toggles UI state for Price Range buttons.
 * Note: Actual filtering for price is not implemented as per request, UI only.
 */
function togglePrice(el, level) {
    el.classList.toggle('selected');
    console.log("Selected Price Level:", level);
}