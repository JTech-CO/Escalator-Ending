const KEY = 'escalator-ending-best';
export function readBest(storage) { try { const value = Number((storage ?? globalThis.localStorage).getItem(KEY)); return Number.isFinite(value) && value > 0 ? value : 0; } catch { return 0; } }
export function writeBest(value) { try { localStorage.setItem(KEY, value.toFixed(1)); } catch { /* Storage is optional. */ } }
export function resetBest() { try { localStorage.removeItem(KEY); } catch { /* Storage is optional. */ } }
