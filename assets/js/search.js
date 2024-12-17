export function initializeSearch(searchInputId, suggestionsListId, getLocationNames, highlightLocationCallback) {
    const searchInput = document.getElementById(searchInputId);
    const suggestionsList = document.getElementById(suggestionsListId);

    function handleSearchInput() {
        const query = this.value.toLowerCase();
        suggestionsList.innerHTML = ''; // Clear previous suggestions

        if (query === '') {
            return;
        }

        // Retrieve the latest locationNames using the getter function
        const locationNames = getLocationNames();

        // Filter locationNames based on the query
        const filtered = locationNames.filter(name => name.toLowerCase().includes(query));

        // Limit to top 10 suggestions
        filtered.slice(0, 10).forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            li.addEventListener('click', () => {
                searchInput.value = name;
                suggestionsList.innerHTML = '';
                highlightLocationCallback(name);
            });
            suggestionsList.appendChild(li);
        });
    }

    /**
     * Closes the suggestions list when clicking outside the search container.
     */
    function closeSuggestions(e) {
        if (!e.target.closest('.search-container')) {
            suggestionsList.innerHTML = '';
        }
    }

    searchInput.addEventListener('input', handleSearchInput);
    document.addEventListener('click', closeSuggestions);

    
}
