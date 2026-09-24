import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceScroll, STEP_SPACING } from '../src/motion.js';

test('belt pattern wraps seamlessly across every boundary for two minutes',()=>{
  let phase=0;const speed=70,dt=1/60;
  for(let i=0;i<60*120;i++){
    const next=advanceScroll(phase,speed,dt);
    const moved=(next-phase+STEP_SPACING)%STEP_SPACING;
    assert.ok(Math.abs(moved-speed*dt)<1e-10);
    phase=next;
  }
});
test('scroll matches the unwrapped distance around the former 1000px reset',()=>{
  for(const distance of [999,1000,1001,1999,2000,2001]){
    assert.ok(Math.abs(advanceScroll(0,70,distance/70)-(distance%105))<1e-10);
  }
});
