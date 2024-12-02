function initStatEntry(statListEl, positionDropdownEl, stats, positions, events) {
  const listEl = statListEl.querySelector(`ul`);
  const positionEl = positionDropdownEl.querySelector(`div#athlete-position`);
  const statListItems = {};
  const positionPositionItems = {};

  // Default notes for each position
  const positionNotes = {
    OL: `QUICKNESS / TWITCH\nFEET QUICKNESS\nANKLE & KNEE BEND\nBALANCE - BODY CONTROL\nHIP ROLL / EXPLOSION\nLATERAL MOVEMENT\nCHANGE OF DIRECTION\nATHLETIC ABILITY`,
    RB: `INITIAL QUICKNESS\nBALANCE / BODY CONTROL\nINSIDE RUNNER\nPOWER / BREAK TACKLE\nAVOIDABILITY - ELUSIVENESS\nOUTSIDE RUNNER\nACCELERATION - BURST\nHANDS\nPASS PRO VS BLITZ\nRUN BLOCK (ISO - LEAD)`,
    TE: `RUN BLOCKING\nINITIAL QUICKNESS\nSUSTAIN - FINISH\nCHANGE OF DIRECTION\nTOUGHNESS\nBALANCE - BODY CONTROL\nFLEXIBILITY\nDEEP THREAT - SPEED\nADJUST TO BALL\nROUTE RUNNING\nINSTINCTS / AWARENESS`,
    WR: `TOUGHNESS\nHANDS\nABILITY TO ADJUST / ADAPT\nCHANGE OF DIRECTION\nACCELERATION / BURST\nRUN AFTER CATCH / BALL SKILLS\nBLOCKING\nINSTINCTS\nINITIAL QUICKNESS\nRELEASES (L.O.S)`,
    QB: `TOUGHNESS\nACCURACY\nARM WHIP\nQUICK FEET\nATHLETIC\nQUICK TWITCH (GETS IT OUT)\nTHROWS ARE ON TIME\nMOXIE / DEMEANOR`,
    DL: `INITIAL QUICKNESS\nREACT / RECOGNITION\nLATERAL QUICKNESS\nBALANCE / BODY CONTROL\nBURST / CLOSING SPEED\nHAND USE /SHED\nDOUBLE TEAM / ANCHOR\nTACKLING\nPASS RUSH ABILITY\nTOUGHNESS\nMOTOR`,
    LB: `READ / REACT\nC.O.D. / MOTOR\nCLOSING SPEED\nSTRENGTH / POINT OF ATTACK\nBALANCE / ANKLE FLEXIBILITY\nBURST / ACCELERATION\nEXPLOSION / STRENGTH\nLATERAL QUICKNESS\nTACKLING\nBLITZ / RUSH ABILITY\nCOVERAGE / RANGE\nTOUGHNESS / EXPLOSIVE\nBALL SKILLS`,
    DB: `BALL JUDGEMENT\nPLANT AND DRIVE\nBURST TO CLOSE\nABILITY TO PLAY MAN TO MAN\nTACKLING\nUNDERSTAND ZONES\nREACTION\nRUN SUPPORT\nBALANCE / BODY CONTROL\nSPECIAL TEAMS VALUE\nSHORT SPACE QUICKNESS`,
    SP: ` `,
  };

  // Sort positions alphabetically
  positions = positions.sort((a, b) => a.localeCompare(b));

  const inputEl = document.querySelectorAll(`#athlete-position, #name-input, #status-input, #number-input, #coach-notes`);

  inputEl.forEach((input) => {
    input.style.boxSizing = `content-box`;

    if (input.id !== `coach-notes`) {
      resetDefaultValue.call(input);
      resizeInput.call(input);
      input.addEventListener(`input`, resizeInput);
      input.addEventListener(`blur`, applyDefaultValue);
    }

    if (input.id === `name-input` || input.id === `number-input`) {
      input.addEventListener(`focus`, clearPlaceholder);
    }

    if (input.id === `coach-notes`) {
      input.addEventListener(`focus`, clearNotesPlaceholder);
      input.addEventListener(`blur`, restoreNotesPlaceholder);
    }
  });

  /* Utility Functions */
  function clearPlaceholder() {
    if (this.id === `name-input` && this.value === `Athlete Name`) this.value = ``;
    if (this.id === `number-input` && this.value === `#`) this.value = ``;
  }

  function clearNotesPlaceholder() {
    const coachNotesField = this;
    const positionDropdown = document.querySelector(`#athlete-position select`);
    const currentPosition = positionDropdown.value || `DB`;

    if (coachNotesField.value === positionNotes[currentPosition]) {
      coachNotesField.value = ``;
    }
  }

  function restoreNotesPlaceholder() {
    const positionDropdown = document.querySelector(`#athlete-position select`);
    const currentPosition = positionDropdown.value || `DB`;
    const coachNotesField = document.querySelector(`#coach-notes`);

    if (coachNotesField.value.trim() === `` && positionNotes[currentPosition]) {
      coachNotesField.value = positionNotes[currentPosition];
    }
  }

  function resizeInput() {
    if (this.tagName !== `INPUT` && this.tagName !== `SELECT`) return;
    const canvas = document.createElement(`canvas`);
    const context = canvas.getContext(`2d`);
    context.font = window.getComputedStyle(this).font;
    const textWidth = context.measureText(this.value || ``).width;
    this.style.width = `${Math.max(textWidth + 15, 50)}px`;
  }

  function resetDefaultValue() {
    if (this.id === `athlete-position`) this.value = `DB`;
    if (this.id === `name-input`) this.value = `Athlete Name`;
    if (this.id === `number-input`) this.value = `#`;
  }

  function applyDefaultValue() {
    if (!this.value) resetDefaultValue.call(this);
    resizeInput.call(this);
  }

  function getUnit(stat) {
    const unitMapping = {
      lbs: [`Bench`, `Squat`, `Power Clean`, `Hang Clean`, `Weight`],
      reps: [`225lb Bench`],
      in: [`Vertical Jump`, `Broad Jump`, `Height`, `Wingspan`],
      s: [`10Y Sprint`, `60Y Shuttle`, `L Drill`, `Pro Agility`, `Flying 10`],
    };

    for (const [unit, stats] of Object.entries(unitMapping)) {
      if (stats.includes(stat)) {
        return unit;
      }
    }
    return ``;
  }

  /* Initialize Stat List Items */
  function initListItems() {
    const orderedStats = [
      `Weight`, `Height`, `Wingspan`,
      `Bench`, `Squat`, `225lb Bench`,
      `Vertical Jump`, `Broad Jump`, `Hang Clean`, `Power Clean`,
      `10Y Sprint`, `Flying 10`,
      `Pro Agility`, `L Drill`, `60Y Shuttle`,
    ];

    for (const stat of orderedStats) {
      if (stats.includes(stat)) {
        const unit = getUnit(stat);
        const item = document.createElement(`li`);
        item.innerHTML = `
          <label>
              ${stat}
           </label>
              <div class="input-wrapper">
                  <input type="number" id="athlete-stat-${stat}" name="${stat}" max="1000" step="any">
                  <span class="unit">${unit}</span>
              </div>`;
        statListItems[stat] = item;
      }
    }
  }

  /* Initialize Position Items */
  function initPositionItems() {
    const selectEl = document.createElement(`select`);
    selectEl.name = `position`;
    positions.forEach((position) => {
      const option = document.createElement(`option`);
      option.value = position;
      option.textContent = position;
      selectEl.appendChild(option);
    });
    return selectEl;
  }

  /* Populate Position */
  function populatePosition() {
    positionEl.innerHTML = ``;
    const position = initPositionItems();
    positionEl.appendChild(position);
    position.addEventListener(`change`, handlePositionChange);
  }

  /* Populate Stat List */
  function populateList(stats) {
    const statCategories = {
      anthropometrics: [`Weight`, `Height`, `Wingspan`],
      strength: [`Bench`, `Squat`, `225lb Bench`],
      power: [`Vertical Jump`, `Broad Jump`, `Hang Clean`, `Power Clean`],
      speed: [`10Y Sprint`, `Flying 10`],
      agility: [`Pro Agility`, `L Drill`, `60Y Shuttle`],
    };

    const orderedStats = [
      `Weight`, `Height`, `Wingspan`,
      `Bench`, `Squat`, `225lb Bench`,
      `Vertical Jump`, `Broad Jump`, `Hang Clean`, `Power Clean`,
      `10Y Sprint`, `Flying 10`,
      `Pro Agility`, `L Drill`, `60Y Shuttle`,
    ];

    listEl.innerHTML = ``;
    const categoryAdded = new Set();

    for (const stat of orderedStats) {
      // Skip stats that are not in the provided stats list
      if (!stats.includes(stat)) continue;

      // Add category labels if not already added
      for (const [category, categoryStats] of Object.entries(statCategories)) {
        if (categoryStats.includes(stat) && !categoryAdded.has(category)) {
          const labelEl = document.createElement(`li`);
          labelEl.className = `stat-category-label`;
          labelEl.textContent = category.charAt(0).toUpperCase() + category.slice(1);
          listEl.appendChild(labelEl);
          categoryAdded.add(category);
        }
      }

      // Append the stat item
      if (statListItems[stat]) {
        listEl.appendChild(statListItems[stat]);
      }
    }
  }

  /* Event Handlers */
  function handlePositionChange(evt) {
    const selectedPosition = evt.target.value;
    const coachNotesField = document.querySelector(`#coach-notes`);
    if (positionNotes[selectedPosition]) {
      coachNotesField.value = positionNotes[selectedPosition];
    }
    events.dispatchEvent(new CustomEvent(`positionSelected`, { detail: { position: selectedPosition } }));
  }

  function handleNumEntry(evt) {
    const numInput = evt.target;
    const statName = numInput.name;
    const filled = numInput.value.trim() !== `` && parseFloat(numInput.value) > 0;
    const statValue = filled ? parseFloat(numInput.value) : null;

    numInput.setCustomValidity(``);
    if (!numInput.checkValidity() || parseFloat(numInput.value) <= 0) {
      numInput.setCustomValidity(`Please enter a valid number`);
      numInput.reportValidity();
      return;
    }

    events.dispatchEvent(new CustomEvent(`statFilled`, { detail: { statName, filled, statValue } }));
  }

  function clearAllStats() {
    Object.values(statListItems).forEach((item) => {
      const input = item.querySelector(`input`);
      input.value = ``;
      input.dispatchEvent(new Event(`input`));
    });
  }

  /* Initialization */
  const clearAllButton = document.getElementById(`clear-all`);
  if (clearAllButton) {
    clearAllButton.addEventListener(`click`, clearAllStats);
  }

  initPositionItems();
  initListItems();
  populatePosition();
  populateList(stats);

  Object.values(statListItems).forEach((item) => {
    item.querySelector(`input`).addEventListener(`input`, handleNumEntry);
  });

  Object.values(positionPositionItems).forEach((item) => {
    item.querySelector(`input`).addEventListener(`change`, handlePositionChange);
  });
}

export { initStatEntry };
