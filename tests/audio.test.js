import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio } from '../src/audio.js';
class Param {
  value=0;
  setValueAtTime(v){this.value=v;}
  setTargetAtTime(v){this.value=v;}
  exponentialRampToValueAtTime(v){this.value=v;}
}
class Node {
  gain=new Param();frequency=new Param();
  connect(target){this.target=target;return target;}
  disconnect(){}
  start(){}
  stop(){}
}
class Context {
  state='suspended';currentTime=0;destination={};oscillators=[];resumes=0;
  createGain(){return new Node();}
  createOscillator(){const node=new Node();this.oscillators.push(node);return node;}
  async resume(){this.resumes++;this.state='running';}
  async close(){this.state='closed';}
}
test('sound waits for resume and gives audible confirmation even on title',async()=>{
  const ctx=new Context(),audio=new GameAudio(()=>ctx);
  assert.equal(audio.ready,false);assert.equal(await audio.toggle(),true);
  assert.equal(ctx.resumes,1);assert.equal(audio.ready,true);assert.equal(ctx.oscillators.length,2);
  assert.equal(ctx.oscillators[1].target.target,audio.master);
  audio.update({state:'title',speed:70,elapsed:0,d:220});assert.ok(audio.gain.gain.value>0);
});
test('resume failure stays unready and can be retried',async()=>{
  const ctx=new Context(),audio=new GameAudio(()=>ctx);
  ctx.resume=async()=>{throw Error('blocked');};
  assert.equal(await audio.toggle(),false);assert.equal(audio.ready,false);assert.equal(audio.pending,null);
  assert.equal(ctx.oscillators.length,1);
  ctx.resume=async()=>{ctx.state='running';};
  assert.equal(await audio.toggle(),true);assert.equal(audio.ready,true);
});
test('interrupted sound resumes on the next user gesture',async()=>{
  const ctx=new Context(),audio=new GameAudio(()=>ctx);await audio.toggle();
  ctx.state='interrupted';assert.equal(audio.ready,false);
  assert.equal(await audio.unlock(),true);assert.equal(ctx.resumes,2);
});
test('muting while resume is pending cannot enable sound later',async()=>{
  const ctx=new Context(),audio=new GameAudio(()=>ctx);let finish;
  ctx.resume=()=>new Promise(resolve=>{finish=()=>{ctx.state='running';resolve();};});
  const opening=audio.toggle();await audio.toggle();finish();
  assert.equal(await opening,false);assert.equal(audio.ready,false);
  assert.equal(audio.master.gain.value,0);assert.equal(ctx.oscillators.length,1);
});
test('closed context is recreated, all effects use the mute gain',async()=>{
  const contexts=[],audio=new GameAudio(()=>{const ctx=new Context();contexts.push(ctx);return ctx;});
  await audio.toggle();contexts[0].state='closed';assert.equal(await audio.unlock(),true);
  assert.equal(contexts.length,2);audio.effect('burst');
  assert.equal(contexts[1].oscillators.at(-1).target.target,audio.master);
  await audio.toggle();assert.equal(audio.master.gain.value,0);
  const count=contexts[1].oscillators.length;audio.effect('step');assert.equal(contexts[1].oscillators.length,count);
});
test('unavailable audio does not throw or stop game updates',async()=>{
  const audio=new GameAudio(()=>{throw Error('unsupported');});
  assert.equal(await audio.toggle(),false);assert.equal(audio.ready,false);
  assert.doesNotThrow(()=>audio.update({state:'playing'}));
});
