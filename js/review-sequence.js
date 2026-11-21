export class ReviewSequence {
  constructor(records = [], selectedId) { this.replace(records, selectedId); }
  replace(records, selectedId = this.current?.id) {
    this.records = structuredClone(records);
    this.index = Math.max(0, this.records.findIndex((p) => p.id === selectedId));
  }

  get current() { return this.records?.[this.index] || null; }
  get previous() { return this.index > 0; }
  get next() { return this.index + 1 < this.records.length; }
  step(direction) { this.index = Math.max(0, Math.min(Math.max(0, this.records.length - 1), this.index + direction)); }
  select(id) { const index = this.records.findIndex((p) => p.id === id); if (index >= 0) this.index = index; }
}

export function streetViewUrl(coordinates) {
  const url = new URL('https://www.google.com/maps/@');
  url.searchParams.set('api', '1'); url.searchParams.set('map_action', 'pano');
  url.searchParams.set('viewpoint', `${coordinates[1]},${coordinates[0]}`);
  return url.href;
}
