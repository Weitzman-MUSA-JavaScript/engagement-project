import { escapeText } from './data.js';

export function mapMarkup({ pins = [], selected = null, placement = false } = {}) {
  return `<div class="map-diagram ${placement ? 'placing' : ''}" id="neighborhood-map">
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M0 20H100M0 40H100M0 60H100M0 80H100M20 0V100M40 0V100M60 0V100M80 0V100" fill="none" stroke="#ddd" stroke-width="1"/></svg>
    ${pins.map((pin, index) => `<button type="button" class="map-pin ${selected?.id === pin.id ? 'selected' : ''}" style="left:${Number(pin.location.x)}%;top:${Number(pin.location.y)}%" data-pin="${escapeText(pin.id)}" aria-label="Place ${index + 1}: ${escapeText(pin.location.label)}">${index + 1}</button>`).join('')}
    ${placement && selected ? `<span class="draft-pin" style="left:${Number(selected.x)}%;top:${Number(selected.y)}%" aria-hidden="true">Pin</span>` : ''}
    <span class="map-caption">Map placeholder · approximate positions</span>
  </div>`;
}

export function mapPoint(event, element) {
  const rect = element.getBoundingClientRect();
  return { x: Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)), y: Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100)), label: '', source: 'schematic-map' };
}
