const KEY = 'community-safety-wireframe-v1';
export const emptyData = () => ({ contributions: [], responses: {} });

export function readDemo(storage) {
  try {
    const value = JSON.parse(storage.getItem(KEY));
    if (!value || !Array.isArray(value.contributions) || !value.responses || typeof value.responses !== 'object' || Array.isArray(value.responses)) return emptyData();
    return value;
  } catch {
    return emptyData();
  }
}

export function saveDemo(storage, value) {
  // Update application state only after this write succeeds.
  storage.setItem(KEY, JSON.stringify(value));
}

export function putContribution(data, pin) {
  return { ...data, contributions: [...data.contributions.filter((item) => item.id !== pin.id), pin] };
}

export function putResponse(data, id, answer, note) {
  if (![0, 1, 2].includes(answer)) throw new Error('Choose a response.');
  return { ...data, responses: { ...data.responses, [id]: { answer, note, session: 'today' } } };
}
