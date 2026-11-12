import { kinds, topics, places, seedContributions, searchPlaces, validateLocation, validateDescription, responseOptions, responseSummary, filterContributions, escapeText as esc } from './data.js';
import { readDemo, saveDemo, putContribution, putResponse } from './storage.js';
import { mapMarkup, mapPoint } from './map.js';

const main = document.querySelector('#main');
const status = document.querySelector('#status');
let storage;
try { storage = window.localStorage; } catch { storage = null; }
let data = readDemo(storage);
let mode = 'list';
let selectedId = null;
let draft = null;
let searchResults = [];
const filters = { topic: '', session: '' };
const responseDrafts = {};

const allPins = () => [...seedContributions.slice(0, 3), ...data.contributions.filter((pin) => kinds[pin.kind] && topics[pin.topic] && !validateLocation(pin.location))];
const visiblePins = () => filterContributions(allPins(), filters);
const options = (values, selected, allLabel) => `${allLabel ? `<option value="">${allLabel}</option>` : '<option value="">Choose one</option>'}${Object.entries(values).map(([key, label]) => `<option value="${key}" ${key === selected ? 'selected' : ''}>${esc(label)}</option>`).join('')}`;

function announce(message) { status.textContent = message; }
function focusPanel() { document.querySelector('#panel-heading').focus(); }
function selectedPin() { return allPins().find((pin) => pin.id === selectedId); }

function render() {
  main.innerHTML = `<div class="filters"><label for="topic-filter">Topic<select id="topic-filter">${options(topics, filters.topic, 'All topics')}</select></label><label for="session-filter">Session<select id="session-filter">${options({ earlier: 'Earlier example session', today: 'Current example session' }, filters.session, 'All example sessions')}</select></label><button type="button" id="clear-filters">Clear filters</button></div>
    <div class="workspace"><section class="panel map-section" aria-labelledby="map-heading"><h2 id="map-heading">Map</h2><div id="map-content"></div><p class="note map-note" id="map-instructions"></p><button type="button" id="go-to-panel">Go to contributions or form</button></section><section class="panel" id="content-panel" aria-labelledby="panel-heading"></section></div>`;
  document.querySelector('#topic-filter').addEventListener('change', (event) => { filters.topic = event.target.value; updateMap(); if (mode === 'list') renderList(); announce(`${visiblePins().length} contributions match.`); });
  document.querySelector('#session-filter').addEventListener('change', (event) => { filters.session = event.target.value; updateMap(); if (mode === 'list') renderList(); announce(`${visiblePins().length} contributions match.`); });
  document.querySelector('#clear-filters').addEventListener('click', () => {
    filters.topic = ''; filters.session = '';
    document.querySelector('#topic-filter').value = ''; document.querySelector('#session-filter').value = '';
    updateMap(); if (mode === 'list') renderList(); announce('Filters cleared.');
  });
  document.querySelector('#go-to-panel').addEventListener('click', focusPanel);
  updateMap(); renderPanel();
}

function updateMap() {
  document.querySelector('#map-content').innerHTML = mapMarkup({ pins: mode === 'add' ? [] : visiblePins(), selected: mode === 'add' ? draft?.location : selectedPin(), placement: mode === 'add' });
  document.querySelector('#map-instructions').textContent = mode === 'add' ? 'Click or tap to place a pin. You can also choose a location using the form.' : 'Select a numbered pin or read the same contributions in the list.';
}

function renderPanel() {
  if (mode === 'add') renderForm();
  else if (mode === 'detail' && selectedPin()) renderDetail();
  else renderList();
}

function renderList() {
  mode = 'list';
  const pins = visiblePins();
  document.querySelector('#content-panel').innerHTML = `<div class="panel-heading"><h2 id="panel-heading" tabindex="-1">Contributions (${pins.length})</h2><button type="button" id="add-place">Add a place</button></div>${pins.length ? pins.map((pin, index) => `<article class="contribution"><h3>${index + 1}. ${esc(pin.location.label)}</h3><p>${kinds[pin.kind].label} · ${topics[pin.topic]}</p><p>${esc(pin.description.slice(0, 105))}${pin.description.length > 105 ? '…' : ''}</p><button type="button" data-pin="${esc(pin.id)}">Read and respond</button></article>`).join('') : '<p>No contributions match. Try another topic or clear the filters.</p>'}`;
  document.querySelector('#add-place').addEventListener('click', startAdd);
}

function startAdd() {
  mode = 'add'; selectedId = null;
  if (!draft) draft = { id: crypto.randomUUID(), location: null, kind: '', topic: '', description: '', context: '' };
  updateMap(); renderForm(); focusPanel();
}

function renderForm() {
  document.querySelector('#content-panel').innerHTML = `<h2 id="panel-heading" tabindex="-1">Add a place</h2><div id="form-errors"></div>
    <form id="place-search-form"><label for="place-search">Find a place</label><div class="search-row"><input type="text" id="place-search" aria-describedby="search-help"><button type="submit">Search</button></div><p class="note" id="search-help">Example search: “Clark Park” or “46th and Baltimore.”</p><div id="search-feedback" role="status"></div><ul class="search-results" id="search-results">${searchResults.map((place) => `<li><button type="button" data-location="${place.id}">${esc(place.label)}</button></li>`).join('')}</ul></form>
    <form id="contribution-form" novalidate><div class="selected-place"><label for="place-label">Selected place / nearby intersection</label><input type="text" id="place-label" value="${esc(draft.location?.label || '')}" maxlength="120"><p class="note">Choose a search result or place a pin, then check this name.</p></div>
    <label for="kind">Contribution type<select id="kind">${options(Object.fromEntries(Object.entries(kinds).map(([key, value]) => [key, value.label])), draft.kind)}</select></label>
    <label for="topic">Topic<select id="topic">${options(topics, draft.topic)}</select></label>
    <label for="description">Description<textarea id="description" maxlength="600" aria-describedby="description-help">${esc(draft.description)}</textarea></label><p class="note" id="description-help">What matters about this place? Leave out names and private details.</p>
    <div class="actions"><button type="submit" id="save-contribution">Save example</button><button type="button" id="cancel-add">Cancel</button></div></form>`;
  document.querySelector('#place-search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    searchResults = searchPlaces(document.querySelector('#place-search').value);
    document.querySelector('#search-results').innerHTML = searchResults.map((place) => `<li><button type="button" data-location="${place.id}">${esc(place.label)}</button></li>`).join('');
    document.querySelector('#search-feedback').textContent = searchResults.length ? `${searchResults.length} example places found.` : 'No example match. Try “Walnut” or place a pin.';
  });
  document.querySelector('#contribution-form').addEventListener('input', captureDraft);
  document.querySelector('#contribution-form').addEventListener('change', captureDraft);
  document.querySelector('#cancel-add').addEventListener('click', () => { captureDraft(); mode = 'list'; updateMap(); renderList(); focusPanel(); });
  document.querySelector('#contribution-form').addEventListener('submit', (event) => {
    event.preventDefault(); captureDraft();
    const locationError = validateLocation(draft.location);
    const problems = validateDescription(draft).map((problem) => ({ ...problem, field: problem.field.startsWith('kind-') ? 'kind' : problem.field.startsWith('topic-') ? 'topic' : problem.field }));
    if (locationError) problems.unshift({ field: 'place-label', message: locationError });
    if (problems.length) { showErrors(problems); return; }
    const pin = { ...draft, title: draft.location.label, description: draft.description.trim(), session: 'today', date: new Date().toISOString(), exampleCounts: [0, 0, 0], synthetic: false };
    if (!persist(putContribution(data, pin), 'save-contribution')) return;
    selectedId = pin.id; draft = null; mode = 'detail'; searchResults = [];
    updateMap(); renderDetail(); focusPanel(); announce('Example saved in this browser.');
  });
}

function captureDraft() {
  if (!draft || !document.querySelector('#contribution-form')) return;
  for (const field of ['kind', 'topic', 'description']) draft[field] = document.getElementById(field).value;
  if (draft.location) draft.location.label = document.querySelector('#place-label').value.trim();
}

function showErrors(problems) {
  const target = document.querySelector('#form-errors');
  target.innerHTML = `<div class="error" tabindex="-1"><strong>Check these fields:</strong><ul>${problems.map((problem) => `<li><a href="#${problem.field}" data-error="${problem.field}">${esc(problem.message)}</a></li>`).join('')}</ul></div>`;
  target.querySelector('.error').focus();
}

function persist(next, field) {
  try { saveDemo(storage, next); data = next; return true; } catch { showErrors([{ field, message: 'Could not save. Your input is still here. Check whether browser storage is available and try again.' }]); return false; }
}

function renderDetail() {
  const pin = selectedPin();
  const response = responseDrafts[pin.id] || data.responses[pin.id];
  const wording = responseOptions(pin.kind);
  const summary = responseSummary(pin, data.responses[pin.id]);
  document.querySelector('#content-panel').innerHTML = `<div class="panel-heading"><h2 id="panel-heading" tabindex="-1">${esc(pin.location.label)}</h2><button type="button" id="back-to-list">Back</button></div><p>${kinds[pin.kind].label} · ${topics[pin.topic]}</p><p>${esc(pin.description)}</p><p class="note">${pin.synthetic ? 'Fictional contribution · earlier example session' : 'Your example · current session'}</p><div id="form-errors"></div>
    <form id="response-form" novalidate><fieldset><legend>${wording.question}</legend>${wording.labels.map((label, index) => `<label class="response-choice"><input type="radio" id="answer-${index}" name="answer" value="${index}" ${response?.answer === index ? 'checked' : ''}><span>${esc(label)}</span></label>`).join('')}</fieldset><label for="response-note">Comment (optional)<textarea id="response-note" maxlength="400">${esc(response?.note || '')}</textarea></label><button type="submit" id="save-response">Save response</button></form>
    <div class="summary"><h3>Responses</h3><p class="note">Starting counts are fictional. Your saved example response is included, if present.</p>${wording.labels.map((label, index) => `<div class="summary-row"><span>${esc(label)}</span><strong>${summary.counts[index]}</strong></div>`).join('')}<p class="note">${summary.total} answers to this question. These do not represent community-wide agreement.</p></div>`;
  document.querySelector('#back-to-list').addEventListener('click', () => { mode = 'list'; selectedId = null; updateMap(); renderList(); focusPanel(); });
  document.querySelector('#response-form').addEventListener('input', () => {
    const answer = new FormData(document.querySelector('#response-form')).get('answer');
    responseDrafts[pin.id] = { answer: answer === null ? null : Number(answer), note: document.querySelector('#response-note').value };
  });
  document.querySelector('#response-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const answer = new FormData(event.currentTarget).get('answer');
    if (answer === null) { showErrors([{ field: 'answer-0', message: 'Choose a response, or keep browsing without answering.' }]); return; }
    if (!persist(putResponse(data, pin.id, Number(answer), document.querySelector('#response-note').value.trim()), 'save-response')) return;
    delete responseDrafts[pin.id]; renderDetail(); document.querySelector('#save-response').focus(); announce('Response saved in this browser. You can change it.');
  });
}

main.addEventListener('click', (event) => {
  const error = event.target.closest('[data-error]');
  if (error) { event.preventDefault(); document.getElementById(error.dataset.error)?.focus(); return; }
  const pinButton = event.target.closest('[data-pin]');
  if (pinButton) { if (mode === 'add') captureDraft(); selectedId = pinButton.dataset.pin; mode = 'detail'; updateMap(); renderDetail(); focusPanel(); return; }
  const locationButton = event.target.closest('[data-location]');
  if (locationButton) {
    captureDraft(); draft.location = { ...places.find((place) => place.id === locationButton.dataset.location), source: 'example-place-search' };
    document.querySelector('#place-label').value = draft.location.label; updateMap(); announce(`${draft.location.label} selected.`); return;
  }
  const map = event.target.closest('.map-diagram');
  if (map && mode === 'add') {
    captureDraft(); draft.location = mapPoint(event, map); updateMap(); document.querySelector('#place-label').value = ''; document.querySelector('#place-label').focus(); announce('Pin placed. Name the place or intersection.');
  }
});

document.querySelector('.skip-link').addEventListener('click', (event) => { event.preventDefault(); main.focus(); });
render();
