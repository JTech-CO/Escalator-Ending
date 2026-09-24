import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, escalatorSpeed, effortEfficiency } from '../src/game.js';
import { readBest } from '../src/storage.js';
const advance=(g,seconds,held)=>{for(let i=0;i<Math.ceil(seconds*120);i++)g.update(1/120,held);};
test('no input inevitably dies and reaches results after the animation',()=>{const g=new Game();g.start();advance(g,3.4,false);assert.equal(g.state,'dying');advance(g,1.5,false);assert.equal(g.state,'over');});
test('holding survives longer, but fatigue eventually loses ground',()=>{const g=new Game();g.start();advance(g,20,true);assert.equal(g.state,'playing');advance(g,40,true);assert.equal(g.state,'over');assert.ok(g.score>20&&g.score<45);});
test('burst spends stamina, respects cooldown, and permits running when exhausted',()=>{const g=new Game();g.start();assert.equal(g.burst(),true);assert.equal(g.stamina,65);assert.equal(g.burst(),false);advance(g,1.5,true);assert.equal(g.burst(),true);assert.equal(g.stamina,30);advance(g,1.5,true);assert.equal(g.burst(),false);assert.ok(g.velocity>0&&g.velocity<85);});
test('ingestion has a grace period, and a narrow escape awards only one bonus',()=>{const g=new Game();g.start();g.d=-1;g.velocity=70;advance(g,.08,true);assert.equal(g.state,'playing');g.d=1;g.update(1/120,true);assert.equal(g.bonus,.3);g.d=-1;g.velocity=70;advance(g,.08,true);g.d=1;g.update(1/120,true);assert.equal(g.bonus,.3);});
test('pause freezes physics and score, including the death animation',()=>{const g=new Game();g.start();advance(g,1,true);g.pause();const d=g.d,t=g.score;advance(g,30,false);assert.equal(g.d,d);assert.equal(g.score,t);g.resume();assert.equal(g.state,'playing');g.state='dying';g.pause();advance(g,2,false);assert.equal(g.deathTime,0);g.resume();assert.equal(g.state,'dying');});
test('restart clears every per-run resource',()=>{const g=new Game();g.start();g.burst();advance(g,35,false);g.start();assert.equal(g.state,'playing');assert.equal(g.score,0);assert.equal(g.stamina,100);assert.equal(g.bursts,0);assert.equal(g.d,220);});
test('long frame is clamped and the belt stays constant',()=>{const g=new Game();g.start();g.update(20,false);assert.equal(g.elapsed,1/30);assert.deepEqual([0,4,10,18,28,100].map(escalatorSpeed),[70,70,70,70,70,70]);});
test('invalid or inaccessible storage does not break the game',()=>{for(const v of ['oops','Infinity','-5',null])assert.equal(readBest({getItem:()=>v}),0);assert.equal(readBest({getItem:()=>{throw Error();}}),0);assert.equal(readBest({getItem:()=> '12.4'}),12.4);});

test('the same effort gets weaker, while proportionally faster taps compensate',()=>{
  assert.equal(effortEfficiency(0),1);
  assert.equal(effortEfficiency(30),2/3);
  assert.equal(15*effortEfficiency(30),10*effortEfficiency(0));
  const sample=(elapsed,rate)=>{
    const g=new Game();g.start();g.elapsed=elapsed;g.d=245;let next=0,total=0,count=0;
    for(let i=0;i<600;i++){
      if(i/120>=next){g.tap();next+=1/rate;}
      g.update(1/120,false);
      if(i>240){total+=g.velocity;count++;}
    }
    return total/count;
  };
  const fresh=sample(0,10),tired=sample(30,10),compensated=sample(30,15);
  assert.ok(tired<fresh*.75);
  assert.ok(Math.abs(compensated-fresh)/fresh<.07);
});
test('faster actual tapping sustains a run beyond 30 seconds without holding',()=>{
  const g=new Game();g.start();
  for(let i=0;i<120*60;i++){if(i%12===0)g.tap();g.update(1/120,false);}
  assert.equal(g.state,'playing');assert.ok(g.elapsed>59);assert.ok(g.d>0);
});
test('increasing input effort survives three minutes with no deadline',()=>{
  const g=new Game();g.start();let taps=0;
  for(let i=0;i<120*180;i++){
    taps+=(6/effortEfficiency(g.elapsed))/120;
    while(taps>=1){g.tap();taps--;}
    g.update(1/120,false);
  }
  assert.equal(g.state,'playing');assert.ok(g.elapsed>179);assert.ok(g.fatigue>.7);
});
test('pause freezes fatigue and tap momentum, restart clears both',()=>{
  const g=new Game();g.start();g.tap();advance(g,1,true);g.pause();
  const values=[g.fatigue,g.tapDrive,g.elapsed];g.tap();advance(g,20,false);
  assert.deepEqual([g.fatigue,g.tapDrive,g.elapsed],values);
  g.start();assert.equal(g.fatigue,0);assert.equal(g.tapDrive,0);
});
