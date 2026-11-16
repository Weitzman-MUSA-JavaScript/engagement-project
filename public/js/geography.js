import { CITY_GEOMETRY } from './city-boundary.js';

export const COORDINATE_CRS = 'EPSG:4326';
export const DISPLAY_CRS = 'EPSG:3857';
export const PHILADELPHIA_BOUNDS = [-75.31, 39.86, -74.95, 40.15];
export const INITIAL_BOUNDS = [-75.255, 39.937, -75.195, 39.975];
export const CITY_BOUNDS = [-75.2803067548922, 39.8674718597081, -74.9557485615157, 40.1379348411103];
export const MAP_WIDTH = 600;
export const MAP_HEIGHT = 440;
const RADIUS = 6378137;
const RADIAN = Math.PI / 180;

function inPhiladelphiaBounds(coordinates) {
  return Array.isArray(coordinates) && coordinates.length === 2 && coordinates.every(Number.isFinite) && coordinates[0] >= PHILADELPHIA_BOUNDS[0] && coordinates[0] <= PHILADELPHIA_BOUNDS[2] && coordinates[1] >= PHILADELPHIA_BOUNDS[1] && coordinates[1] <= PHILADELPHIA_BOUNDS[3];
}

export function ringContains([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[j], [bx, by] = ring[i];
    const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
    if (Math.abs(cross) <= 1e-12 && x >= Math.min(ax, bx) - 1e-10 && x <= Math.max(ax, bx) + 1e-10 && y >= Math.min(ay, by) - 1e-10 && y <= Math.max(ay, by) + 1e-10) return true;
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

export function isPhiladelphiaPoint(coordinates) {
  return inPhiladelphiaBounds(coordinates) && ringContains(coordinates, CITY_GEOMETRY.coordinates[0]) && !CITY_GEOMETRY.coordinates.slice(1).some((ring) => ringContains(coordinates, ring));
}

export function toMercator([longitude, latitude]) {
  const lat = Math.max(-85.05112878, Math.min(85.05112878, latitude));
  return [RADIUS * longitude * RADIAN, RADIUS * Math.log(Math.tan(Math.PI / 4 + lat * RADIAN / 2))];
}

export function fromMercator([x, y]) {
  return [x / RADIUS / RADIAN, (2 * Math.atan(Math.exp(y / RADIUS)) - Math.PI / 2) / RADIAN];
}

export function geographyBounds(collection) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  const visit = (coordinates) => {
    if (typeof coordinates[0] === 'number') {
      if (!inPhiladelphiaBounds(coordinates)) throw new Error('Reference geography must use Philadelphia longitude/latitude coordinates.');
      bounds[0] = Math.min(bounds[0], coordinates[0]); bounds[1] = Math.min(bounds[1], coordinates[1]);
      bounds[2] = Math.max(bounds[2], coordinates[0]); bounds[3] = Math.max(bounds[3], coordinates[1]);
    } else for (const child of coordinates) visit(child);
  };
  const crs = collection.crs?.properties?.name;
  if (crs && !/CRS84|EPSG(?::|::|\/0\/)4326$/i.test(crs)) throw new Error('Reference geography uses an unsupported CRS.');
  if (!Array.isArray(collection.features) || !collection.features.length) throw new Error('Reference geography is empty.');
  for (const feature of collection.features) {
    if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) throw new Error('Reference geography must contain polygons.');
    visit(feature.geometry.coordinates);
  }
  if (!bounds.every(Number.isFinite)) throw new Error('Reference geography has no valid coordinates.');
  return bounds;
}

export class MapViewport {
  constructor(bounds = CITY_BOUNDS) { this.height = MAP_HEIGHT; this.fit(bounds); }
  fit(bounds) {
    const [west, south] = toMercator(bounds.slice(0, 2)), [east, north] = toMercator(bounds.slice(2));
    this.center = [(west + east) / 2, (south + north) / 2];
    this.width = Math.max((east - west) * MAP_WIDTH / (MAP_WIDTH - 40), (north - south) * MAP_WIDTH / (this.height - 40), 300);
  }

  get key() { return [...this.center, this.width, this.height].join(','); }
  get scale() { return MAP_WIDTH / this.width; }
  project(coordinates) {
    const [x, y] = toMercator(coordinates);
    return [MAP_WIDTH / 2 + (x - this.center[0]) * this.scale, this.height / 2 - (y - this.center[1]) * this.scale];
  }

  unproject(x, y) { return fromMercator([this.center[0] + (x - MAP_WIDTH / 2) / this.scale, this.center[1] - (y - this.height / 2) / this.scale]); }
  focus(coordinates) { this.center = toMercator(coordinates); this.constrainCenter(); }
  zoom(factor, coordinates) {
    if (coordinates) this.focus(coordinates);
    this.width = Math.min(100000, Math.max(300, this.width * factor));
  }

  pan(x, y) { this.center = [this.center[0] + x * this.width, this.center[1] + y * this.width * this.height / MAP_WIDTH]; this.constrainCenter(); }
  constrainCenter() {
    const [west, south] = toMercator(PHILADELPHIA_BOUNDS.slice(0, 2)), [east, north] = toMercator(PHILADELPHIA_BOUNDS.slice(2));
    this.center = [Math.max(west, Math.min(east, this.center[0])), Math.max(south, Math.min(north, this.center[1]))];
  }
}
