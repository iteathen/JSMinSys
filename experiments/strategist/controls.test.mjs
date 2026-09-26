import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../../addons/rba-connect4-alphabeta.mjs';
import {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../../addons/worker-behavior.mjs';

test('campaign zero controls preserve baseline and changing controls preserve WDL',async()=>{
  const {encodeControls}=await import('./controls.mjs');
  const {prepareConnect4RbaAlphaBetaBehavior:prepare,solveConnect4RbaAlphaBetaBehavior:solve}=await import('./search.generated.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  for(const moves of [[],[1],[1,2],[0,1,0,2],[3,2,3,1]]){
    const root=connect4RbaFromMoves(moves,{geometry:g});
    const expected=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:1024}),reflected:root.reflected});
    for(const changing of [false,true]){
      const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
      const state=prepare({geometry:g,cacheCapacity:1024,behavior:new BehaviorWorker(0,words,0,memory)});
      const load=state.behaviorLoad;let reads=0;
      state.behaviorLoad=()=>{
        if(changing&&++reads%17===0)publishWorkerBehavior32(words,0,encodeControls({rotation:reads%4,shareExponent:reads%9}));
        return load();
      };
      const got=solve(root,{state,reflected:root.reflected});
      assert.equal(got.value,expected.value);assert.equal(got.status,'EXACT');
      if(!changing){assert.equal(got.move,expected.move);assert.deepEqual(got.metrics,expected.metrics);}
      else assert.ok(state.campaignChanges>1);
    }
  }
});

test('control encoding validates cold and STOP overrides preferences',async()=>{
  const {encodeControls}=await import('./controls.mjs');
  assert.throws(()=>encodeControls({rotation:32}),/rotation/);
  assert.throws(()=>encodeControls({shareExponent:9}),/sampling/);
  const {prepareConnect4RbaAlphaBetaBehavior:prepare,solveConnect4RbaAlphaBetaBehavior:solve}=await import('./search.generated.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),root=connect4RbaFromMoves([],{geometry:g});
  const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
  publishWorkerBehavior32(words,0,encodeControls({rotation:3,shareExponent:4})|1);
  const state=prepare({geometry:g,behavior:new BehaviorWorker(0,words,0,memory)});
  const got=solve(root,{state,reflected:root.reflected});
  assert.equal(got.status,'CANCELLED');assert.equal(got.value,null);
});
