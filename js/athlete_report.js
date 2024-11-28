import { getAthleteReports } from './firebase.js';

function collectAthleteData() {
  const data = {};

  data.Name = document.getElementById('name-input').value.trim();
  data.Position = document.querySelector('#athlete-position select').value.trim();
  data.Status = document.getElementById('status-input').value.trim();
  data.Number = document.getElementById('number-input').value.trim();
  data.Notes = document.getElementById('coach-notes').value.trim();

  document.querySelectorAll('[id^="athlete-stat-"]').forEach((input) => {
    data[input.name] = input.value ? parseFloat(input.value) : null;
  });

  return data;
}

async function loadAthleteDropdown() {
  const dropdownMenu = document.getElementById('athlete-list');
  toggleDropdownVisibility(dropdownMenu);

  if (dropdownMenu.classList.contains('visible')) {
    dropdownMenu.innerHTML = '';
    const athletes = await getAthleteReports();

    athletes.forEach((athlete) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${athlete.Name} (${athlete.Position}) - ${athlete.Status}`;
      listItem.dataset.athlete = JSON.stringify(athlete);
      listItem.classList.add('athlete-item');
      dropdownMenu.appendChild(listItem);
    });
  }
}

function toggleDropdownVisibility(dropdownMenu) {
  dropdownMenu.classList.toggle('hidden');
  dropdownMenu.classList.toggle('visible');
}

function populateAthleteFields(athleteData) {
  // Populate demographics
  document.getElementById('name-input').value = athleteData.Name || '';
  document.getElementById('number-input').value = athleteData.Number || '';
  document.getElementById('status-input').value = athleteData.Status || '';
  document.getElementById('coach-notes').value = athleteData.Notes || '';

  // Update position
  const positionDropdown = document.querySelector('#athlete-position select');
  if (positionDropdown) {
    positionDropdown.value = athleteData.Position || '';
    positionDropdown.dispatchEvent(new Event('change'));
  }

  // Populate stats
  document.querySelectorAll('[id^="athlete-stat-"]').forEach((input) => {
    const statName = input.name;
    if (athleteData[statName] !== undefined) {
      input.value = athleteData[statName] !== null ? athleteData[statName] : '';
      input.dispatchEvent(new Event('input'));
    }
  });
}


function setupAthleteSelectionListener() {
  const dropdownMenu = document.getElementById('athlete-list');

  // Close dropdown
  document.addEventListener('click', (event) => {
    const dropdownContainer = document.getElementById('dropdown-container');

    if (!dropdownContainer.contains(event.target)) {
      dropdownMenu.classList.add('hidden');
      dropdownMenu.classList.remove('visible');
    }
  });

  // Populate input fields
  dropdownMenu.addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('athlete-item')) {
      const athleteData = JSON.parse(target.dataset.athlete);

      populateAthleteFields(athleteData);

      dropdownMenu.classList.add('hidden');
      dropdownMenu.classList.remove('visible');
    }
  });
}

export { collectAthleteData, loadAthleteDropdown, setupAthleteSelectionListener };
