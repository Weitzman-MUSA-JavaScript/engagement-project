import { isPhiladelphiaPoint } from './geography.js';

export const KINDS = { concern: 'Safety concern', asset: 'Community asset', idea: 'Improvement idea' };
export const TOPICS = { walking: 'Walking & crossings', lighting: 'Lighting & visibility', gathering: 'Gathering & support', public_space: 'Public spaces', violence: 'Violence & conflict', other: 'Other / not sure' };
export function contributionPrompt(kind) {
  const prompts = {
    concern: { label: 'Describe your safety concern or experience (required)', help: 'What makes safety harder at this place? Describe your experience and any conditions that matter.' },
    asset: { label: 'Describe what makes this place helpful (required)', help: 'How does this place support safety, connection, or access to help? Describe what you value about it.' },
    idea: { label: 'Describe your improvement idea (required)', help: 'What would you like to change at this place, and how could it help? Saving an idea does not promise action or funding.' },
  };
  return Object.hasOwn(prompts, kind) ? prompts[kind] : { label: 'Describe one experience or idea (required)', help: 'What affects safety here? Describe a concern, a community asset, or an improvement.' };
}
export const SESSIONS = [
  { id: 'practice-current', title: 'Community safety practice session', date: '2026-11-08', accepting: true, prompt: 'Describe a safety concern, a community asset, or an improvement. When does it affect safety?', protocol: 'independent-then-review-v1' },
  { id: 'example-earlier', title: 'Earlier illustrative session', date: '2026-10-14', accepting: false, prompt: 'Illustrative accounts for practicing review.', protocol: 'illustrative-v1' },
];
export const PLACES = [
  { label: 'Clark Park, West Philadelphia', coordinates: [-75.2095, 39.9495] },
  { label: '46th Street & Baltimore Avenue', coordinates: [-75.2155, 39.9486] },
  { label: '48th Street & Walnut Street', coordinates: [-75.2193, 39.9552] },
  { label: '52nd Street & Market Street', coordinates: [-75.2246, 39.9603] },
  { label: 'City Hall, Philadelphia', coordinates: [-75.1636, 39.9526] },
  { label: '40th Street & Chestnut Street', coordinates: [-75.2024, 39.9542] },
  { label: 'Malcolm X Park, West Philadelphia', coordinates: [-75.2211, 39.9510] },
  { label: 'Cobbs Creek Park, Walnut Street entrance', coordinates: [-75.2475, 39.9571] },
];
const example = (id, kind, topic, place, description, context) => ({ id, sessionId: 'example-earlier', version: 1, kind, topic, placeLabel: place.label, geometry: { type: 'Point', coordinates: place.coordinates }, precision: 'approximate', locationStatus: 'placed', locationSource: 'illustrative-place', description, context, createdAt: '2026-10-14T15:00:00Z', updatedAt: '2026-10-14T15:00:00Z', demo: true, fixture: true });
export const EXAMPLES = [
  example('example-crossing', 'concern', 'walking', PLACES[1], 'I sometimes need more time to cross this intersection when walking with someone who moves slowly.', 'Afternoon'),
  example('example-gathering', 'asset', 'gathering', PLACES[0], 'A familiar outdoor gathering place helps me feel connected to neighbors.', 'During the day'),
  example('example-lighting', 'concern', 'lighting', PLACES[2], 'The walking route can be difficult to see after dark. My experience may differ from someone using it in daylight.', 'After dark'),
  example('example-support', 'idea', 'violence', PLACES[3], 'I would like to discuss a clearly marked place to find information about community conflict support.', ''),
];
export class ValidationError extends Error {
  constructor(errors) { super('Please check the highlighted fields.'); this.errors = errors; }
}
export function cleanText(value, max) { return typeof value === 'string' ? value.trim().slice(0, max + 1) : ''; }
export function validateContribution(raw) {
  const errors = {};
  const value = { kind: raw.kind, topic: raw.topic || 'other', placeLabel: cleanText(raw.placeLabel, 140), description: cleanText(raw.description, 800), context: cleanText(raw.context, 120), precision: raw.precision === 'approximate' ? 'approximate' : 'point', geometry: raw.geometry ?? null, locationSource: ['map', 'catalog', 'geocoder', 'coordinates', 'description'].includes(raw.locationSource) ? raw.locationSource : 'description', locationStatus: raw.geometry ? 'placed' : 'unconfirmed', demo: true };
  if (!Object.hasOwn(KINDS, value.kind)) errors.kind = 'Choose a contribution type.';
  if (!Object.hasOwn(TOPICS, value.topic)) errors.topic = 'Choose a topic or Other / not sure.';
  if (!value.placeLabel || value.placeLabel.length > 140) errors.placeLabel = 'Describe the place in 1–140 characters.';
  if (!value.description || value.description.length > 800) errors.description = 'Describe one experience or idea in 1–800 characters.';
  if (value.context.length > 120) errors.context = 'Keep the time/context note to 120 characters.';
  if (value.geometry) {
    const c = value.geometry.coordinates;
    if (value.geometry.type !== 'Point' || !isPhiladelphiaPoint(c)) errors.location = 'Choose a point within Philadelphia city limits, or use a place description without a point.';
    else {
      const rounded = c.map((n) => Math.round(n * 100000) / 100000);
      value.geometry = { type: 'Point', coordinates: isPhiladelphiaPoint(rounded) ? rounded : [...c] };
    }
  }
  if (!value.geometry && raw.locationSource !== 'description') errors.location = 'Place a pin, choose a search result, enter coordinates, or choose Describe without a point.';
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return value;
}
export function responseQuestion(kind) {
  return kind === 'idea'
    ? { id: 'support-v1', text: 'Do you support this specific improvement idea?', options: { similar: 'I support this idea', different: 'I do not support this idea', unsure: 'I need more information / am not sure' } }
    : { id: 'experience-v1', text: 'How does this account compare with your experience of this place?', options: { similar: 'My experience is similar', different: 'My experience is different', unsure: 'I am not familiar enough to say' } };
}
export function validateResponse(raw, kind) {
  const question = responseQuestion(kind);
  const note = cleanText(raw.note, 400);
  const errors = {};
  if (!Object.hasOwn(question.options, raw.answer)) errors.answer = 'Choose a response, or continue without answering.';
  if (note.length > 400) errors.note = 'Keep the comment to 400 characters.';
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return { answer: raw.answer, note, questionId: question.id };
}
export function summarize(responses, version) {
  const counts = { similar: 0, different: 0, unsure: 0 };
  for (const response of responses) if (response.version === version && Object.hasOwn(counts, response.answer)) counts[response.answer] += 1;
  return { counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
}
export function searchPlaces(query) {
  const normalized = (s) => s.toLowerCase().replace(/(\d+)(st|nd|rd|th)\b/g, '$1').replace(/[^a-z0-9 ]/g, ' ').replace(/\b(and|at|street|st|avenue|ave|road|rd|boulevard|blvd|philadelphia|pa)\b/g, ' ').trim();
  const words = normalized(query).split(/\s+/).filter(Boolean);
  return words.length ? PLACES.filter((p) => words.every((w) => /^\d+$/.test(w) ? normalized(p.label).split(/\s+/).includes(w) : normalized(p.label).includes(w))) : [];
}
export function escapeText(value) { return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
