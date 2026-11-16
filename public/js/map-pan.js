export class MapPan {
  constructor(view) { this.view = view; this.gesture = null; }

  start(pointer, client, point) {
    this.gesture = { pointer, client, point, center: [...this.view.center], scale: this.view.scale, moved: false };
  }

  update(pointer, client, point) {
    const g = this.gesture;
    if (!g || g.pointer !== pointer) return false;
    if (!g.moved && Math.hypot(client[0] - g.client[0], client[1] - g.client[1]) < 5) return false;
    g.moved = true;
    this.view.center = [g.center[0] - (point[0] - g.point[0]) / g.scale, g.center[1] + (point[1] - g.point[1]) / g.scale];
    this.view.constrainCenter();
    return true;
  }

  end(pointer) {
    if (this.gesture?.pointer !== pointer) return null;
    const result = this.gesture;
    this.gesture = null;
    return result;
  }
}
