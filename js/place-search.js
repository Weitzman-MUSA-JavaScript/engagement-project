import { LatestRequest } from './requests.js';

export function initPlaceSearch(form, { lookup, onSelect, canSelect = () => true }) {
  const input = form.querySelector('#place-search'), button = form.querySelector('[type="submit"]');
  const status = form.querySelector('#search-status'), results = form.querySelector('#search-results');
  const lifetime = new AbortController();
  let pending = false;
  const reads = new LatestRequest((value) => {
    pending = value;
    button.setAttribute('aria-disabled', String(value));
    if (value) form.setAttribute('aria-busy', 'true'); else form.removeAttribute('aria-busy');
  });
  const cancel = () => { reads.cancel(); results.replaceChildren(); status.textContent = ''; input.removeAttribute('aria-invalid'); };
  input.addEventListener('input', cancel, { signal: lifetime.signal });
  form.querySelector('#clear-search').addEventListener('click', () => { cancel(); input.value = ''; input.focus(); status.textContent = 'Search cleared. Your selected point and contribution text are unchanged.'; }, { signal: lifetime.signal });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (pending || !canSelect()) return;
    cancel();
    const query = input.value.trim();
    if (query.length < 3) { input.setAttribute('aria-invalid', 'true'); status.textContent = 'Enter at least three characters to search.'; return; }
    status.textContent = 'Searching Philadelphia locations…';
    void reads.run((signal) => lookup(query, signal), (response) => {
      if (!Array.isArray(response.results)) throw new Error('The location service returned an unreadable response. Try again.');
      for (const result of response.results) {
        const item = document.createElement('li'), choice = document.createElement('button');
        choice.type = 'button';
        choice.textContent = `${result.label} — ${result.kind === 'landmark' ? 'local landmark' : result.kind}; approximate point`;
        choice.addEventListener('click', () => { if (canSelect() && input.value.trim() === query) onSelect(result); }, { signal: lifetime.signal });
        item.append(choice); results.append(item);
      }
      status.textContent = `${response.warning ? response.warning + ' ' : ''}${response.results.length ? `${response.results.length} ${response.results.length === 1 ? 'match' : 'matches'}. Choose a result, then check its point and place name.` : 'No matching Philadelphia location. Check the street number or both street names. You can also place a pin, enter coordinates, or describe the place without a point.'}`;
    }, (error) => { input.setAttribute('aria-invalid', 'true'); status.textContent = error.message; });
  }, { signal: lifetime.signal });
  return { cancel, destroy() { reads.cancel(); lifetime.abort(); } };
}
