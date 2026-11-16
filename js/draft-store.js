import { KINDS, TOPICS, SESSIONS } from './domain.js';
import { isPhiladelphiaPoint } from './geography.js';

const KEY = 'community-safety-demo-participant';
const text = (value, max) => typeof value === 'string' && value.length <= max ? value : '';
const recordId = (value) => typeof value === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(value);

function contributionDraft(raw) {
  if (!raw || !raw.dirty || !/^[a-f0-9-]{36}$/.test(raw.id || '')) return null;
  const geometry = raw.geometry?.type === 'Point' && isPhiladelphiaPoint(raw.geometry.coordinates)
    ? { type: 'Point', coordinates: [...raw.geometry.coordinates] }
    : null;
  return {
    id: raw.id,
    kind: Object.hasOwn(KINDS, raw.kind) ? raw.kind : '',
    topic: Object.hasOwn(TOPICS, raw.topic) ? raw.topic : '',
    placeLabel: text(raw.placeLabel, 140),
    description: text(raw.description, 800),
    context: text(raw.context, 120),
    geometry,
    locationSource: geometry && ['map', 'catalog', 'geocoder', 'coordinates'].includes(raw.locationSource) ? raw.locationSource : 'description',
    precision: raw.precision === 'point' ? 'point' : 'approximate',
    dirty: true,
    ...(Number.isSafeInteger(raw.expectedVersion) && raw.expectedVersion > 0 ? { expectedVersion: raw.expectedVersion } : {}),
  };
}

function responseDrafts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry) => Array.isArray(entry) && /^[a-zA-Z0-9-]{1,80}:[1-9][0-9]*$/.test(entry[0]) && entry[1] && typeof entry[1] === 'object')
    .map(([key, value]) => [key, {
      answer: ['similar', 'different', 'unsure'].includes(value.answer) ? value.answer : null,
      note: text(value.note, 400),
      question: text(value.question, 200),
      choiceLabel: text(value.choiceLabel, 120),
    }]);
}

function snapshot(raw) {
  if (!raw || !/^[a-f0-9]{64}$/.test(raw.token || '')) return null;
  if (raw.activeSession && !SESSIONS.some((s) => s.id === raw.activeSession && s.accepting)) return null;
  return {
    token: raw.token,
    activeSession: SESSIONS.some((s) => s.id === raw.activeSession && s.accepting) ? raw.activeSession : 'practice-current',
    draft: contributionDraft(raw.draft),
    responseDrafts: responseDrafts(raw.responseDrafts),
    mode: ['list', 'form', 'detail'].includes(raw.mode) ? raw.mode : 'list',
    detailId: recordId(raw.detailId) ? raw.detailId : null,
  };
}

// Browser-tab recovery only. Restored writing is never submitted automatically.
export function createDraftStore(storage, onUnavailable = () => {}) {
  return {
    read() {
      try { return snapshot(JSON.parse(storage().getItem(KEY))); } catch { onUnavailable(); return null; }
    },
    save(value) {
      try {
        const current = snapshot(value);
        if (current) storage().setItem(KEY, JSON.stringify(current)); else storage().removeItem(KEY);
        return true;
      } catch { onUnavailable(); return false; }
    },
    recover(token, activeSession) {
      const saved = this.read();
      return saved?.token === token && saved.activeSession === activeSession ? saved : null;
    },
  };
}
