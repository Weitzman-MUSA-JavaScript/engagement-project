function initStatEntry(statListEl, positionDropdownEl, stats, positions, events) {
  const listEl = statListEl.querySelector('ul');
  const positionEl = positionDropdownEl.querySelector('div#athlete-position');
  const statListItems = {};
  const positionPositionItems = {};

  positions = positions.sort((a, b) => a.localeCompare(b));

  const inputEl = document.querySelectorAll('#athlete-position, #name-input, #status-input, #number-input');

  inputEl.forEach((input) => {
    input.style.boxSizing = 'content-box';
    resetDefaultValue.call(input);
    resizeInput.call(input);
    input.addEventListener('input', resizeInput);
    input.addEventListener('blur', applyDefaultValue);
    if (input.id === 'name-input' || input.id === 'number-input') {
      input.addEventListener('focus', clearPlaceholder);
    }
  });

  function clearPlaceholder() {
    if (this.id === 'name-input' && this.value === 'Athlete Name') this.value = '';
    if (this.id === 'number-input' && this.value === '#') this.value = '';
  }

  function resizeInput() {
    if (this.tagName !== 'INPUT' && this.tagName !== 'SELECT') return;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = window.getComputedStyle(this).font;
    const textWidth = context.measureText(this.value || '').width;
    this.style.width = `${Math.max(textWidth + 15, 50)}px`;
  }

  function resetDefaultValue() {
    if (this.id === 'athlete-position') this.value = 'DB';
    if (this.id === 'name-input') this.value = 'Athlete Name';
    if (this.id === 'number-input') this.value = '#';
  }

  function applyDefaultValue() {
    if (!this.value) resetDefaultValue.call(this);
    resizeInput.call(this);
  }

  const orderedStats = [
    'Weight', 'Height', 'Wingspan',
    'Bench', 'Squat', '225lb Bench',
    'Vertical Jump', 'Broad Jump', 'Hang Clean', 'Power Clean',
    '10Y Sprint', 'Flying 10',
    'Pro Agility', 'L Drill', '60Y Shuttle',
  ];

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
          </label>`;
        statListItems[stat] = item;
      }
    }
  }

  function initPositionItems() {
    const selectEl = document.createElement('select');
    selectEl.name = 'position';
    positions.forEach((position) => {
      const option = document.createElement('option');
      option.value = position;
      option.textContent = position;
      selectEl.appendChild(option);
    });
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

    orderedStats.forEach((stat) => {
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
    });
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

    events.dispatchEvent(new CustomEvent('statFilled', { detail: { statName, filled, statValue } }));
  }

  function handlePositionChange(evt) {
    const selectedPosition = evt.target.value;
    events.dispatchEvent(new CustomEvent('positionSelected', { detail: { position: selectedPosition } }));
  }

  function clearAllStats() {
    Object.values(statListItems).forEach((item) => {
      const input = item.querySelector('input');
      input.value = '';
      input.dispatchEvent(new Event('input'));
    });
  }

  const clearAllButton = document.getElementById('clear-all');
  if (clearAllButton) {
    clearAllButton.addEventListener('click', clearAllStats);
  }

  initPositionItems();
  initListItems();
  populatePosition();
  populateList(stats);

  Object.values(statListItems).forEach((item) => {
    item.querySelector('input').addEventListener('input', handleNumEntry);
  });

  Object.values(positionPositionItems).forEach((item) => {
    item.querySelector('input').addEventListener('change', handlePositionChange);
  });
}

export { initStatEntry };

