import { formatSessionDate } from './session-date.js';
import { GroupReview } from './group-review.js';
import { containTabFocus, createConfirmationDialog } from './dialogs.js';
import { createDraftStore } from './draft-store.js';
import { KINDS, TOPICS, SESSIONS, responseQuestion, contributionPrompt, escapeText as esc } from './domain.js';
import { GeographicMap } from './map.js';
import { LatestRequest } from './requests.js';
import { filterContributions, describeContributionView, summarizeContributionView, initContributionFilters } from './contribution-view.js';
import { createAppDataService } from './app-data-service.js';
import { initPlaceSearch } from './place-search.js';
import { COORDINATE_CRS, PHILADELPHIA_BOUNDS, isPhiladelphiaPoint } from './geography.js';

const $ = (selector) => document.querySelector(selector);
const panel = $('#task-panel');
const confirmAction = createConfirmationDialog($('#confirm-dialog'));
const pageTitle = document.title;
const loadedSessionDate = formatSessionDate();
$('#join-session option[value="practice-current"]').textContent = `Community safety practice session - ${loadedSessionDate}`;
let token = '';
let activeSession = 'practice-current';
let state = { phase: 'contribute', contributions: [] };
let mode = 'list';
let draft = null;
let detail = null;
let busy = false;
let placeSearch = null;
let filter = {};
let listLayout = 'list';
const setExportAvailability = (disabled) => document.querySelectorAll('[data-export]').forEach((button) => { button.disabled = disabled; });
let activeMap = 'saved';
let savedMapSelection = null;
let draftMapId = null;
const responseDrafts = new Map();
const draftStore = createDraftStore(() => sessionStorage, () => draftStorageStatus(false));
const detailLoadingMessage = 'Loading the selected account. Your unsaved input is kept.';
const detailReads = new LatestRequest((pending) => {
  if (pending) { panel.setAttribute('aria-busy', 'true'); $('#status').textContent = detailLoadingMessage; } else if (!busy) panel.removeAttribute('aria-busy');
  if (!pending && $('#status').textContent === detailLoadingMessage) $('#status').textContent = '';
});
const stateReads = new LatestRequest();
const sessionName = (id) => SESSIONS.find((s) => s.id === id)?.title || id;
const dateLabel = (value) => new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const options = (values, current, first) => `<option value="">${first}</option>${Object.entries(values).map(([key, label]) => `<option value="${key}" ${current === key ? 'selected' : ''}>${esc(label)}</option>`).join('')}`;
const visiblePins = () => filterContributions(state.contributions, filter);
const announce = (text) => { $('#status').textContent = text; };
const focusPanel = () => $('#task-heading')?.focus();
const errorSlot = (id) => `<span id="${id}-error" class="field-error"></span>`;

const api = createAppDataService(() => ({ origin: location.origin, token, activeSession }));
function draftStorageStatus(available) {
  const message = available
    ? 'Unsaved writing is kept in this browser tab for recovery after a refresh. Use Finish on this device to clear it before sharing the device.'
    : 'This browser cannot keep a recovery copy. Keep this page open and copy unsaved writing before leaving.';
  if ($('#draft-storage-status').textContent !== message) $('#draft-storage-status').textContent = message;
}
function remember() {
  const saved = draftStore.save({ token, activeSession, draft, responseDrafts: [...responseDrafts], mode, detailId: detail?.contribution.id });
  draftStorageStatus(saved);
  return saved;
}
function keepDraft() { draft.dirty = true; remember(); }
function showError(error, fallbackField) {
  document.title = `Error: ${pageTitle}`;
  const target = $('#form-errors');
  if (!target) { $('#entry-error').textContent = `Error: ${error.message}`; return; }
  const errors = error.errors || { [fallbackField || 'task-heading']: error.message || 'Could not connect. Your input has been kept. Please try again.' };
  target.innerHTML = `<div class="error-summary" tabindex="-1" role="group" aria-labelledby="error-heading"><h3 id="error-heading">Check before continuing</h3><ul>${Object.entries(errors).map(([key, value]) => `<li><a href="#${esc(key)}" data-error-target="${esc(key)}">${esc(value)}</a></li>`).join('')}</ul></div>`;
  for (const [key, value] of Object.entries(errors)) {
    const input = document.getElementById(key);
    const output = document.getElementById(`${key}-error`);
    if (output) { output.textContent = `Error: ${value}`; const descriptions = new Set((input?.getAttribute('aria-describedby') || '').split(' ').filter(Boolean)); descriptions.add(`${key}-error`); input?.setAttribute('aria-describedby', [...descriptions].join(' ')); }
    input?.setAttribute('aria-invalid', 'true');
  }
  target.querySelector('.error-summary').focus();
  if ((error.status === 409 || error.status === 404) && draft?.expectedVersion && mode === 'form') {
    const recover = document.createElement('button'); recover.type = 'button'; recover.textContent = 'Compare with the latest version';
    recover.addEventListener('click', () => recoverEdit(recover)); target.append(recover);
  } else if (error.status === 409 && detail && mode === 'detail') {
    const reload = document.createElement('button'); reload.type = 'button'; reload.textContent = 'Read the latest version';
    reload.addEventListener('click', () => openDetail(detail.contribution.id)); target.append(reload);
  }
}
function clearErrors() {
  document.title = pageTitle;
  $('#entry-error').textContent = '';
  if ($('#form-errors')) $('#form-errors').innerHTML = '';
  panel.querySelectorAll('.field-error').forEach((e) => { e.textContent = ''; });
  panel.querySelectorAll('[aria-invalid]').forEach((e) => {
    e.removeAttribute('aria-invalid');
    const remaining = (e.getAttribute('aria-describedby') || '').split(' ').filter((id) => id && !id.endsWith('-error'));
    if (remaining.length) e.setAttribute('aria-describedby', remaining.join(' ')); else e.removeAttribute('aria-describedby');
  });
}
async function perform(button, action, onError = showError) {
  if (busy) return;
  clearErrors();
  detailReads.cancel();
  stateReads.cancel();
  placeSearch?.cancel();
  busy = true;
  const text = button?.textContent;
  // Lock the complete task snapshot, including filters, Discard, and map controls.
  const controls = [...document.querySelectorAll(':is(#session-bar, #main, #entry, footer) :is(button, input, select, textarea)')]
    .map((element) => [element, element.disabled]);
  for (const [element] of controls) element.disabled = true;
  panel.setAttribute('aria-busy', 'true');
  if (button) button.textContent = 'Please wait…';
  try { await action(); } catch (error) { onError(error); } finally {
    busy = false;
    panel.removeAttribute('aria-busy');
    for (const [element, disabled] of controls) if (element.isConnected) element.disabled = disabled;
    // Context may have changed while rendering the successful result.
    setExportAvailability(!token || state.phase !== 'review');
    if (button?.isConnected) button.textContent = text;
    // Disabling a focused button can send keyboard focus to the page body.
    // Keep any deliberate result/error focus; otherwise return to the action.
    if (document.activeElement === document.body && button?.isConnected && !button.disabled && button.getClientRects().length) button.focus();
    if (token && !$('#main').hidden) remember();
  }
}

const savedMap = new GeographicMap($('#saved-map-container'), async (id) => {
  if (busy) return;
  if (mode !== 'form') { await openDetail(id); return; }
  savedMapSelection = id;
  drawMap();
  $('#saved-map-preview h3')?.focus();
  announce('Saved contribution preview. Your draft is unchanged.');
}, () => {}, { label: 'Contributed places map' });
const draftMap = new GeographicMap($('#draft-map-container'), () => {}, (coordinates) => {
  if (mode !== 'form' || busy) return;
  if (!isPhiladelphiaPoint(coordinates)) { showError(new Error('Choose a point within Philadelphia city limits, or describe the place without a point.'), 'location'); return; }
  const firstPoint = !draft.geometry;
  captureDraft(); draft.geometry = { type: 'Point', coordinates }; draft.locationSource = 'map'; draft.precision = 'point'; keepDraft();
  $('#approximate').checked = false;
  updateLocation(); focusDraftPoint({ neighborhood: firstPoint }); $('#placeLabel').focus(); announce('Draft point selected. Check or enter its place name before saving.');
}, { label: 'Your contribution location map', pointControls: true });
void savedMap.init();
void draftMap.init();
function drawMap() {
  const pins = visiblePins(), editing = mode === 'form';
  if (!editing) activeMap = 'saved';
  $('#map-view-switch').hidden = !editing;
  $('#saved-map-view').hidden = activeMap !== 'saved';
  $('#draft-map-view').hidden = activeMap !== 'draft';
  document.querySelectorAll('[data-map-view-choice]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mapViewChoice === activeMap)));
  $('#map-heading').textContent = activeMap === 'saved' ? 'Contributed places' : draft?.geometry ? 'Your contribution location' : 'Choose your location';
  $('#saved-map-help').textContent = state.phase === 'review' ? `Select a map marker or a place in the list to read its description. The map shows places matching the current filters.${editing ? ' Your draft is separate.' : ''}` : 'These are your saved places. After contributing, enter review to see other input. Select a map marker or a place in the list to read its description.';
  $('#draft-map-help').textContent = draft?.geometry ? 'Check that the point matches your place description. To change it, select another point or search again. Saved places are shown separately.' : 'We recommend adding a point to help others find this place. Search, select a point on the map, or enter coordinates. A written location is enough if you cannot place a point.';
  $('#return-draft-point').hidden = !editing || !draft?.geometry;
  savedMapSelection = editing && pins.some((p) => p.id === savedMapSelection) ? savedMapSelection : null;
  savedMap.set({ pins, draft: null, selected: editing ? savedMapSelection : detail?.contribution.id || null, placing: false });
  draftMap.set({ pins: [], draft: editing ? draft?.geometry : null, selected: null, placing: editing });
  const preview = $('#saved-map-preview'), selected = pins.find((p) => p.id === savedMapSelection);
  preview.hidden = !editing || !selected;
  preview.innerHTML = editing && selected ? `<h3 tabindex="-1">${esc(selected.placeLabel)}</h3><p>${esc(KINDS[selected.kind])} · ${esc(TOPICS[selected.topic])}</p><p>${esc(selected.description)}</p>${selected.context ? `<p class="note">When: ${esc(selected.context)}</p>` : ''}` : '';
  $('#filters').hidden = editing;
  $('#view-summary').hidden = editing;
  $('#view-summary').textContent = describeContributionView(pins, state.contributions.length);
  const overview = $('#session-overview');
  overview.hidden = editing || state.phase !== 'review';
  if (overview.hidden) {
    overview.open = false;
    $('#overview-content').replaceChildren();
  } else renderOverview(pins);
}
function renderOverview(pins) {
  const summary = summarizeContributionView(pins);
  const rows = (values, labels) => Object.entries(values).map(([key, count]) => `<div class="summary-row"><dt>${esc(labels[key])}</dt><dd>${count}</dd></div>`).join('');
  $('#overview-content').innerHTML = `
    <h2>Overview of filtered contributions</h2>
    <p><strong>${summary.total}</strong> ${summary.total === 1 ? 'contribution matches' : 'contributions match'} the current filters: ${summary.examples} fictional ${summary.examples === 1 ? 'example' : 'examples'} and ${summary.total - summary.examples} practice ${summary.total - summary.examples === 1 ? 'contribution' : 'contributions'}.</p>
    <p class="note">These are counts of accounts, not people, safety ratings, or representative community findings. Saved response totals stay hidden until deliberately opened on an individual account.</p>
    <h3>Contribution types</h3><dl>${rows(summary.kinds, KINDS)}</dl>
    <h3>Topics</h3><dl>${rows(summary.topics, TOPICS)}</dl>
    <p>${summary.mapped} with a map point; ${summary.described} described without a point.</p>
    <p class="note">Time/context notes supplied: ${summary.withContext} of ${summary.total}. Free-text notes are not classified into inferred time-of-day groups.</p>`;
}
function focusDraftPoint({ neighborhood = true } = {}) {
  activeMap = 'draft';
  drawMap();
  if (draft?.geometry) draftMap.focusPoint(draft.geometry.coordinates, { neighborhood });
}
$('#map-view-switch').addEventListener('click', (event) => {
  const button = event.target.closest('[data-map-view-choice]');
  if (button && !busy && mode === 'form') { activeMap = button.dataset.mapViewChoice; drawMap(); }
});
$('#return-draft-point').addEventListener('click', () => { if (!busy && draft?.geometry) focusDraftPoint(); });

async function loadState() {
  return stateReads.run((signal) => api('state', { signal }), (next) => {
    state = next;
    $('#active-session').innerHTML = `${esc(sessionName(activeSession))} - <span class="session-date">${loadedSessionDate}</span>`;
    $('#phase-label').textContent = state.phase === 'review' ? 'Review earlier contributions' : 'Independent contribution';
    $('#review-phase').hidden = state.phase === 'review';
    setExportAvailability(state.phase !== 'review');
    $('#return-code').textContent = token;
    drawMap();
  }, (error) => { throw error; });
}
async function enterSession({ fresh = false } = {}) {
  if (!await loadState()) return;
  const recovery = fresh ? null : draftStore.recover(token, activeSession);
  draft = recovery?.draft || null;
  responseDrafts.clear();
  for (const [key, value] of recovery?.responseDrafts || []) responseDrafts.set(key, value);
  $('#entry').hidden = true; $('#session-bar').hidden = false; $('#main').hidden = false; $('#entry-error').textContent = '';
  if (fresh || draft) openForm(); else renderList();
  focusPanel();
  if (!draft && recovery?.mode === 'detail' && recovery.detailId && [...responseDrafts.keys()].some((key) => key.startsWith(`${recovery.detailId}:`))) await openDetail(recovery.detailId);
  remember();
  announce(draft?.dirty || responseDrafts.size ? 'Your unsaved writing was recovered in this tab. Check it before saving; nothing was submitted automatically.' : fresh ? 'Practice started. Your input is independent until you choose Review earlier input.' : 'Practice resumed. Your saved accounts and current phase are restored.');
  if (draft?.expectedVersion) {
    const current = state.contributions.find((pin) => pin.id === draft.id && pin.mine);
    if (!current || current.version !== draft.expectedVersion) {
      const error = new Error('The saved account changed or was withdrawn. Your recovered writing is kept. Compare with the latest version before saving.');
      error.status = 409; showError(error);
    }
  }
}
function renderList() {
  clearErrors();
  detailReads.cancel();
  placeSearch?.destroy(); placeSearch = null;
  mode = 'list'; detail = null;
  const pins = visiblePins();
  panel.innerHTML = `<div class="heading-row"><h2 id="task-heading" tabindex="-1">Contributions (${pins.length})</h2><button id="add-place" type="button" class="primary">Add a place</button></div><div id="form-errors"></div>
    ${state.phase !== 'review' ? '<p class="notice">You are contributing independently. Only your current-session practice input is shown. Add a place from your own perspective, then choose Review earlier input when ready.</p>' : '<p class="note">Review accounts from earlier or current sessions. A different experience is welcome. Recorded answers remain hidden until you choose to see them.</p>'}
    <div class="list-toolbar"><label for="list-layout">View <select id="list-layout"><option value="list" ${listLayout === 'list' ? 'selected' : ''}>List</option><option value="table" ${listLayout === 'table' ? 'selected' : ''}>Table</option></select></label><button type="button" data-export="contributions" ${state.phase !== 'review' ? 'disabled' : ''}>Export all CSV</button></div>
    ${draft?.dirty ? '<div class="notice"><p>You have an unsaved contribution draft in this tab.</p><button id="resume-draft" type="button">Continue your draft</button></div>' : ''}
    ${renderResponseRecovery()}
    ${pins.length ? renderContributions(pins) : '<p>No contributions match this view. Clear filters, add a place, or enter review.</p>'}`;
  $('#list-layout').addEventListener('change', (event) => { listLayout = event.target.value; renderList(); $('#list-layout').focus(); });
  $('#add-place').addEventListener('click', () => { if (!busy) { openForm(); focusPanel(); } });
  $('#resume-draft')?.addEventListener('click', () => { if (!busy) { openForm(); focusPanel(); } });
  drawMap();
  remember();
}
function renderResponseRecovery() {
  if (!responseDrafts.size) return '';
  return `<details><summary>Unsaved response drafts (${responseDrafts.size})</summary>${[...responseDrafts].map(([key, value]) => {
    const id = key.slice(0, key.lastIndexOf(':'));
    const pin = state.contributions.find((p) => p.id === id);
    return `<article><h3>${esc(pin?.placeLabel || 'Unavailable account')}</h3>${unsavedAnswer(value)}${pin ? `<button type="button" data-open="${esc(id)}">Open current account</button>` : '<p class="note">This account is unavailable. You can copy your unsaved writing before discarding it.</p>'}<button type="button" data-discard-response="${esc(key)}">Discard this unsaved response</button></article>`;
  }).join('')}</details>`;
}
function renderContributions(pins) {
  const placeButton = (p) => `<button class="place-link" type="button" data-open="${esc(p.id)}">${esc(p.placeLabel)}</button>`;
  const source = (p) => `${dateLabel(p.createdAt)}${p.fixture ? ' · Example' : ''}${p.mine ? ' · Yours' : ''}${!p.geometry ? ' · No pin' : ''}`;
  if (listLayout === 'table') return `<div class="table-scroll" role="region" aria-label="Contribution table" tabindex="0"><table><caption>Contributions matching the current filters</caption><thead><tr><th scope="col">Place</th><th scope="col">Type / topic</th><th scope="col">Added</th></tr></thead><tbody>${pins.map((p) => `<tr><th scope="row">${placeButton(p)}</th><td>${esc(KINDS[p.kind])}<br><span class="note">${esc(TOPICS[p.topic])}</span></td><td>${esc(source(p))}</td></tr>`).join('')}</tbody></table></div>`;
  return pins.map((p) => `<article class="contribution-card"><h3>${placeButton(p)}</h3><p class="note">${esc(KINDS[p.kind])} · ${esc(TOPICS[p.topic])} · ${esc(source(p))}</p><p class="compact-description">${esc(p.description.slice(0, 110))}${p.description.length > 110 ? '…' : ''}</p></article>`).join('');
}
function freshDraft() { return { id: crypto.randomUUID(), kind: '', topic: '', placeLabel: '', description: '', context: '', geometry: null, locationSource: 'description', precision: 'approximate', dirty: false }; }
function openForm(pin) {
  clearErrors();
  detailReads.cancel();
  placeSearch?.destroy(); placeSearch = null;
  mode = 'form'; detail = null;
  draft = pin ? { ...pin, expectedVersion: pin.version, dirty: false } : draft || freshDraft();
  activeMap = 'draft'; savedMapSelection = null;
  if (draftMapId !== draft.id) { draftMapId = draft.id; draftMap.move('city'); }
  panel.innerHTML = `<h2 id="task-heading" tabindex="-1">${draft.expectedVersion ? 'Edit your practice contribution' : 'Add a place'}</h2><p class="note">Saving to: ${esc(sessionName(activeSession))}. Required fields are marked.</p>${draft.expectedVersion ? '<p class="notice">Saving replaces the wording and creates a new version. Earlier wording is not retained; older answers are excluded from the new summary and export.</p>' : '<p class="note">Start by describing a place and your experience or idea. We recommend adding a map point; a clear written location is enough if you cannot place one.</p>'}<div id="form-errors"></div><div id="edit-recovery"></div>
    <form id="search-form"><label for="place-search">Find an address, intersection, or landmark <span class="note">(optional)</span></label><div class="search-row"><input id="place-search" type="search" maxlength="160" autocomplete="off" aria-describedby="search-help search-status"><button type="submit">Search</button><button type="button" id="clear-search">Clear search</button></div><p id="search-help" class="note">Philadelphia only. Try 1500 Market St, Broad &amp; Walnut, or Clark Park. Address and intersection queries go to the City’s public geocoder when you press Search. Choose a result and check its point before saving.</p><p id="search-status" role="status" aria-atomic="true"></p><ul id="search-results" class="search-results" aria-label="Matching locations"></ul></form>
    <form id="contribution-form" novalidate>
      <fieldset id="location" tabindex="-1"><legend>Location (required)</legend><p class="note">Describe the place below. We recommend adding a map point: search for a place, select a point on the map, or enter coordinates. You can save a written location without a point.</p><button type="button" id="describe-location">Describe the place without a point</button><div id="location-state" class="location-state"></div>${errorSlot('location')}
      <details><summary>Enter coordinates instead</summary><label for="latitude">Latitude</label><input id="latitude" type="number" step="any" min="${PHILADELPHIA_BOUNDS[1]}" max="${PHILADELPHIA_BOUNDS[3]}"><label for="longitude">Longitude</label><input id="longitude" type="number" step="any" min="${PHILADELPHIA_BOUNDS[0]}" max="${PHILADELPHIA_BOUNDS[2]}"><button type="button" id="use-coordinates">Use these coordinates</button></details></fieldset>
      <label for="placeLabel">Place name, intersection, or location description (required)</label><input id="placeLabel" type="text" maxlength="140" required value="${esc(draft.placeLabel)}" aria-describedby="place-help"><p id="place-help" class="note">Changing this text does not move an existing pin. Check the selected point, or choose Describe without a point.</p>${errorSlot('placeLabel')}
      <label for="kind">Contribution type (required)</label><select id="kind" required>${options(KINDS, draft.kind, 'Choose one')}</select>${errorSlot('kind')}
      <label for="topic">Topic (optional)</label><select id="topic">${options(TOPICS, draft.topic, 'Other / not sure')}</select>${errorSlot('topic')}
      <label for="description" id="description-label">Describe one experience or idea (required)</label><p class="note" id="description-prompt"></p><p class="note" id="description-help">Up to 800 characters. Leave out personal names, private addresses, and identifying details.</p><textarea id="description" maxlength="800" required aria-describedby="description-prompt description-help description-count">${esc(draft.description)}</textarea><p class="note" id="description-count"></p>${errorSlot('description')}
      <label for="context">When does this matter? (optional)</label><input id="context" type="text" maxlength="120" value="${esc(draft.context)}"><p class="note">For example, after dark or on the way to school. This is separate from the submission date.</p>${errorSlot('context')}
      <label class="choice"><input id="approximate" type="checkbox" ${draft.precision === 'approximate' ? 'checked' : ''}><span>This is an approximate place, not an exact location.</span></label>
      <p class="notice">Practice input is shared with users of this demo. No real community collection or follow-up arrangement is in place.</p><div class="actions"><button type="submit" id="save-place" class="primary">${draft.expectedVersion ? 'Save new version' : 'Save practice contribution'}</button><button type="button" id="cancel-draft">Discard draft / back</button></div>
    </form>`;
  updateLocation(); updateFormFeedback(); drawMap();
  if (draft.geometry) focusDraftPoint();
  $('#contribution-form').addEventListener('input', () => { captureDraft(); keepDraft(); updateFormFeedback(); });
  $('#contribution-form').addEventListener('change', (event) => { captureDraft(); keepDraft(); updateFormFeedback(); if (event.target.id === 'approximate') updateLocation(); });
  $('#describe-location').addEventListener('click', () => { captureDraft(); draft.geometry = null; draft.locationSource = 'description'; keepDraft(); activeMap = 'draft'; updateLocation(); drawMap(); $('#placeLabel').focus(); announce('A place description will be saved without a confirmed map point.'); });
  $('#use-coordinates').addEventListener('click', () => {
    const lat = Number($('#latitude').value), lon = Number($('#longitude').value);
    if (!$('#latitude').value || !$('#longitude').value || !isPhiladelphiaPoint([lon, lat])) { showError(new Error('Choose coordinates inside Philadelphia city limits. Your current point is unchanged.'), 'location'); return; }
    captureDraft(); draft.geometry = { type: 'Point', coordinates: [lon, lat] }; draft.locationSource = 'coordinates'; keepDraft(); updateLocation(); focusDraftPoint(); announce('Coordinate point selected. Check its place name before saving.');
  });
  $('#cancel-draft').addEventListener('click', async () => {
    if (busy) return;
    detailReads.cancel(); stateReads.cancel(); placeSearch?.cancel();
    const current = draft;
    if (draft.dirty && !await confirmAction({
      title: 'Discard this unsaved draft?',
      description: 'Your unsaved changes will be discarded. Any previously saved contribution will stay unchanged.',
      confirmLabel: 'Discard draft',
      cancelLabel: 'Keep editing',
    })) return;
    if (busy || draft !== current || mode !== 'form') return;
    draft = null; renderList(); focusPanel();
  });
  placeSearch = initPlaceSearch($('#search-form'), {
    lookup: (query, signal) => api('locations/search', { method: 'POST', body: { query }, signal, readOnly: true }),
    canSelect: () => !busy && mode === 'form',
    onSelect: (result) => {
      if (!isPhiladelphiaPoint(result.coordinates) || result.crs !== COORDINATE_CRS) { announce('The search result has invalid coordinates. Your draft is unchanged.'); return; }
      captureDraft(); draft.geometry = { type: 'Point', coordinates: result.coordinates }; draft.placeLabel = result.label;
      draft.locationSource = result.locationSource; draft.precision = 'approximate'; keepDraft();
      $('#placeLabel').value = draft.placeLabel; $('#approximate').checked = true;
      updateLocation(); focusDraftPoint(); $('#placeLabel').focus();
      announce('Search result selected. Check the approximate point and place name before saving.');
    },
  });
  $('#contribution-form').addEventListener('submit', (event) => {
    event.preventDefault(); captureDraft();
    const request = { ...draft };
    perform($('#save-place'), async () => {
      const pin = await api(request.expectedVersion ? `contributions/${request.id}` : 'contributions', { method: request.expectedVersion ? 'PATCH' : 'POST', body: request });
      // The write returns the validated, display-ready account. Do not make a
      // confirmed save depend on another network request that could fail.
      const exists = state.contributions.some((value) => value.id === pin.id);
      state.contributions = exists ? state.contributions.map((value) => value.id === pin.id ? pin : value) : [...state.contributions, pin];
      draft = null; resetFilters();
      selectDetail({ contribution: pin, response: null, question: responseQuestion(pin.kind), canRespond: false });
      showSaveReceipt(pin);
      announce('Saved to the current practice session. View filters were cleared so it stays visible.');
    });
  });
  remember();
}
function showSaveReceipt(pin) {
  const receipt = document.createElement('section');
  receipt.className = 'notice';
  receipt.setAttribute('aria-labelledby', 'receipt-heading');
  receipt.innerHTML = `<h3 id="receipt-heading" tabindex="-1">Practice contribution saved</h3>
    <p>Your contribution is saved to shared demo storage. Reference: <span class="receipt-reference">${esc(pin.id)}</span> · Version ${pin.version}.</p>
    <p class="note">Current phase: ${state.phase === 'review' ? 'Review earlier contributions' : 'Independent contribution'}. Use Your return code above to keep access to edit or withdraw this account on another device.</p>
    <p>No organization is assigned to act on this practice account. You can edit it below, add another place, or review earlier input when ready.</p>
    <div class="actions"><button id="receipt-add-place" type="button">Add another place</button>${state.phase !== 'review' ? '<button id="receipt-review" type="button">Review earlier input</button>' : ''}</div>`;
  panel.querySelector('.heading-row').after(receipt);
  $('#receipt-add-place').addEventListener('click', () => { if (!busy) { openForm(); focusPanel(); } });
  $('#receipt-review')?.addEventListener('click', () => { if (!busy) $('#review-phase').click(); });
  $('#receipt-heading').focus();
}
function captureDraft() {
  if (mode !== 'form' || !draft || !$('#contribution-form')) return;
  for (const id of ['kind', 'topic', 'placeLabel', 'description', 'context']) draft[id] = document.getElementById(id).value;
  draft.precision = $('#approximate').checked ? 'approximate' : 'point';
}
function updateFormFeedback() {
  const prompt = contributionPrompt(draft.kind);
  $('#description-label').textContent = prompt.label;
  $('#description-prompt').textContent = prompt.help;
  $('#description-count').textContent = `${draft.description.length} of 800 characters used.`;
}
function updateLocation() {
  if (!$('#location-state')) return;
  $('#location-state').innerHTML = draft.geometry ? `${draft.precision === 'approximate' ? 'An approximate' : 'A selected'} point will be plotted. Check its position and place description.<details><summary>Point coordinates</summary>${draft.geometry.coordinates[1].toFixed(5)} latitude, ${draft.geometry.coordinates[0].toFixed(5)} longitude</details>` : 'Location described; not plotted on the map. Your account will appear in the list and can be reviewed and answered there.';
}
function resetFilters() { filter = filterControls.reset(); }

function locationSummary(p) {
  return p.geometry ? `<p class="note">${p.precision === 'approximate' ? 'Approximate' : 'Selected'} point; location accuracy is not verified.</p><details><summary>Point coordinates</summary>${p.geometry.coordinates[1].toFixed(5)}, ${p.geometry.coordinates[0].toFixed(5)}</details>` : '<p class="note">Location described; not plotted on the map. This is a complete account.</p>';
}
function phaseSummary(p) {
  if (p.fixture) return '';
  const phase = (value) => value === 'contribute' ? 'before entering review' : value === 'review' ? 'after entering review' : 'with review phase unknown';
  return `<p class="note">Added ${phase(p.createdPhase)}.${p.version > 1 ? ` Current version saved ${phase(p.revisionPhase)}.` : ''}</p>`;
}
function unsavedAnswer(value) { return `<p>${esc(value.question || 'Earlier response draft')}</p><p>Your unsaved choice: ${esc(value.choiceLabel || value.answer || 'No answer selected')}</p><label>Unsaved comment (for copying)<textarea readonly>${esc(value.note || '')}</textarea></label>`; }
function earlierResponseDraft(id, version) { return [...responseDrafts].find(([key]) => key.startsWith(`${id}:`) && key !== `${id}:${version}`) || []; }

async function recoverEdit(button) {
  captureDraft();
  await perform(button, async () => {
    const recovery = $('#edit-recovery');
    let latest;
    try { latest = (await api(`contributions/${draft.id}`)).contribution; } catch (error) {
      if (error.status !== 404) throw error;
      recovery.innerHTML = '<div class="notice"><h3 tabindex="-1">The saved account was withdrawn</h3><p>Your unsaved text is still in the form. You can discard it or keep it as a new draft; it will not be saved automatically.</p><button type="button" id="keep-as-new">Keep text as a new draft</button></div>';
      $('#keep-as-new').addEventListener('click', () => { captureDraft(); draft.id = crypto.randomUUID(); delete draft.expectedVersion; keepDraft(); openForm(); focusPanel(); announce('Text kept as a new unsaved draft. Check it before saving.'); });
      recovery.querySelector('h3').focus();
      return;
    }
    recovery.innerHTML = `<div class="notice"><h3 tabindex="-1">Latest saved version: ${latest.version}</h3><p>${esc(latest.placeLabel)} · ${KINDS[latest.kind]}</p><p>${esc(latest.description)}</p><p>When: ${esc(latest.context || 'Not specified')}</p>${locationSummary(latest)}<p>Your own unsaved fields are unchanged below. Check both accounts before keeping your changes.</p><button id="use-latest-baseline" type="button">Keep my draft and use version ${latest.version} as its baseline</button></div>`;
    $('#use-latest-baseline').addEventListener('click', () => {
      captureDraft(); draft.expectedVersion = latest.version; keepDraft(); clearErrors();
      recovery.textContent = `Your draft is kept. The next save will be checked against version ${latest.version}; no changes have been saved yet.`;
      $('#description').focus();
    });
    recovery.querySelector('h3').focus();
  });
}

async function openDetail(id, { focus = true } = {}) {
  return detailReads.run((signal) => api(`contributions/${id}`, { signal }), (result) => selectDetail(result, { focus }), (error) => {
    if (error.status === 404) { renderList(); announce('This account was withdrawn or is unavailable. The list has been kept; refresh to update it.'); }
    showError(error);
  });
}
function selectDetail(result, { focus = true } = {}) {
  const previous = detail?.contribution, pin = result.contribution;
  const [olderKey, olderDraft] = earlierResponseDraft(pin.id, pin.version);
  placeSearch?.destroy(); placeSearch = null;
  mode = 'detail'; detail = { ...result, olderDraft, olderKey };
  if (pin.geometry) savedMap.focusPoint(pin.geometry.coordinates);
  renderDetail(); drawMap();
  announce(previous?.id === pin.id && previous.version !== pin.version ? 'This account was revised. Read the new wording. Your earlier unsaved answer has not been applied to it.' : 'Account loaded.');
  if (focus) focusPanel(); else $('#save-response')?.focus();
}
function renderDetail() {
  clearErrors();
  const p = detail.contribution;
  const key = `${p.id}:${p.version}`;
  const response = responseDrafts.get(key) || detail.response || {};
  const q = detail.question;
  panel.innerHTML = `<div class="heading-row"><h2 id="task-heading" tabindex="-1">${esc(p.placeLabel)}</h2><button type="button" id="back-list">Back to list</button></div><p>${KINDS[p.kind]} · ${TOPICS[p.topic]}</p><p class="account-text">${esc(p.description)}</p>${p.context ? `<p><strong>When:</strong> ${esc(p.context)}</p>` : ''}<p class="note">Source: ${esc(sessionName(p.sessionId))} · ${dateLabel(p.createdAt)} · Version ${p.version}${p.fixture ? ' · Fictional example' : ' · Practice account'}</p>${phaseSummary(p)}${locationSummary(p)}<div id="form-errors"></div>${detail.olderDraft ? `<div class="notice"><p>The account changed. Your earlier unsaved answer was not applied to this version. Copy any useful text before discarding it.</p>${unsavedAnswer(detail.olderDraft)}<button type="button" id="discard-earlier-answer">Discard earlier unsaved answer</button></div>` : ''}
    ${p.mine ? '<div class="actions"><button id="edit-place" type="button">Edit your contribution</button><button id="withdraw-place" type="button" class="danger">Withdraw your contribution</button></div><p class="note">You cannot respond to your own account. Enter review to compare other accounts.</p>' : `<form id="response-form" novalidate><fieldset id="answer" aria-describedby="answer-help"><legend>${esc(q.text)}</legend><p class="note" id="answer-help">Responding is optional. Choose an answer to save a response. A different experience does not dismiss this account. Responding in: ${esc(sessionName(activeSession))}.</p>${Object.entries(q.options).map(([value, label]) => `<label class="choice"><input type="radio" name="answer" value="${value}" required ${response.answer === value ? 'checked' : ''}><span>${esc(label)}</span></label>`).join('')}${errorSlot('answer')}</fieldset><label for="note">Add context or explain a different experience (optional)</label><textarea id="note" maxlength="400" aria-describedby="note-help">${esc(response.note || '')}</textarea><p class="note" id="note-help">Up to 400 characters. Your comment and answer can be read by other users of this demo. Leave out identifying details. Response comments are omitted from the download.</p>${errorSlot('note')}<button type="submit" id="save-response" class="primary">${detail.response ? 'Update' : 'Save'} practice response</button>${detail.response ? '<button type="button" id="remove-response">Remove my saved response</button>' : ''}<p class="note">One editable answer per practice identity, contribution version, and responding session. This does not verify a unique person.</p></form>`}
    <div class="actions"><button type="button" id="show-summary">Show recorded answers</button></div><div id="summary"></div>`;
  $('#discard-earlier-answer')?.addEventListener('click', () => { responseDrafts.delete(detail.olderKey); [detail.olderKey, detail.olderDraft] = earlierResponseDraft(p.id, p.version); renderDetail(); focusPanel(); });
  $('#remove-response')?.addEventListener('click', async () => {
    if (busy) return;
    detailReads.cancel(); stateReads.cancel();
    if (!await confirmAction({
      title: 'Remove your saved response?',
      description: 'Your saved answer and comment for this version will be removed. Any recorded totals-opening time will remain.',
      confirmLabel: 'Remove saved response',
      cancelLabel: 'Keep response',
    })) return;
    if (busy || detail?.contribution !== p) return;
    perform($('#remove-response'), async () => {
      await api(`contributions/${p.id}/response`, { method: 'DELETE', body: { version: p.version } });
      responseDrafts.delete(key); detail.response = null; renderDetail(); focusPanel(); announce('Your saved answer and comment were removed. You can leave this account unanswered.');
    });
  });
  $('#back-list').addEventListener('click', () => { if (!busy) { renderList(); focusPanel(); } });
  $('#edit-place')?.addEventListener('click', () => { if (!busy) { openForm(p); focusPanel(); } });
  $('#withdraw-place')?.addEventListener('click', async () => {
    if (busy) return;
    detailReads.cancel(); stateReads.cancel();
    if (!await confirmAction({
      title: 'Withdraw your contribution?',
      description: 'This practice contribution’s description and all its response records will be removed from the shared demo.',
      confirmLabel: 'Withdraw contribution',
      cancelLabel: 'Keep contribution',
    })) return;
    if (busy || detail?.contribution !== p) return;
    perform($('#withdraw-place'), async () => { await api(`contributions/${p.id}`, { method: 'DELETE' }); await loadState(); renderList(); focusPanel(); announce('Contribution withdrawn. Its description and responses are no longer available in the shared demo.'); });
  });
  $('#show-summary').addEventListener('click', () => perform($('#show-summary'), showSummary));
  $('#response-form')?.addEventListener('input', () => { const answer = new FormData($('#response-form')).get('answer'); responseDrafts.set(key, { answer, note: $('#note').value, question: q.text, choiceLabel: q.options[answer] }); remember(); });
  $('#response-form')?.addEventListener('submit', (event) => {
    event.preventDefault(); const answer = new FormData(event.currentTarget).get('answer'); const note = $('#note').value;
    responseDrafts.set(key, { answer, note, question: q.text, choiceLabel: q.options[answer] }); remember();
    perform($('#save-response'), async () => {
      await api(`contributions/${p.id}/response`, { method: 'PUT', body: { version: p.version, answer, note } });
      responseDrafts.delete(key); detail.response = { answer, note }; renderDetail(); $('#save-response').focus(); announce('Practice response saved. You can change it; changing it replaces this identity’s earlier answer for this version and session.');
    });
  });
  remember();
}
async function showSummary() {
  const result = await api(`contributions/${detail.contribution.id}/summary`, { method: 'POST', body: { version: detail.contribution.version } });
  $('#summary').innerHTML = `<h3 tabindex="-1">Recorded practice answers</h3><p class="note">${esc(result.question.text)}</p><dl>${Object.entries(result.question.options).map(([key, label]) => `<div class="summary-row"><dt>${esc(label)}</dt><dd><strong>${result.counts[key]}</strong></dd></div>`).join('')}</dl><p><strong>${result.total}</strong> ${result.total === 1 ? 'answer' : 'answers'} to this version.</p><p class="note">${esc(result.denominator)} Zero answers is different from uncertainty or disagreement. These counts do not rank places or establish community consensus.</p>${result.earlierVersionAnswers ? `<p class="note">${result.earlierVersionAnswers} answers refer to earlier versions and are excluded here. Earlier wording is not retained.</p>` : ''}${result.comments?.length ? `<h3>Practice explanations</h3>${result.comments.map((c) => `<article><p><strong>${esc(result.question.options[c.answer])}</strong></p><p>${esc(c.note)}</p><p class="note">Responding session: ${esc(sessionName(c.sessionId))}</p></article>`).join('')}` : ''}`;
  $('#summary h3').focus();
  announce(`${result.total} recorded practice ${result.total === 1 ? 'answer' : 'answers'} shown. This opening was recorded for this version and responding session; it does not prove the answers were read.`);
}

$('#join-form').addEventListener('submit', (event) => {
  event.preventDefault(); activeSession = $('#join-session').value;
  perform(event.currentTarget.querySelector('button'), async () => { const result = await api('participants', { method: 'POST', body: { sessionId: activeSession } }); token = result.token; await enterSession({ fresh: true }); });
});
$('#resume-form').addEventListener('submit', (event) => {
  event.preventDefault(); token = $('#resume-code').value.trim(); activeSession = $('#join-session').value;
  perform(event.currentTarget.querySelector('button'), async () => { await enterSession(); $('#resume-code').value = ''; });
});
const groupReview = new GroupReview($('#group-review'), async () => { await loadState(); return visiblePins(); });
$('#start-group-review').addEventListener('click', async () => {
  if (busy) return;
  captureDraft();
  let ready = false;
  await perform($('#start-group-review'), async () => {
    if (state.phase !== 'review') {
      await api('phase', { method: 'POST', body: { phase: 'review' } });
      await loadState();
      if (mode === 'list') renderList();
    }
    ready = true;
  });
  if (ready) groupReview.open(visiblePins(), detail?.contribution.id, $('#start-group-review'));
});
$('#review-phase').addEventListener('click', () => {
  if (draft?.dirty) { announce('Save or discard your current draft before entering review.'); return; }
  perform($('#review-phase'), async () => { await api('phase', { method: 'POST', body: { phase: 'review' } }); draft = null; resetFilters(); await loadState(); renderList(); focusPanel(); announce('Review phase started. Earlier examples and shared practice accounts are now available.'); });
});
$('#refresh-records').addEventListener('click', () => perform($('#refresh-records'), async () => {
  const selected = detail?.contribution;
  await loadState();
  if (mode === 'detail' && selected) {
    if (state.contributions.some((p) => p.id === selected.id)) {
      await openDetail(selected.id); announce('Shared input refreshed. The selected account is now current; check its wording before answering.');
    } else {
      const key = `${selected.id}:${selected.version}`, unsaved = responseDrafts.get(key);
      renderList(); focusPanel();
      if (unsaved) {
        const recovery = document.createElement('div'); recovery.className = 'notice';
        recovery.innerHTML = `<p>The selected account was withdrawn or is unavailable. Your unsaved answer was not sent. Copy any useful text before discarding it.</p>${unsavedAnswer(unsaved)}<button type="button">Discard this unsaved answer</button>`;
        recovery.querySelector('button').addEventListener('click', () => { responseDrafts.delete(key); recovery.remove(); remember(); focusPanel(); }); panel.append(recovery);
      }
      announce('The selected account was withdrawn or is unavailable. Its saved narrative is no longer shown.');
    }
  } else if (mode === 'form') {
    const current = state.contributions.find((p) => p.id === draft.id);
    if (draft.expectedVersion && (!current || current.version !== draft.expectedVersion)) {
      const error = new Error('The saved account changed or was withdrawn. Your unsaved fields are kept. Compare with the latest version before saving.'); error.status = 409; showError(error);
    } else announce('Shared input refreshed. Your unsaved form is unchanged.');
  } else { renderList(); announce('Shared input refreshed.'); }
}));
$('#finish-participant').addEventListener('click', () => {
  if (busy) return;
  detailReads.cancel();
  $('#finish-drafts').textContent = draft?.dirty || responseDrafts.size ? 'You have unsaved input. Finishing will discard it.' : 'No unsaved input will be discarded.';
  $('#finish-code').textContent = token; $('#finish-copy-status').textContent = '';
  $('#finish-dialog').showModal();
});
$('#finish-cancel').addEventListener('click', () => $('#finish-dialog').close());
containTabFocus($('#finish-dialog'));
$('#finish-dialog').addEventListener('close', () => { $('#finish-code').textContent = ''; $('#finish-dialog details').open = false; });
$('#finish-confirm').addEventListener('click', async () => {
  if (busy) return;
  busy = true; $('#finish-confirm').disabled = true;
  try {
    await api.finish();
    if (!$('#finish-dialog').open) return;
    if (!draftStore.save({ token: '' })) {
      $('#finish-copy-status').textContent = 'This browser could not clear its recovery copy. Keep this tab private and close it before sharing the device.';
      return;
    }
    detailReads.cancel(); stateReads.cancel(); placeSearch?.destroy(); placeSearch = null;
    $('#finish-dialog').close();
    token = ''; draft = null; detail = null; mode = 'list'; responseDrafts.clear(); listLayout = 'list'; state = { phase: 'contribute', contributions: [] }; remember(); resetFilters();
    $('#session-bar details').open = false;
    $('#return-code').textContent = ''; $('#resume-code').value = ''; $('#session-bar').hidden = true; $('#main').hidden = true; $('#entry').hidden = false; $('#entry-error').textContent = ''; setExportAvailability(true); panel.innerHTML = ''; activeMap = 'saved'; savedMapSelection = null; draftMapId = null;
    for (const map of [savedMap, draftMap]) { map.set({ pins: [], draft: null, selected: null, placing: false }); map.move('city'); } $('#join-form button').focus(); announce('Finished. This tab no longer holds the participant code or unsaved drafts. Start a fresh practice participant for the next person.');
  } catch {
    $('#finish-copy-status').textContent = 'Could not finish signing out. Keep this tab private and try again.';
  } finally { busy = false; $('#finish-confirm').disabled = false; }
});
async function copyCode() {
  let message;
  try { await navigator.clipboard.writeText(token); message = 'Return code copied. Keep it private; it grants edit access.'; } catch { message = 'Copy was unavailable. Open the code disclosure and copy it manually before finishing.'; }
  if ($('#finish-dialog').open) $('#finish-copy-status').textContent = message;
  else announce(message);
}
$('#copy-code').addEventListener('click', copyCode);
$('#finish-copy').addEventListener('click', copyCode);
$('#use-map-center').addEventListener('click', () => { if (mode === 'form') draftMap.onPlace(draftMap.center()); });
const filterControls = initContributionFilters($('#filters'), (event) => {
  if (busy) return;
  detailReads.cancel();
  filter = event.detail;
  if (mode === 'detail' && !visiblePins().some((p) => p.id === detail.contribution.id)) { renderList(); announce('The selected account is outside this filter. Returned to the matching list.'); } else if (mode === 'list') renderList();
  drawMap();
});
$('#view-topic').insertAdjacentHTML('beforeend', Object.entries(TOPICS).map(([key, label]) => `<option value="${key}">${esc(label)}</option>`).join(''));
$('#view-kind').insertAdjacentHTML('beforeend', Object.entries(KINDS).map(([key, label]) => `<option value="${key}">${esc(label)}</option>`).join(''));
panel.addEventListener('click', (event) => {
  const discard = event.target.closest('[data-discard-response]');
  if (discard && !busy) {
    responseDrafts.delete(discard.dataset.discardResponse);
    renderList(); focusPanel();
    return;
  }
  const target = event.target.closest('[data-error-target]');
  if (target) { event.preventDefault(); const input = document.getElementById(target.dataset.errorTarget); (input?.querySelector('button, input') || input)?.focus(); return; }
  const open = event.target.closest('[data-open]'); if (open && !busy) openDetail(open.dataset.open);
});
for (const selector of ['.skip', '#skip-map']) $(selector).addEventListener('click', (event) => { event.preventDefault(); if (selector === '.skip' && $('#main').hidden) $('#entry-title').focus(); else focusPanel(); });
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-export]');
  if (!button || button.disabled) return;
  perform(button, async () => {
    const dataset = button.dataset.export, isGeoJSON = dataset === 'geojson', isJson = dataset === 'json' || isGeoJSON;
    const output = await api(isGeoJSON ? 'export?format=geojson' : isJson ? 'export' : `export?format=csv&dataset=${dataset}`, { responseType: isJson ? 'json' : 'text' });
    const blob = new Blob([isJson ? JSON.stringify(output, null, 2) : (output.startsWith('\uFEFF') ? output : '\uFEFF' + output)], { type: isGeoJSON ? 'application/geo+json' : isJson ? 'application/json' : 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = isGeoJSON ? 'community-safety-contributions.geojson' : isJson ? 'community-safety-practice-data.json' : `community-safety-${dataset}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Practice data downloaded. Exports include all available sessions, regardless of view filters.');
  });
});
window.addEventListener('beforeunload', (event) => {
  if (token && !$('#main').hidden) { captureDraft(); remember(); }
  if (draft?.dirty || responseDrafts.size) { event.preventDefault(); event.returnValue = ''; }
});
const savedParticipant = draftStore.read();
if (savedParticipant?.token) {
  token = savedParticipant.token; activeSession = savedParticipant.activeSession || 'practice-current';
  await perform(null, () => enterSession(), () => {
    $('#resume-code').value = token; token = '';
    document.title = `Error: ${pageTitle}`;
    $('#entry-error').textContent = 'Error: The previous practice session could not be restored. Its code and recovery copy have been kept in this tab; retry Resume when the connection is available, or explicitly start a new participant.';
  });
}
