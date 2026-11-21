import { MAP_WIDTH, MAP_HEIGHT } from './geography.js';

const WORLD = 2 * Math.PI * 6378137;

export function visibleTiles(view, basemap = 'street', pixels = 600) {
  const zoom = Math.max(0, Math.min(19, Math.round(Math.log2(WORLD * view.scale * pixels / 600 / 256))));
  const count = 2 ** zoom, span = WORLD / count;
  const left = view.center[0] - view.width / 2;
  const top = view.center[1] + view.width * (view.height ?? MAP_HEIGHT) / MAP_WIDTH / 2;
  const right = left + view.width, bottom = top - view.width * (view.height ?? MAP_HEIGHT) / MAP_WIDTH;
  const tiles = [];
  for (let x = Math.max(0, Math.floor((left + WORLD / 2) / span)); x <= Math.min(count - 1, Math.floor((right + WORLD / 2) / span)); x++) {
    for (let y = Math.max(0, Math.floor((WORLD / 2 - top) / span)); y <= Math.min(count - 1, Math.floor((WORLD / 2 - bottom) / span)); y++) {
      tiles.push({ key: `${zoom}/${x}/${y}`, url: basemap === 'aerial' ? `https://imagery.pasda.psu.edu/arcgis/rest/services/PEMAImagery2021_2023cache/MapServer/tile/${zoom}/${y}/${x}` : `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`, x: (x * span - WORLD / 2 - left) * view.scale, y: (top - (WORLD / 2 - y * span)) * view.scale, width: span * view.scale, height: span * view.scale });
    }
  }
  return tiles;
}
