export const CONFIG = Object.freeze({
  spawn: 220, maxDistance: 245, run: 85, burst: 130,
  acceleration: 900, deceleration: 700, ingestGrace: .18,
  beltSpeed: 70, tapImpulse: 28, tapDecay: .65, fatigueSeconds: 60,
});
export function escalatorSpeed() { return CONFIG.beltSpeed; }
export function effortEfficiency(seconds) { return 1 / (1 + Math.max(0, seconds) / CONFIG.fatigueSeconds); }

export class Game {
  constructor() { this.state = 'title'; this.reset(); }
  reset() {
    this.elapsed = 0; this.bonus = 0; this.d = CONFIG.spawn; this.velocity = 0;
    this.stamina = 100; this.burstLeft = 0; this.cooldown = 0; this.ingest = 0;
    this.lastEscape = -2; this.escapes = 0; this.bursts = 0; this.deathTime = 0;
    this.notice = ''; this.noticeLeft = 0; this.speed = CONFIG.beltSpeed;
    this.held = false; this.tapDrive = 0; this.efficiency = 1; this.fatigue = 0;
  }
  start() { this.reset(); this.state = 'playing'; }
  get score() { return this.elapsed + this.bonus; }
  get running() { return this.held || this.tapDrive > 5 || this.burstLeft > 0; }
  tap() { if (this.state === 'playing') this.tapDrive += CONFIG.tapImpulse; }
  burst() {
    if (this.state !== 'playing' || this.cooldown > 0 || this.stamina < 35) return false;
    this.burstLeft = .35; this.cooldown = 1.4; this.stamina -= 35; this.bursts++;
    this.notice = 'One last push!'; this.noticeLeft = .7; return true;
  }
  pause() {
    if (this.state === 'playing' || this.state === 'dying') {
      this.previousState = this.state; this.state = 'paused'; this.held = false;
    }
  }
  resume() { if (this.state === 'paused') this.state = this.previousState; }
  update(delta, held) {
    const dt = Math.min(Math.max(delta, 0), 1 / 30);
    if (this.state === 'dying') {
      this.deathTime += dt;
      if (this.deathTime >= 1.5) this.state = 'over';
      return;
    }
    if (this.state !== 'playing') return;
    this.held = held;
    this.elapsed += dt;
    this.efficiency = effortEfficiency(this.elapsed);
    this.fatigue = 1 - this.efficiency;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.noticeLeft = Math.max(0, this.noticeLeft - dt);
    // Each fresh press adds effort.
    this.tapDrive *= Math.exp(-dt / CONFIG.tapDecay);
    const effort = Math.max(held ? CONFIG.run : 0, this.tapDrive);
    const target = Math.max(effort, this.burstLeft > 0 ? CONFIG.burst : 0) * this.efficiency;
    this.burstLeft = Math.max(0, this.burstLeft - dt);
    const step = (target > this.velocity ? CONFIG.acceleration : CONFIG.deceleration) * dt;
    this.velocity += Math.max(-step, Math.min(step, target - this.velocity));
    this.d = Math.min(CONFIG.maxDistance, this.d + (this.velocity - this.speed) * dt);
    if (this.running && this.d < 100) this.stamina = Math.min(100, this.stamina + 4 * dt);
    if (this.d <= 0) {
      this.ingest += dt;
      if (this.ingest >= CONFIG.ingestGrace) { this.state = 'dying'; this.deathTime = 0; }
    } else {
      if (this.ingest >= .06 && this.ingest < CONFIG.ingestGrace && this.elapsed - this.lastEscape >= 2) {
        this.bonus += .3; this.escapes++; this.lastEscape = this.elapsed;
        this.notice = 'Too close. +0.3s'; this.noticeLeft = 1.2;
      }
      this.ingest = 0;
    }
  }
}
