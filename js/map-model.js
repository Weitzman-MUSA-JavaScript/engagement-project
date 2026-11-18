// Screen-space grouping with a spatial grid: coincident points do not require
// pairwise comparisons. Adjacent cells merge conservatively to avoid overlap.
export function groupMapPins(pins, project, width, height = 440) {
  const size = 48 * 600 / Math.max(width, 1);
  const cells = new Map();
  let unplotted = 0, offscreen = 0, mapped = 0;
  pins.forEach((pin, index) => {
    if (!pin.geometry) { unplotted += 1; return; }
    const [x, y] = project(pin.geometry.coordinates);
    if (x < 0 || x > 600 || y < 0 || y > height) { offscreen += 1; return; }
    mapped += 1;
    const col = Math.floor(x / size), row = Math.floor(y / size), key = `${col}:${row}`;
    if (!cells.has(key)) cells.set(key, { key, col, row, members: [], parent: key, minX: x, maxX: x, minY: y, maxY: y });
    const cell = cells.get(key);
    cell.members.push({ pin, index, x, y });
    cell.minX = Math.min(cell.minX, x); cell.maxX = Math.max(cell.maxX, x);
    cell.minY = Math.min(cell.minY, y); cell.maxY = Math.max(cell.maxY, y);
  });
  const root = (cell) => { if (cell.parent !== cell.key) cell.parent = root(cells.get(cell.parent)).key; return cells.get(cell.parent); };
  for (const cell of cells.values()) {
    for (const [dc, dr] of [[1, -1], [1, 0], [1, 1], [0, 1]]) {
      const other = cells.get(`${cell.col + dc}:${cell.row + dr}`);
      if (!other) continue;
      const dx = Math.max(0, other.minX - cell.maxX, cell.minX - other.maxX);
      const dy = Math.max(0, other.minY - cell.maxY, cell.minY - other.maxY);
      if (Math.hypot(dx, dy) < size) root(other).parent = root(cell).key;
    }
  }
  const merged = new Map();
  for (const cell of cells.values()) {
    const key = root(cell).key;
    if (!merged.has(key)) merged.set(key, []);
    for (const member of cell.members) merged.get(key).push(member);
  }
  const groups = [...merged.values()].map((members) => ({ id: members[0].pin.id, members, x: members.reduce((sum, p) => sum + p.x, 0) / members.length, y: members.reduce((sum, p) => sum + p.y, 0) / members.length }));
  return { groups, mapped, offscreen, unplotted };
}
