import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../addons/rba-connect4-alphabeta.mjs';
import {prepareConnect4RbaFrontier,solveConnect4RbaFrontier} from '../addons/rba-connect4-frontier.mjs';
import {encodeRootFrontier32} from '../addons/worker-root-frontier.mjs';
import {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../addons/worker-behavior.mjs';
import {runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';

function prepared(g,release=false){
  const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
  publishWorkerBehavior32(words,0,encodeRootFrontier32({stride:2,target:1,release}));
  const state=prepareConnect4RbaFrontier({geometry:g,cacheCapacity:65536,behavior:new BehaviorWorker(0,words,0,memory)});
  return {state,words};
}

test('native frontier closes the same root WDL across configured geometry and reflection',()=>{
  for(const [columns,rows,sequences] of [[4,4,['0011','01230123','010122']],
    [7,6,['1320461024522311','2053635233350500','0011223']]]){
    const g=prepareConnect4RbaGeometry({columns,rows}),reference=prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:65536});
    for(const sequence of sequences)for(const mirror of [false,true]){
      const moves=[...sequence].map(Number).map(c=>mirror?columns-1-c:c),root=connect4RbaFromMoves(moves,{geometry:g});
      const expected=solveConnect4RbaAlphaBeta(root,{state:reference,reflected:root.reflected});
      for(const release of [false,true]){
        const {state}=prepared(g,release),actual=solveConnect4RbaFrontier(root,{state,reflected:root.reflected});
        assert.equal(actual.status,'EXACT');assert.equal(actual.value,expected.value);assert.equal(actual.move,expected.move);
        assert.equal(actual.metrics.nodes,state.nodeCounts[0]);
        if(release)assert.equal(actual.metrics.horizonStops,0);
      }
    }
  }
});

test('incomplete frontier cancellation publishes no WDL and reused state can solve',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),root=connect4RbaFromMoves([0,0,1,1],{geometry:g}),{state,words}=prepared(g);
  const load=state.behaviorLoad;let reads=0;
  state.behaviorLoad=()=>{if(++reads===30)publishWorkerBehavior32(words,0,1);return load();};
  const stopped=solveConnect4RbaFrontier(root,{state,reflected:root.reflected});
  assert.equal(stopped.status,'CANCELLED');assert.equal(stopped.value,null);
  state.behaviorLoad=load;publishWorkerBehavior32(words,0,encodeRootFrontier32({stride:2,target:1}));
  assert.equal(solveConnect4RbaFrontier(root,{state,reflected:root.reflected}).value,2);
});

test('direct Lazy SMP frontier host preserves exact closure, counters and timeout cleanup',async()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  const r=await runLazySmpConnect4Rba32([... '1320461024522311'].map(Number),{geometry:g,workers:7,rootFrontier:true,sharedCacheCapacity:65536,localCacheCapacity:65536,timeoutMs:5000});
  assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,-1);assert.equal(r.workersExited,7);assert.equal(r.cleanup,true);
  assert.equal(r.nodeCounts.length,7);assert.ok(r.nodeCounts.reduce((a,b)=>a+b,0)>=r.winnerMetrics.nodes);
  assert.ok(r.frontierMetrics.slice(1).every(m=>m[1]===0));
  const timeout=await runLazySmpConnect4Rba32([],{geometry:g,workers:2,rootFrontier:true,sharedCacheCapacity:4096,localCacheCapacity:4096,timeoutMs:250});
  assert.equal(timeout.status,'TIMEOUT');assert.equal(timeout.rootWdl,null);assert.equal(timeout.cleanup,true);assert.equal(timeout.workersExited,2);
});
