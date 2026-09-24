export class GameAudio {
  constructor(createContext = () => new (globalThis.AudioContext || globalThis.webkitAudioContext)()) {
    this.createContext = createContext;
    this.enabled = false; this.ctx = null; this.pending = null;
    this.error = false; this.lastStep = 0;
  }
  get ready() { return this.enabled && !this.error && this.ctx?.state === 'running'; }
  create() {
    const ctx = this.createContext();
    try {
      const master = ctx.createGain(), gain = ctx.createGain(), drone = ctx.createOscillator();
      master.gain.value = 0; gain.gain.value = 0;
      master.connect(ctx.destination); gain.connect(master); drone.connect(gain);
      drone.type = 'triangle'; drone.frequency.value = 135; drone.start();
      this.ctx = ctx; this.master = master; this.gain = gain; this.drone = drone;
    } catch (error) { void ctx.close().catch(() => {}); throw error; }
  }
  unlock() {
    if (!this.enabled) return Promise.resolve(false);
    if (this.pending) return this.pending;
    this.error = false;
    try {
      if (!this.ctx || this.ctx.state === 'closed') this.create();
      const ctx = this.ctx;
      // Resume inside the input gesture, including interrupted mobile contexts.
      const resume = ctx.state === 'running' ? Promise.resolve() : ctx.resume();
      this.pending = Promise.resolve(resume).then(() => {
        if (this.ctx !== ctx) return false;
        this.master.gain.setTargetAtTime(this.ready ? .8 : 0, ctx.currentTime, .015);
        return this.ready;
      }).catch(() => { this.error = true; return false; }).finally(() => { this.pending = null; });
      return this.pending;
    } catch { this.error = true; return Promise.resolve(false); }
  }
  toggle() {
    if (this.enabled && (this.ready || this.pending)) {
      this.enabled = false;
      if (this.ctx?.state !== 'closed' && this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, .015);
      return Promise.resolve(false);
    }
    this.enabled = true;
    return this.unlock().then(ready => { if (ready) this.effect('confirm'); return ready; });
  }
  effect(kind) {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    const confirm = kind === 'confirm';
    o.type = kind === 'burst' ? 'sawtooth' : 'sine';
    o.frequency.setValueAtTime(confirm ? 660 : kind === 'burst' ? 240 : kind === 'death' ? 95 : 180, t);
    o.frequency.exponentialRampToValueAtTime(confirm ? 880 : 60, t + .13);
    g.gain.setValueAtTime(.001, t);
    g.gain.exponentialRampToValueAtTime(confirm ? .07 : .04, t + .008);
    g.gain.exponentialRampToValueAtTime(.001, t + .16);
    o.connect(g).connect(this.master);
    o.onended = () => { o.disconnect(); g.disconnect(); };
    o.start(t); o.stop(t + .18);
  }
  update(game) {
    if (!this.ctx || this.ctx.state === 'closed') return;
    const c = this.ctx;
    this.master.gain.setTargetAtTime(this.ready ? .8 : 0, c.currentTime, .015);
    if (!this.ready) return;
    const active = game.state === 'playing' || game.state === 'dying';
    const volume = active ? (game.state === 'dying' ? .07 : .025 + Math.max(0, 1 - game.d / 100) * .02) : game.state === 'title' ? .015 : 0;
    this.gain.gain.setTargetAtTime(volume, c.currentTime, .08);
    this.drone.frequency.setTargetAtTime(110 + game.speed * .35, c.currentTime, .1);
    if (game.elapsed < this.lastStep) this.lastStep = 0;
    if (active && game.running && game.elapsed - this.lastStep > .14) { this.lastStep = game.elapsed; this.effect('step'); }
  }
}
