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
  // Populate demographic fields
  document.getElementById('name-input').value = athleteData.Name || '';
  document.getElementById('number-input').value = athleteData.Number || '';
  document.getElementById('status-input').value = athleteData.Status || '';
  document.getElementById('coach-notes').value = athleteData.Notes || '';

  // Update position dropdown
  const positionDropdown = document.querySelector('#athlete-position select');
  if (positionDropdown) {
    positionDropdown.value = athleteData.Position || 'DB';
    positionDropdown.dispatchEvent(new Event('change'));
  }

  // Populate stat fields
  document.querySelectorAll('[id^="athlete-stat-"]').forEach((input) => {
    const statName = input.name;
    if (athleteData[statName] !== undefined) {
      input.value = athleteData[statName] !== null ? athleteData[statName] : '';
      input.dispatchEvent(new Event('input'));
    }
  });

  // Resize demographic inputs
  const inputsToResize = ['#name-input', '#number-input', '#status-input'];
  inputsToResize.forEach((selector) => {
    const input = document.querySelector(selector);
    if (input) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const font = window.getComputedStyle(input).font;
      context.font = font;
      const textWidth = context.measureText(input.value || '').width;
      const padding = 15;
      const minWidth = 50;
      input.style.width = `${Math.max(textWidth + padding, minWidth)}px`;
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

export { collectAthleteData, loadAthleteDropdown, setupAthleteSelectionListener, populateAthleteFields };
