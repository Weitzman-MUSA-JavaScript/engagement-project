export const kinds = {
  concern: { label: 'Safety concern', symbol: '!', prompt: 'Something that makes safety harder.' },
  asset: { label: 'Community asset', symbol: '+', prompt: 'A place that helps people feel or stay safe.' },
  idea: { label: 'Improvement idea', symbol: '↗', prompt: 'A change you would like to discuss.' },
};

export const topics = {
  walking: 'Walking & crossings',
  lighting: 'Lighting & visibility',
  gathering: 'Gathering & support',
  public_space: 'Public spaces',
  violence: 'Violence & conflict',
  other: 'Other / not sure',
};

// A deliberately schematic coordinate space, not a geographic basemap.
export const places = [
  { id: 'p1', label: '46th Street & Baltimore Avenue', x: 61, y: 75, aliases: '46 baltimore trolley crossing' },
  { id: 'p2', label: 'Clark Park, north entrance', x: 79, y: 81, aliases: '43 chester park' },
  { id: 'p3', label: '48th Street & Walnut Street', x: 43, y: 39, aliases: '48 walnut' },
  { id: 'p4', label: '52nd Street & Market Street', x: 16, y: 17, aliases: '52 market transit' },
  { id: 'p5', label: '47th Street & Spruce Street', x: 52, y: 55, aliases: '47 spruce' },
  { id: 'p6', label: '40th Street & Chestnut Street', x: 90, y: 29, aliases: '40 chestnut' },
  { id: 'p7', label: '49th Street & Baltimore Avenue', x: 34, y: 68, aliases: '49 baltimore' },
  { id: 'p8', label: '45th Street & Walnut Street', x: 70, y: 39, aliases: '45 walnut' },
];

export const seedContributions = [
  { id: 'example-1', placeId: 'p1', kind: 'concern', topic: 'walking', title: 'More time to cross', description: 'It can be difficult to cross before the signal changes, especially with a walker or young children. More crossing time would help.', context: 'Afternoon and early evening', session: 'earlier', date: '2026-10-14', exampleCounts: [7, 2, 3] },
  { id: 'example-2', placeId: 'p2', kind: 'asset', topic: 'gathering', title: 'A familiar place to meet', description: 'Having a well-used place to sit and meet neighbors makes this area feel welcoming. I would like to keep these gathering spaces accessible.', context: 'During the day', session: 'earlier', date: '2026-10-14', exampleCounts: [9, 1, 2] },
  { id: 'example-3', placeId: 'p3', kind: 'concern', topic: 'lighting', title: 'Hard to see the sidewalk', description: 'Some stretches of the sidewalk feel difficult to see after dark. It would help to discuss lighting and keeping the walking path clear.', context: 'After dark', session: 'earlier', date: '2026-10-14', exampleCounts: [4, 3, 2] },
  { id: 'example-4', placeId: 'p4', kind: 'idea', topic: 'gathering', title: 'A welcoming place to wait', description: 'Could we explore seating and a staffed community information point near transit? People could rest and find local support without needing to make a purchase.', context: '', session: 'today', date: '2026-10-21', exampleCounts: [5, 2, 4] },
  { id: 'example-5', placeId: 'p5', kind: 'asset', topic: 'public_space', title: 'Neighbors looking out for each other', description: 'Neighbors spending time outside creates opportunities to say hello and ask for help. Those everyday connections are part of safety for me.', context: 'Early evening', session: 'today', date: '2026-10-21', exampleCounts: [3, 1, 3] },
  { id: 'example-6', placeId: 'p6', kind: 'idea', topic: 'violence', title: 'Make support easier to find', description: 'A clearly marked place to find information about conflict support and community resources could be useful. The details would need discussion with local organizations.', context: '', session: 'today', date: '2026-10-21', exampleCounts: [4, 1, 5] },
].map((pin) => ({ ...pin, location: { ...places.find((place) => place.id === pin.placeId) }, synthetic: true }));

export function searchPlaces(query) {
  const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\b(street|avenue|st|ave|and|at)\b/g, '').trim();
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return places.filter((place) => words.every((word) => normalize(`${place.label} ${place.aliases}`).includes(word)));
}

export function validateLocation(location) {
  if (!location || !Number.isFinite(location.x) || !Number.isFinite(location.y) || location.x < 0 || location.x > 100 || location.y < 0 || location.y > 100) return 'Choose a place from search or place a pin on the diagram.';
  if (!location.label?.trim()) return 'Add a place name or nearby intersection.';
  return '';
}

export function validateDescription(draft) {
  const errors = [];
  if (!kinds[draft.kind]) errors.push({ field: 'kind-concern', message: 'Choose what you would like to share.' });
  if (!topics[draft.topic]) errors.push({ field: 'topic-walking', message: 'Choose a topic, or select Other / not sure.' });
  if (!draft.description?.trim()) errors.push({ field: 'description', message: 'Tell us what matters about this place.' });
  if (draft.description?.length > 600) errors.push({ field: 'description', message: 'Keep your description to 600 characters or fewer.' });
  return errors;
}

export function responseOptions(kind) {
  return kind === 'idea'
    ? { question: 'Do you support this suggested improvement?', labels: ['I support this idea', 'I do not support this idea', 'I’m not sure / need more information'] }
    : { question: 'How does this compare with your experience of this place?', labels: ['My experience is similar', 'My experience is different', 'I’m not familiar enough to say'] };
}

export function responseSummary(pin, response) {
  const counts = [...(pin.exampleCounts || [0, 0, 0])];
  if (response && [0, 1, 2].includes(response.answer)) counts[response.answer] += 1;
  return { counts, total: counts.reduce((sum, count) => sum + count, 0) };
}

export function filterContributions(pins, filters) {
  return pins.filter((pin) => (!filters.kind || pin.kind === filters.kind) && (!filters.topic || pin.topic === filters.topic) && (!filters.session || pin.session === filters.session));
}

export function escapeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
