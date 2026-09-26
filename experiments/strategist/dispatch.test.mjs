import test from 'node:test';
import assert from 'node:assert/strict';
import * as controls from './controls.mjs';
import {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../../addons/worker-behavior.mjs';

test('integer, early-return and XOR/mask dispatch preserve settings, extensions and STOP',()=>{
  for(const name of ['completeInteger32','completeEarly32','completeXor32','completeMasked32']){
    assert.equal(typeof controls[name],'function',name);
    const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
    const state=controls.prepareSearchBehavior32({g:{columns:4},actionOrder:Uint32Array.from([1,2,0,3]),cache:{sharedSampleBits:0}},new BehaviorWorker(0,words,0,memory));
    const handler=controls[name];
    assert.equal(handler(state,-1),-1);assert.equal(state.campaignChanges,0);
    const flags=controls.encodeControls({rotation:2,shareExponent:4});
    publishWorkerBehavior32(words,0,flags);
    assert.equal(handler(state,1),1);
    assert.deepEqual([...state.actionOrder],[0,3,1,2]);
    assert.equal(state.cache.sharedSampleBits,0x0f000000);assert.equal(state.campaignChanges,1);
    for(let i=0;i<20;i++)handler(state,0);
    assert.equal(state.campaignChanges,1,'persistent settings are not reapplied');
    publishWorkerBehavior32(words,0,controls.encodeControls({rotation:2,shareExponent:8}));
    handler(state,0);assert.equal(state.cache.sharedSampleBits,0xff000000);
    publishWorkerBehavior32(words,0,0,3,5,7);
    handler(state,0);assert.deepEqual([...state.actionOrder],[1,2,0,3]);assert.equal(state.cache.sharedSampleBits,0);
    // Inconsistent extension publication must defer even when primary is unchanged.
    Atomics.add(words,4,1);
    const changes=state.campaignChanges;
    assert.equal(handler(state,-1),-1);assert.equal(state.campaignChanges,changes);
    Atomics.add(words,4,1);
    publishWorkerBehavior32(words,0,1);
    assert.equal(handler(state,0),3);assert.equal(handler(state,-1),3);
  }
});
