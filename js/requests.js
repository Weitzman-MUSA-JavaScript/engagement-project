// One scope per independently replaceable read. Navigation cancels obsolete work;
// the ticket check also protects against transports that finish after cancellation.
export class LatestRequest {
  #ticket = 0;
  #controller;
  #pendingChanged;
  constructor(pendingChanged = () => {}) { this.#pendingChanged = pendingChanged; }
  cancel() { this.#ticket += 1; this.#controller?.abort(); this.#controller = undefined; this.#pendingChanged(false); }
  async run(read, commit, reject = () => {}) {
    this.cancel();
    const ticket = this.#ticket;
    this.#controller = new AbortController();
    this.#pendingChanged(true);
    const current = () => ticket === this.#ticket;
    try {
      const result = await read(this.#controller.signal);
      if (!current()) return false;
      commit(result);
      return true;
    } catch (error) {
      if (!current() || error.name === 'AbortError') return false;
      reject(error);
      return false;
    } finally { if (current()) { this.#controller = undefined; this.#pendingChanged(false); } }
  }
}
