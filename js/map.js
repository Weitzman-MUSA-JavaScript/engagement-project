import { escapeText as esc } from './domain.js';
import { groupMapPins } from './map-model.js';
import { visibleTiles } from './basemap.js';
import { CITY_GEOMETRY } from './city-boundary.js';
import { MapPan } from './map-pan.js';
import { MapViewport, INITIAL_BOUNDS, CITY_BOUNDS } from './geography.js';

export class GeographicMap {
  constructor(container, onSelect, onPlace, { label = 'Philadelphia safety map', flexible = false, pointControls = false } = {}) {
    Object.assign(this, { container, onSelect, onPlace, flexible, basemap: 'street', view: new MapViewport(CITY_BOUNDS), cityBounds: CITY_BOUNDS, showingCity: true, pins: [], draft: null, selected: null, placing: false, groups: new Map(), expandedGroup: null });
    this.root = container.closest('[data-map-view]') || container;
    const helpId = `${container.id}-help`, selectionId = `${container.id}-selection`;
    container.innerHTML = `
      <p id="${helpId}" class="note map-instructions">Explore with the map controls below, or drag to move the map. When the map has keyboard focus, arrow keys move it, +/− zoom, and Home shows Philadelphia. Points must stay inside the city boundary.<span data-map-coverage class="map-coverage"></span></p>
      <div class="map-stage" tabindex="0" role="region" aria-label="${esc(label)}" aria-describedby="${helpId}">
        <svg class="map-surface" viewBox="0 0 600 440" aria-hidden="true">
          <g class="basemap"></g>
          <path class="outside-city" fill-rule="evenodd"/>
          <path class="city-boundary"/>
          <circle class="draft" r="10" hidden/>
        </svg>
        <div class="map-markers" role="group" aria-label="Mapped accounts"></div>
      </div>
      <fieldset class="map-controls"><legend>Map controls</legend>
        <div class="actions map-zoom-controls"><button type="button" data-map="zoom-in" aria-label="Zoom in">+ Zoom in</button><button type="button" data-map="zoom-out" aria-label="Zoom out">− Zoom out</button><button type="button" data-map="city">Show Philadelphia</button></div>
        <div class="actions" role="group" aria-label="Move the map"><span>Move map:</span><button type="button" data-map="west">West</button><button type="button" data-map="north">North</button><button type="button" data-map="south">South</button><button type="button" data-map="east">East</button></div>
        ${pointControls ? '<div class="actions" role="group" aria-label="Your contribution point"><button type="button" id="use-map-center">Use map center as my point</button><button type="button" id="return-draft-point" hidden>Return to your point</button></div>' : ''}
      </fieldset>
      <p data-street-attribution class="map-attribution">© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> | <a href="https://www.openstreetmap.org/fixthemap">Report a map issue</a></p>
      <p data-aerial-attribution class="map-attribution" hidden>Aerial imagery: PEMA 2021–2023 / <a href="https://imagery.pasda.psu.edu/arcgis/rest/services/PEMAImagery2021_2023cache/MapServer">PASDA</a></p>
      <p data-map-availability class="note" role="status">Street map loading. The form and list are available.</p>
      <div id="${selectionId}" class="map-selection" data-map-selection hidden></div>`;
    this.svg = container.querySelector('svg');
    this.markers = container.querySelector('.map-markers');
    this.pan = new MapPan(this.view);
    this.bindNavigation();
    container.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-map-group]')) { this.closeChoices(true); return; }
      const choice = event.target.closest('[data-map-account]');
      if (choice) { this.onSelect(choice.dataset.mapAccount); return; }
      const marker = event.target.closest('[data-map-group]');
      if (marker) {
        const group = this.groups.get(marker.dataset.mapGroup);
        if (group.members.length === 1) this.onSelect(group.members[0].pin.id);
        else {
          this.closeChoices();
          this.expandedGroup = group.id;
          marker.setAttribute('aria-expanded', 'true');
          const list = container.querySelector('[data-map-selection]');
          list.hidden = false;
          list.innerHTML = `<h3 tabindex="-1">${group.members.length} accounts near this point</h3><ul>${group.members.map(({ pin }) => `<li><button type="button" data-map-account="${esc(pin.id)}">${esc(pin.placeLabel)}</button></li>`).join('')}</ul><button type="button" data-close-map-group>Close nearby accounts</button>`;
          list.querySelector('h3').focus();
        }
        return;
      }
      if (event.target.closest('svg') && this.suppressMapClick) { this.suppressMapClick = false; return; }
      if (event.target.closest('svg') && this.placing) {
        const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(this.svg.getScreenCTM().inverse());
        this.onPlace(this.unproject(point.x, point.y));
      }
    });
    this.root.querySelectorAll('[data-map]').forEach((button) => button.addEventListener('click', () => this.move(button.dataset.map)));
    this.resize = new ResizeObserver(() => this.draw());
    this.resize.observe(container);
    this.draw();
  }

  bindNavigation() {
    const point = (event) => {
      const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(this.svg.getScreenCTM().inverse());
      return [p.x, p.y];
    };
    this.svg.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || !event.isPrimary) return;
      this.suppressMapClick = false;
      this.pan.start(event.pointerId, [event.clientX, event.clientY], point(event));
      this.svg.setPointerCapture(event.pointerId);
    });
    this.svg.addEventListener('pointermove', (event) => {
      if (!this.pan.update(event.pointerId, [event.clientX, event.clientY], point(event))) return;
      this.showingCity = false;
      this.svg.classList.add('dragging');
      this.closeChoices();
      if (!this.panFrame) this.panFrame = requestAnimationFrame(() => { this.panFrame = null; this.draw(); });
    });
    const finish = (event) => {
      const gesture = this.pan.end(event.pointerId);
      if (!gesture) return;
      this.suppressMapClick = gesture.moved || event.type !== 'pointerup';
      this.svg.classList.remove('dragging');
      if (this.panFrame) { cancelAnimationFrame(this.panFrame); this.panFrame = null; }
      this.draw();
      if (this.svg.hasPointerCapture(event.pointerId)) this.svg.releasePointerCapture(event.pointerId);
    };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) this.svg.addEventListener(type, finish);
    const stage = this.container.querySelector('.map-stage');
    stage.addEventListener('keydown', (event) => {
      if (event.target !== stage) return;
      const action = { 'ArrowLeft': 'west', 'ArrowRight': 'east', 'ArrowUp': 'north', 'ArrowDown': 'south', '+': 'zoom-in', '=': 'zoom-in', '-': 'zoom-out', 'Home': 'city' }[event.key];
      if (action) { event.preventDefault(); this.move(action); }
    });
  }

  async init() { this.draw(); }

  setBasemap(value) {
    this.basemap = value === 'aerial' ? 'aerial' : 'street';
    this.renderedBasemap = null;
    this.draw();
  }

  drawBasemap(width) {
    if (!width) return;
    const source = this.basemap, aerial = source === 'aerial';
    this.svg.classList.toggle('show-aerial', aerial);
    this.container.querySelector('[data-street-attribution]').hidden = aerial;
    this.container.querySelector('[data-aerial-attribution]').hidden = !aerial;
    const layer = this.svg.querySelector('.basemap');
    if (this.renderedBasemap !== this.basemap) { layer.replaceChildren(); this.renderedBasemap = this.basemap; }
    const existing = new Map([...layer.children].map((node) => [node.dataset.tile, node]));
    const updateStatus = () => {
      if (this.basemap !== source) return;
      const images = [...layer.children];
      const failed = images.some((image) => image.dataset.status === 'error');
      this.container.querySelector('[data-map-availability]').textContent = failed
        ? (aerial ? 'Some aerial tiles are unavailable. Switch to Street map to continue.' : 'Some street tiles are unavailable. The form and list still work.')
        : images.some((image) => image.dataset.status === 'loading') ? (aerial ? 'Loading aerial imagery…' : 'Street map loading. The form and list are available.') : (aerial ? 'Aerial imagery ready.' : 'Street map ready.');
    };
    for (const tile of visibleTiles(this.view, this.basemap, width)) {
      let image = existing.get(tile.key);
      existing.delete(tile.key);
      if (!image) {
        image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.dataset.tile = tile.key; image.dataset.status = 'loading';
        image.addEventListener('load', () => { image.dataset.status = 'ready'; updateStatus(); });
        image.addEventListener('error', () => { image.dataset.status = 'error'; updateStatus(); });
        image.setAttribute('href', tile.url);
        layer.append(image);
      }
      for (const key of ['x', 'y', 'width', 'height']) image.setAttribute(key, tile[key]);
    }
    for (const image of existing.values()) image.remove();
    updateStatus();
  }

  project(coordinates) { return this.view.project(coordinates); }
  unproject(x, y) { return this.view.unproject(x, y); }
  center() { return this.unproject(300, this.view.height / 2); }

  closeChoices(focus = false) {
    const marker = [...this.markers.children].find((button) => button.dataset.mapGroup === this.expandedGroup);
    marker?.setAttribute('aria-expanded', 'false');
    this.expandedGroup = null;
    this.container.querySelector('[data-map-selection]').hidden = true;
    if (focus) marker?.focus();
  }

  focusPoint(coordinates, { neighborhood = false } = {}) { this.showingCity = false; this.view.focus(coordinates); if (neighborhood) this.view.width = 1600; this.draw(); }

  set(values = {}) {
    Object.assign(this, values);
    this.closeChoices();
    this.draw();
  }

  move(action) {
    this.showingCity = action === 'city';
    if (action === 'reset' || action === 'city') this.view.fit(action === 'reset' ? INITIAL_BOUNDS : this.cityBounds);
    else if (action.startsWith('zoom')) this.view.zoom(action === 'zoom-in' ? 0.65 : 1.4);
    else this.view.pan(action === 'east' ? 0.2 : action === 'west' ? -0.2 : 0, action === 'north' ? 0.2 : action === 'south' ? -0.2 : 0);
    this.closeChoices();
    this.draw();
  }

  draw() {
    const rect = this.svg.getBoundingClientRect();
    if (this.flexible) {
      if (rect.width && rect.height) {
        const height = 600 * rect.height / rect.width;
        if (this.view.height !== height) {
          this.view.height = height;
          this.svg.setAttribute('viewBox', `0 0 600 ${height}`);
          if (this.showingCity) this.view.fit(this.cityBounds);
        }
      }
    }
    this.drawBasemap(rect.width);
    if (this.boundaryKey !== this.view.key) {
      const path = CITY_GEOMETRY.coordinates.map((ring) => ring.map((p, i) => { const [x, y] = this.project(p); return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`; }).join(' ') + 'Z').join(' ');
      this.svg.querySelector('.city-boundary').setAttribute('d', path);
      this.svg.querySelector('.outside-city').setAttribute('d', `M0,0H600V${this.view.height}H0Z ${path}`);
      this.boundaryKey = this.view.key;
    }
    this.svg.classList.toggle('placing', this.placing);
    const width = rect.width || 600;
    const { groups, mapped, offscreen, unplotted } = groupMapPins(this.pins, (point) => this.project(point), width, this.view.height);
    const matrix = this.svg.getScreenCTM(), markerBounds = this.markers.getBoundingClientRect();
    this.groups = new Map(groups.map((group) => [group.id, group]));
    const existing = new Map([...this.markers.children].map((node) => [node.dataset.mapGroup, node]));
    for (const group of groups) {
      let button = existing.get(group.id);
      existing.delete(group.id);
      if (!button) { button = document.createElement('button'); button.type = 'button'; button.dataset.mapGroup = group.id; this.markers.append(button); }
      const single = group.members.length === 1;
      button.className = `map-marker ${single ? 'single' : 'cluster'}${group.members.some(({ pin }) => pin.id === this.selected) ? ' selected' : ''}`;
      button.textContent = single ? '' : `${group.members.length}`;
      button.setAttribute('aria-label', single ? `Read contribution: ${group.members[0].pin.placeLabel}` : `${group.members.length} grouped contribution points; choose a place`);
      if (single) {
        button.setAttribute('aria-pressed', String(group.members[0].pin.id === this.selected));
        button.removeAttribute('aria-expanded'); button.removeAttribute('aria-controls');
      } else {
        button.removeAttribute('aria-pressed');
        button.setAttribute('aria-expanded', String(group.id === this.expandedGroup));
        button.setAttribute('aria-controls', this.container.querySelector('[data-map-selection]').id);
      }
      if (matrix) {
        const point = new DOMPoint(group.x, group.y).matrixTransform(matrix);
        button.style.left = `${point.x - markerBounds.left}px`; button.style.top = `${point.y - markerBounds.top}px`;
      } else {
        button.style.left = `${group.x / 6}%`; button.style.top = `${group.y / this.view.height * 100}%`;
      }
    }
    for (const button of existing.values()) button.remove();
    if (this.expandedGroup && !this.groups.has(this.expandedGroup)) this.closeChoices();
    const dot = this.svg.querySelector('.draft');
    dot.toggleAttribute('hidden', !this.draft);
    if (this.draft) { const [x, y] = this.project(this.draft.coordinates); dot.setAttribute('cx', x); dot.setAttribute('cy', y); }
    this.container.querySelector('[data-map-coverage]').textContent = this.placing ? 'Click inside the city to place a pin. Drag to explore without moving your pin.' : `${this.pins.length} listed accounts: ${mapped} mapped in this view, ${offscreen} offscreen, ${unplotted} described without a point. Numbers count grouped points; small dots show individual contributions.`;
    const center = this.center();
    this.root.querySelector('[data-map-position]').textContent = `Map center: ${center[1].toFixed(4)} latitude, ${center[0].toFixed(4)} longitude. Map features are not safety ratings.`;
  }
}
