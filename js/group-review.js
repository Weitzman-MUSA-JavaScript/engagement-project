import { GeographicMap } from './map.js';
import { ReviewSequence, streetViewUrl } from './review-sequence.js';
import { KINDS, TOPICS, SESSIONS, escapeText as esc } from './domain.js';

export class GroupReview {
  constructor(dialog, refresh) {
    this.dialog = dialog; this.refresh = refresh; this.sequence = new ReviewSequence(); this.generation = 0;
    dialog.innerHTML = `<header class="review-toolbar"><div><h2 id="group-review-title">Group review</h2><p id="review-progress" role="status" aria-live="polite"></p></div><div class="actions"><button type="button" id="review-fullscreen">Full screen</button><button type="button" id="review-exit">Exit review</button></div></header>
      <div class="review-layout"><section class="review-map-panel" data-map-view aria-label="Review map">
        <div class="review-map-tools"><label>Map layer <select id="review-layer"><option value="aerial">Aerial imagery</option><option value="street">Street map</option></select></label><button type="button" id="review-center">Center this place</button><button type="button" id="review-city">City overview</button><button type="button" data-map="zoom-in" aria-label="Zoom in">+</button><button type="button" data-map="zoom-out" aria-label="Zoom out">−</button></div>
        <div id="review-map-container"></div><p data-map-position class="note review-map-position"></p>
      </section><aside class="review-sidebar" aria-label="Contribution details">
        <div class="review-navigation"><button type="button" id="review-previous">Previous</button><button type="button" id="review-next" class="primary">Next contribution</button></div>
        <label for="review-jump">Choose a contribution</label><select id="review-jump"></select>
        <div id="review-contribution"></div><a id="review-street-view" target="_blank" rel="noopener noreferrer" hidden>Open Street View (new tab)</a>
        <p class="note">Aerial imagery: 2021–2023. Street View coverage and dates vary.</p>
        <button type="button" id="review-refresh">Refresh contributions</button><p id="review-feedback" class="note" role="status"></p>
      </aside></div>`;
    const $ = (selector) => dialog.querySelector(selector);
    this.$ = $;
    this.map = new GeographicMap($('#review-map-container'), (id) => { this.sequence.select(id); this.render(); }, () => {}, { label: 'Group contribution review map', flexible: true });
    $('#review-previous').addEventListener('click', () => { this.sequence.step(-1); this.render(); });
    $('#review-next').addEventListener('click', () => { this.sequence.step(1); this.render(); });
    $('#review-jump').addEventListener('change', (event) => { this.sequence.select(event.target.value); this.render(); });
    $('#review-layer').addEventListener('change', (event) => this.map.setBasemap(event.target.value));
    $('#review-center').addEventListener('click', () => this.render());
    $('#review-city').addEventListener('click', () => { this.map.set({ pins: this.sequence.records, selected: this.sequence.current?.id }); this.map.move('city'); });
    $('#review-exit').addEventListener('click', () => dialog.close());
    $('#review-fullscreen').hidden = !document.fullscreenEnabled;
    $('#review-fullscreen').addEventListener('click', async () => {
      try { if (document.fullscreenElement === dialog) await document.exitFullscreen(); else await dialog.requestFullscreen(); }
      catch { $('#review-feedback').textContent = 'Browser full screen is unavailable. The review still fills this window.'; }
    });
    document.addEventListener('fullscreenchange', () => { $('#review-fullscreen').textContent = document.fullscreenElement === dialog ? 'Windowed view' : 'Full screen'; });
    dialog.addEventListener('close', () => {
      this.generation += 1;
      if (document.fullscreenElement === dialog) void document.exitFullscreen();
      this.map.set({ pins: [], selected: null });
      this.sequence.replace([]); $('#review-contribution').textContent = '';
      $('#review-jump').replaceChildren(); $('#review-street-view').removeAttribute('href');
      this.returnFocus?.focus();
    });
    $('#review-refresh').addEventListener('click', async () => {
      const generation = this.generation;
      const controls = [...dialog.querySelectorAll('button, select')].filter((node) => !['review-exit', 'review-fullscreen'].includes(node.id));
      controls.forEach((node) => { node.disabled = true; }); $('#review-feedback').textContent = 'Refreshing contributions…';
      try {
        const records = await this.refresh();
        if (!dialog.open || generation !== this.generation) return;
        this.sequence.replace(records); this.updateChoices(); this.render(); $('#review-feedback').textContent = 'Contributions refreshed.';
      } catch { if (dialog.open && generation === this.generation) $('#review-feedback').textContent = 'Could not refresh. The current review is kept; try again.'; }
      finally { if (dialog.open && generation === this.generation) { controls.forEach((node) => { node.disabled = false; }); this.updateNavigation(); } }
    });
  }

  open(records, selectedId, returnFocus = document.activeElement) {
    this.returnFocus = returnFocus;
    this.generation += 1;
    this.sequence.replace(records, selectedId); this.updateChoices();
    this.$('#review-feedback').textContent = '';
    for (const control of this.dialog.querySelectorAll('button, select')) control.disabled = false;
    this.dialog.showModal(); this.$('#review-layer').value = 'aerial'; this.map.basemap = 'aerial';
    this.render(); this.$('#review-exit').focus();
  }

  updateChoices() {
    this.$('#review-jump').innerHTML = this.sequence.records.map((p) => `<option value="${esc(p.id)}">${esc(p.placeLabel)}</option>`).join('');
  }

  updateNavigation() {
    this.$('#review-previous').disabled = !this.sequence.previous;
    this.$('#review-next').disabled = !this.sequence.next;
    this.$('#review-jump').disabled = !this.sequence.current;
    this.$('#review-center').disabled = !this.sequence.current?.geometry;
  }

  render() {
    const p = this.sequence.current;
    this.updateNavigation();
    this.$('#review-progress').textContent = p ? `${this.sequence.index + 1} of ${this.sequence.records.length} · Current filters` : 'No contributions match the current filters.';
    this.$('#review-jump').value = p?.id || '';
    this.$('#review-contribution').innerHTML = p ? `<h3>${esc(p.placeLabel)}</h3><p class="review-kind">${esc(KINDS[p.kind])} · ${esc(TOPICS[p.topic])}</p><p class="account-text">${esc(p.description)}</p>${p.context ? `<p><strong>When:</strong> ${esc(p.context)}</p>` : ''}<p class="note">${esc(SESSIONS.find((s) => s.id === p.sessionId)?.title || p.sessionId)}${p.createdAt ? ` · ${esc(new Date(p.createdAt).toLocaleDateString())}` : ''}${p.fixture ? ' · Fictional example' : ' · Practice input'}</p><p class="note">${p.geometry ? (p.precision === 'approximate' ? 'Approximate point. Check the location with the group.' : 'Selected point. Check the location with the group.') : 'No confirmed map point. This contribution is included without assigning a location.'}</p>` : '<h3>No contributions to review</h3><p>Exit review and change the filters, or refresh to check for new input.</p>';
    const link = this.$('#review-street-view'); link.hidden = !p?.geometry;
    if (p?.geometry) link.href = streetViewUrl(p.geometry.coordinates); else link.removeAttribute('href');
    if (p?.geometry) { this.map.view.focus(p.geometry.coordinates); this.map.view.width = 700; this.map.showingCity = false; }
    else { this.map.view.fit(this.map.cityBounds); this.map.showingCity = true; }
    this.map.set({ pins: p?.geometry ? [p] : [], selected: p?.id || null });
  }
}
