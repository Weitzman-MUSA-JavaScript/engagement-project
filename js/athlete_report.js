
function collectAthleteData() {
  const data = {};

  // Collect demographics
  data.Name = document.getElementById('name-input').value.trim();
  data.Position = document.querySelector('#athlete-position select').value.trim();
  data.Status = document.getElementById('status-input').value.trim();
  data.Number = document.getElementById('number-input').value.trim();
  data.Notes = document.getElementById('coach-notes').value.trim();

  // Collect stats
  document.querySelectorAll('[id^="athlete-stat-"]').forEach((input) => {
    data[input.name] = input.value ? parseFloat(input.value) : null;
  });

  return data;
}

export { collectAthleteData };
