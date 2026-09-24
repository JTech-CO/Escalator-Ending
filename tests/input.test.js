import test from 'node:test';
import assert from 'node:assert/strict';
import { bindInput } from '../src/input.js';
import { Game } from '../src/game.js';
class Surface {
  handlers = new Map();
  addEventListener(type, handler) { this.handlers.set(type, handler); }
  dispatch(type, extra = {}) {
    this.handlers.get(type)?.({ preventDefault() {}, target: { closest: () => null }, ...extra });
  }
  focus() {}
  setPointerCapture() {}
}
test('real key and pointer presses add effort, repeat does not, blur releases input',()=>{
  const originalWindow=globalThis.window,originalDocument=globalThis.document;
  const window=new Surface(),document=new Surface(),board=new Surface();
  globalThis.window=window;globalThis.document=document;
  try {
    const game=new Game();game.start();
    const input=bindInput(board,{press(){},tap:()=>game.tap(),burst(){},pause(){},blur:()=>game.pause()});
    window.dispatch('keydown',{code:'Space',repeat:false});
    assert.equal(input.held,true);assert.equal(game.tapDrive,28);
    window.dispatch('keydown',{code:'Space',repeat:true});
    assert.equal(game.tapDrive,28);
    window.dispatch('keyup',{code:'Space'});
    window.dispatch('keydown',{code:'Space',repeat:false});
    assert.equal(game.tapDrive,56);
    window.dispatch('keyup',{code:'Space'});
    board.dispatch('pointerdown',{pointerType:'touch',pointerId:1});
    assert.equal(game.tapDrive,84);assert.equal(input.held,true);
    board.dispatch('pointercancel',{pointerId:1});assert.equal(input.held,false);
    board.dispatch('pointerdown',{pointerType:'mouse',button:0,pointerId:2});
    assert.equal(game.tapDrive,112);
    window.dispatch('blur');assert.equal(input.held,false);assert.equal(game.state,'paused');
  } finally {
    if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;
    if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;
  }
});

test('burst counts mixed inputs within 160ms, not held-key auto-repeat',t=>{
  const originalWindow=globalThis.window,originalDocument=globalThis.document;
  const window=new Surface(),document=new Surface(),board=new Surface();
  globalThis.window=window;globalThis.document=document;
  let now=0,attempts=0;
  t.mock.method(performance,'now',()=>now);
  try {
    const game=new Game();game.start();
    const input=bindInput(board,{press(){},tap:()=>game.tap(),burst(){attempts++;game.burst();},pause(){},blur(){}});
    const key=(time)=>{now=time;window.dispatch('keydown',{code:'Space',repeat:false});window.dispatch('keyup',{code:'Space'});};
    const click=(time)=>{now=time;board.dispatch('pointerdown',{pointerType:'mouse',button:0,pointerId:1});board.dispatch('pointerup',{pointerId:1});};
    click(0);key(80);key(160);
    assert.equal(attempts,1);assert.equal(game.bursts,1);assert.equal(game.notice,'One last push!');
    assert.equal(game.burstLeft,.35);assert.equal(game.stamina,65);assert.equal(game.cooldown,1.4);
    key(180);key(200);key(220);
    assert.equal(attempts,2);assert.equal(game.bursts,1);
    input.clear();key(1000);key(1080);key(1161);
    assert.equal(attempts,2);
    input.clear();now=2000;window.dispatch('keydown',{code:'Space',repeat:false});
    for(let i=0;i<5;i++){now+=20;window.dispatch('keydown',{code:'Space',repeat:true});}
    assert.equal(attempts,2);
  } finally {
    if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;
    if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;
  }
});
