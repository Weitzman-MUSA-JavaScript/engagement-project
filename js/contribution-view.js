import { KINDS, TOPICS } from './domain.js';

const normalize = (value) => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

export function filterContributions(contributions, filters = {}) {
  const words = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
  return contributions.filter((pin) => {
    if (filters.session && pin.sessionId !== filters.session) return false;
    if (filters.topic && pin.topic !== filters.topic) return false;
    if (filters.kind && pin.kind !== filters.kind) return false;
    if (filters.location === 'mapped' && !pin.geometry) return false;
    if (filters.location === 'described' && pin.geometry) return false;
    const text = normalize([pin.placeLabel, pin.description, pin.context, KINDS[pin.kind], TOPICS[pin.topic]].join(' '));
    return words.every((word) => text.includes(word));
  });
}

export function describeContributionView(pins, available) {
  const counts = { concern: 0, asset: 0, idea: 0 };
  let described = 0;
  for (const pin of pins) {
    if (Object.hasOwn(counts, pin.kind)) counts[pin.kind] += 1;
    if (!pin.geometry) described += 1;
  }
  const count = (value, label) => `${value} ${label}${value === 1 ? '' : 's'}`;
  return `Showing ${pins.length} of ${available} available ${available === 1 ? 'account' : 'accounts'}: ${count(counts.concern, 'safety concern')}, ${count(counts.asset, 'community asset')}, ${count(counts.idea, 'improvement idea')}. ${described} described without a point. Accounts are not counts of people.`;
}

export function initContributionFilters(form, onFilter) {
  let timer;
  const values = () => Object.fromEntries([...form.elements].filter((control) => control.name).map((control) => [control.name, control.value]));
  const emit = () => {
    clearTimeout(timer);
    form.dispatchEvent(new CustomEvent('filter', { detail: values() }));
  };
  form.addEventListener('filter', onFilter);
  form.addEventListener('submit', (event) => { event.preventDefault(); emit(); });
  form.addEventListener('change', emit);
  form.querySelector('[name="query"]').addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(emit, 250);
  });
  form.addEventListener('reset', (event) => {
    event.preventDefault();
    clearTimeout(timer);
    for (const control of form.querySelectorAll('input, select')) control.value = '';
    emit();
  });
  return {
    reset() {
      clearTimeout(timer);
      for (const control of form.querySelectorAll('input, select')) control.value = '';
      return values();
    },
  };
}
