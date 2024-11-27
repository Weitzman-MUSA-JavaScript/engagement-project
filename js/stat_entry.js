function initStatEntry(statListEl, positionDropdownEl, stats, positions, events) {
  const listEl = statListEl.querySelector('ul');
  const positionEl = positionDropdownEl.querySelector('div#athlete-position');
  const statListItems = {};
  const positionPositionItems = {};

  // Sort positions alphabetically
  positions = positions.sort((a, b) => a.localeCompare(b));

  // Input elements for dynamic resizing and default handling
  const inputEl = document.querySelectorAll('#athlete-position, #name-input, #status-input, #number-input');

  inputEl.forEach((input) => {
    input.style.boxSizing = 'content-box';
    applyDefaultValue.call(input);
    resizeInput.call(input);
    input.addEventListener('input', resizeInput);
    input.addEventListener('blur', applyDefaultValue);
  });

  function resizeInput() {
    if (this.tagName !== 'INPUT' && this.tagName !== 'SELECT') {
      return; // Skip elements that are not inputs or selects
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const font = window.getComputedStyle(this).font;
    context.font = font;
    const textWidth = context.measureText(this.value || '').width;
    const padding = 10;
    const minWidth = 50;
    this.style.width = Math.max(textWidth + padding, minWidth) + 'px';
  }


  function applyDefaultValue() {
    if (!this.value) {
      if (this.id === 'athlete-position') this.value = 'Defensive Back';
      if (this.id === 'name-input') this.value = 'Athlete Name';
      if (this.id === 'number-input') this.value = '#';
      resizeInput.call(this);
    }
  }

  // Ordered list of stats
  const orderedStats = [
    'Weight', 'Height', 'Wingspan',
    'Bench', 'Squat', '225lb Bench',
    'Vertical Jump', 'Broad Jump', 'Hang Clean', 'Power Clean',
    '10Y Sprint', 'Flying 10',
    'Pro Agility', 'L Drill', '60Y Shuttle',
  ];

  // Units for stats
  const unitMapping = {
    pounds: ['Bench', 'Squat', 'Power Clean', 'Hang Clean', 'Weight'],
    reps: ['225lb Bench'],
    inches: ['Vertical Jump', 'Broad Jump', 'Height', 'Wingspan'],
    seconds: ['10Y Sprint', '60Y Shuttle', 'L Drill', 'Pro Agility', 'Flying 10'],
  };

  function getUnit(stat) {
    if (unitMapping.pounds.includes(stat)) return 'lbs';
    if (unitMapping.reps.includes(stat)) return 'reps';
    if (unitMapping.inches.includes(stat)) return 'in';
    if (unitMapping.seconds.includes(stat)) return 's';
    return '';
  }

  function updatePositionTitle(position) {
    const titleEl = document.getElementById('position-title');
    if (titleEl) titleEl.textContent = position;
  }

  function initListItems() {
    for (const stat of orderedStats) {
      if (stats.includes(stat)) {
        const unit = getUnit(stat);
        const item = document.createElement('li');
        item.innerHTML = `
          <label>
              ${stat}
              <div class="input-wrapper">
                  <input type="number" id="athlete-stat-${stat}" name="${stat}" max="1000" step="any">
                  <span class="unit">${unit}</span>
              </div>
          </label>
        `;
        statListItems[stat] = item;
      }
    }
  }

  function initPositionItems() {
    const selectEl = document.createElement('select');
    selectEl.name = 'position';
    for (const position of positions) {
      const option = document.createElement('option');
      option.value = position;
      option.textContent = position;
      selectEl.appendChild(option);
    }
    return selectEl;
  }

  function populateList(stats) {
    const statCategories = {
      anthropometrics: ['Weight', 'Height', 'Wingspan'],
      strength: ['Bench', 'Squat', '225lb Bench'],
      speed: ['10Y Sprint', 'Flying 10'],
      agility: ['Pro Agility', 'L Drill', '60Y Shuttle'],
      power: ['Vertical Jump', 'Broad Jump', 'Hang Clean', 'Power Clean'],
    };

    listEl.innerHTML = '';
    const categoryAdded = new Set();

    for (const stat of orderedStats) {
      if (stats.includes(stat)) {
        for (const [category, categoryStats] of Object.entries(statCategories)) {
          if (categoryStats.includes(stat) && !categoryAdded.has(category)) {
            const labelEl = document.createElement('li');
            labelEl.className = 'stat-category-label';
            labelEl.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            listEl.appendChild(labelEl);
            categoryAdded.add(category);
          }
        }
        listEl.appendChild(statListItems[stat]);
      }
    }
  }

  function populatePosition() {
    positionEl.innerHTML = '';
    const position = initPositionItems();
    positionEl.appendChild(position);
    position.addEventListener('change', handlePositionChange);
  }

  function handleNumEntry(evt) {
    const numInput = evt.target;
    const statName = numInput.name;
    const filled = numInput.value.trim() !== '' && parseFloat(numInput.value) > 0;
    const statValue = filled ? parseFloat(numInput.value) : null;

    numInput.setCustomValidity('');
    if (!numInput.checkValidity() || parseFloat(numInput.value) <= 0) {
      numInput.setCustomValidity('Please enter a valid number');
      numInput.reportValidity();
      return;
    }

    const event = new CustomEvent('statFilled', { detail: { statName, filled, statValue } });
    events.dispatchEvent(event);
  }

  function handlePositionChange(evt) {
    const selectedPosition = evt.target.value;
    const event = new CustomEvent('positionSelected', { detail: { position: selectedPosition } });
    events.dispatchEvent(event);
    updatePositionTitle(selectedPosition);

    const selectedText = evt.target.selectedOptions[0].text;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const font = window.getComputedStyle(evt.target).font;
    context.font = font;
    const textWidth = context.measureText(selectedText).width;
    const padding = 10;
    evt.target.style.width = textWidth + padding + 'px';
  }

  // Initialize position and stat list
  initPositionItems();
  initListItems();
  populatePosition();
  populateList(stats);

  // Add event listeners for stats and positions
  for (const item of Object.values(statListItems)) {
    item.querySelector('input').addEventListener('input', handleNumEntry);
  }

  for (const item of Object.values(positionPositionItems)) {
    item.querySelector('input').addEventListener('change', handlePositionChange);
  }
}

export { initStatEntry };
