import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { bindInput } from './input.js';
import { GameAudio } from './audio.js';
import { readBest, writeBest, resetBest } from './storage.js';
const $ = id => document.getElementById(id);
const game = new Game(), renderer = new Renderer($('game')), audio = new GameAudio();
let best = readBest(), previous = 'title', last = performance.now(), newRecord = false;
const comments = ['The machine did not wait.', 'So close to another second.', 'The escalator wins this round.', 'Plenty of willpower. Not enough grip.', 'That was not a good time for a break.', 'The legs never gave up.', 'It looked possible from up there.'];
function press() {
  audio.unlock();
  if (game.state === 'title' || game.state === 'over') { game.start(); newRecord = false; }
  else if (game.state === 'paused') game.resume();
}
function pause() { if (game.state === 'paused') game.resume(); else game.pause(); input.clear(); }
const input = bindInput($('board'), { press, tap: () => game.tap(), burst: () => { if (game.burst()) audio.effect('burst'); }, pause, blur: () => game.pause() });
$('play').addEventListener('click', press);
$('pause').addEventListener('click', pause);
$('sound').addEventListener('click', () => {
  const enabled = audio.toggle();
  $('sound').setAttribute('aria-pressed', String(enabled));
  $('sound').setAttribute('aria-label', enabled ? 'Mute sound' : 'Enable sound');
  $('sound').title = enabled ? 'Mute sound' : 'Enable sound';
  $('mute-mark').hidden = enabled;
});
$('reset').addEventListener('click', () => { resetBest(); best = 0; $('announcement').textContent = 'Personal best cleared.'; });
function showPanel(label, title, copy, button, hint) {
  $('panel-label').textContent = label; $('panel-title').textContent = title; $('panel-copy').textContent = copy;
  $('play').replaceChildren(document.createTextNode(button), Object.assign(document.createElement('span'), { textContent: '↗' }));
  $('panel-hint').textContent = hint;
}
function ui() {
  const state = game.state;
  $('board').dataset.state = state;
  if (state !== previous) {
    if (state === 'dying') { newRecord = game.score > best; if (newRecord) { best = game.score; writeBest(best); } audio.effect('death'); }
    if (state === 'over') {
      showPanel(newRecord ? 'NEW PERSONAL BEST' : 'END OF THE LINE', 'That was a good run.', comments[Math.floor(Math.random() * comments.length)], 'Try again', 'Tap anywhere or press Space to restart.');
      $('result-score').replaceChildren(document.createTextNode(game.score.toFixed(1)), Object.assign(document.createElement('span'), { textContent: 's' }));
      $('announcement').textContent = `Survived ${game.score.toFixed(1)} seconds. Personal best: ${best.toFixed(1)} seconds. Try again.`;
    }
    if (state === 'paused') {
      showPanel('PAUSED', 'Catch your breath.', 'Even the machine can wait a moment.', 'Keep running', 'Tap or press Space to resume.');
      $('announcement').textContent = 'Game paused.';
    }
    previous = state;
  }
  $('score').innerHTML = game.score.toFixed(1) + '<span>s</span>';
  $('best').innerHTML = best.toFixed(1) + '<span>s</span>';
  $('overlay').hidden = !['title', 'paused', 'over'].includes(state); $('result-score').hidden = state !== 'over';
  $('pause').hidden = !['playing', 'paused', 'dying'].includes(state); $('pause').textContent = state === 'paused' ? '▶' : 'Ⅱ';
  $('pause').setAttribute('aria-label', state === 'paused' ? 'Resume game' : 'Pause game');
  $('pause').title = state === 'paused' ? 'Resume (P)' : 'Pause (P)';
  const fatigueHint = game.elapsed >= 12 && game.elapsed < 18;
  $('run-hint').hidden = state !== 'playing' || (game.elapsed > 4 && !fatigueHint);
  $('run-hint').textContent = fatigueHint ? 'Getting tired. Tap faster to keep up.' : input.held ? 'Keep holding. Tap faster when you tire.' : 'Hold the screen or Space to run.';
  $('stamina').hidden = state !== 'playing';
  [...$('stamina').children].forEach((dot, i) => dot.style.opacity = game.stamina >= (i + 1) * 33 ? 1 : .2);
  $('reset').hidden = state !== 'title' && state !== 'over';
}
function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
  game.update(dt, input.held); renderer.draw(game, dt); audio.update(game); ui(); requestAnimationFrame(frame);
}
ui(); requestAnimationFrame(frame);
