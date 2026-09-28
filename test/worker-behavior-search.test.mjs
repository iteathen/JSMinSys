import test from 'node:test';
import assert from 'node:assert/strict';
import * as behavior from '../addons/worker-behavior.mjs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../addons/rba-connect4-alphabeta.mjs';
import {Worker} from 'node:worker_threads';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import {createConnect4RbaSharedExactCache32} from '../addons/rba-connect4-shared-exact-cache.mjs';
import {runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';

test('prepared behavior worker reads every publication including extended unsigned words',()=>{
  assert.equal(typeof behavior.createWorkerBehaviorMemory32,'function');
  const memory=behavior.createWorkerBehaviorMemory32(2),words=new Uint32Array(memory.buffer);
  const worker=new behavior.BehaviorWorker(0,words,1,memory);
  behavior.publishWorkerBehavior32(words,1,17);
  assert.equal(worker.loadPrimary(),17,'initialization must bind the worker address, not pass it at each node');
  for(const value of [1,7,0x7fffffff,0]){
    behavior.publishWorkerBehavior32(words,1,value);
    assert.equal(worker.readBehavior32(),value);
  }
  behavior.publishWorkerBehavior32(words,1,0x7fffffff,1,2,3);
  assert.equal(worker.readBehavior32(),0xffffffff);
  assert.deepEqual([...worker.behaviorExtensions],[0x80000001,0x80000002,3]);
  assert.throws(()=>behavior.createWorkerBehaviorMemory32(0),/count/);
  assert.throws(()=>behavior.createWorkerBehaviorMemory32(32769),/count/);
  assert.throws(()=>new behavior.BehaviorWorker(0,words,0,behavior.createWorkerBehaviorMemory32(1)),/same memory/);
});

test('real search worker observes strategist stop published after search has begun',{timeout:10000},async()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),root=connect4RbaFromMoves([],{geometry:g});
  const memory=behavior.createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
  const control=new Int32Array(new SharedArrayBuffer(20));control[4]=-1;
  const resultWords=new Int32Array(new SharedArrayBuffer(16)),metricBuffer=new SharedArrayBuffer(15*8);
  const sharedExactCache=createConnect4RbaSharedExactCache32({capacity:4096,keyWords:g.cacheKeyWords});
  const worker=new Worker(new URL('../addons/rba-connect4-lazy-smp-worker-behavior.mjs',import.meta.url),{
    workerData:{geometry:g,root,rootReflected:root.reflected,control,resultWords,metricBuffer,
      workerIndex:0,workerCount:1,behaviorMemory:memory,sharedExactCache,localCacheCapacity:4096,sharedSampleMask:0},
  });
  const exit=once(worker,'exit');
  try{
    let spins=0;
    while(Atomics.load(sharedExactCache.stats,1)<100&&spins++<2000)await delay(1);
    assert.ok(Atomics.load(sharedExactCache.stats,1)>=100,'search must have published exact rows before stop');
    behavior.publishWorkerBehavior32(words,0,1);
    assert.equal((await exit)[0],0);
    assert.equal(resultWords[3],-1);assert.equal(control[4],-1);
    assert.ok(new Float64Array(metricBuffer)[0]>0);
    assert.equal(control[2],103);
  }finally{await worker.terminate();}
});

test('Lazy SMP host selects optional per-node worker and returns interruption without WDL',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:4,rows:4});
  const behaviorMemory=behavior.createWorkerBehaviorMemory32(2),words=new Uint32Array(behaviorMemory.buffer);
  behavior.publishWorkerBehavior32(words,0,1);behavior.publishWorkerBehavior32(words,1,1);
  const result=await runLazySmpConnect4Rba32([],{geometry,workers:2,behaviorMemory,localCacheCapacity:4096,sharedCacheCapacity:4096,timeoutMs:5000});
  assert.equal(result.status,'INTERRUPTED');assert.equal(result.rootWdl,null);
  assert.equal(result.cleanup,true);assert.deepEqual(result.completedWorkers,[-1,-1]);
});

test('retiring one optional worker leaves the other worker able to solve',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:4,rows:4});
  const behaviorMemory=behavior.createWorkerBehaviorMemory32(2),words=new Uint32Array(behaviorMemory.buffer);
  behavior.publishWorkerBehavior32(words,0,1);
  const result=await runLazySmpConnect4Rba32([],{geometry,workers:2,behaviorMemory,localCacheCapacity:4096,sharedCacheCapacity:4096,timeoutMs:5000});
  assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,0);assert.equal(result.winner,1);
  assert.equal(result.cleanup,true);
});

test('mid-search cancellation preserves exact-cache semantics and a cleared flag permits a new solve',async()=>{
  const {prepareConnect4RbaAlphaBetaBehavior,solveConnect4RbaAlphaBetaBehavior}=await import('../addons/rba-connect4-alphabeta-behavior.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),root=connect4RbaFromMoves([],{geometry:g});
  for(const stopAt of [1,2,10,100,500]){
    const memory=behavior.createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
    const control=new behavior.BehaviorWorker(0,words,0,memory);
    const sharedExactCache=createConnect4RbaSharedExactCache32({capacity:4096,keyWords:g.cacheKeyWords});
    const state=prepareConnect4RbaAlphaBetaBehavior({geometry:g,cacheCapacity:4096,behavior:control,sharedExactCache});
    const load=state.behaviorLoad;let checks=0;
    state.behaviorLoad=offset=>{if(++checks===stopAt)behavior.publishWorkerBehavior32(words,0,1);return load(offset);};
    const cancelled=solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
    assert.equal(cancelled.status,'CANCELLED');assert.equal(cancelled.value,null);assert.equal(checks,stopAt);
    behavior.publishWorkerBehavior32(words,0,0);state.behaviorLoad=load;
    const resumed=solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
    assert.equal(resumed.status,'EXACT');assert.equal(resumed.value,2);
  }
});

test('optional search consumes stop at its first completed node and never returns WDL',async()=>{
  assert.equal(typeof behavior.createWorkerBehaviorMemory32,'function');
  const {prepareConnect4RbaAlphaBetaBehavior,solveConnect4RbaAlphaBetaBehavior}=await import('../addons/rba-connect4-alphabeta-behavior.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  const root=connect4RbaFromMoves([],{geometry:g});
  const memory=behavior.createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
  const control=new behavior.BehaviorWorker(0,words,0,memory);
  behavior.publishWorkerBehavior32(words,0,1);
  const state=prepareConnect4RbaAlphaBetaBehavior({geometry:g,cacheCapacity:4096,behavior:control});
  const load=state.behaviorLoad;let checks=0;
  state.behaviorLoad=offset=>{checks++;return load(offset);};
  const result=solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
  assert.equal(result.status,'CANCELLED');assert.equal(result.value,null);assert.equal(result.move,-1);
  assert.equal(checks,1);
});

test('zero-flags optional search preserves exact value, move and visited-node count',async()=>{
  assert.equal(typeof behavior.createWorkerBehaviorMemory32,'function');
  const {prepareConnect4RbaAlphaBetaBehavior,solveConnect4RbaAlphaBetaBehavior}=await import('../addons/rba-connect4-alphabeta-behavior.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),memory=behavior.createWorkerBehaviorMemory32(1);
  const control=new behavior.BehaviorWorker(0,new Uint32Array(memory.buffer),0,memory);
  for(const moves of [[],[0,1,0,1],[3,2,3,2],[0,1,0,1,0,1,0]]){
    const root=connect4RbaFromMoves(moves,{geometry:g});
    const expected=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:4096}),reflected:root.reflected});
    const state=prepareConnect4RbaAlphaBetaBehavior({geometry:g,cacheCapacity:4096,behavior:control});
    const load=state.behaviorLoad;let checks=0;
    state.behaviorLoad=offset=>{checks++;return load(offset);};
    const actual=solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
    assert.equal(actual.status,'EXACT');assert.equal(actual.value,expected.value);
    assert.equal(actual.move,expected.move);assert.equal(actual.metrics.nodes,expected.metrics.nodes);
    assert.equal(checks,state.cofactors+1,'one read per materialized child plus the root');
  }
});

test('standard 7x6 optional search preserves all baseline metrics and observes every completed q',async()=>{
  const {prepareConnect4RbaAlphaBetaBehavior,solveConnect4RbaAlphaBetaBehavior}=await import('../addons/rba-connect4-alphabeta-behavior.mjs');
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),memory=behavior.createWorkerBehaviorMemory32(1);
  const control=new behavior.BehaviorWorker(0,new Uint32Array(memory.buffer),0,memory);
  const fixtures=[
    [4,0,0,0,3,3,0,0,6,2,3,0,2,3,6,3,6,3,4,6,2,2,6,1,2,5,6,4],
    [2,0,5,3,6,3,5,2,3,3,3,5,0,5,0,0,1,6,1,4,3,4,2,6,6,0,6,4],
  ];
  for(const moves of fixtures){
    const root=connect4RbaFromMoves(moves,{geometry:g});
    const expected=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:4096}),reflected:root.reflected});
    const state=prepareConnect4RbaAlphaBetaBehavior({geometry:g,cacheCapacity:4096,behavior:control});
    const load=state.behaviorLoad;let checks=0;
    state.behaviorLoad=offset=>{checks++;return load(offset);};
    const actual=solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
    assert.equal(actual.status,'EXACT');assert.equal(actual.value,expected.value);assert.equal(actual.move,expected.move);
    assert.deepEqual(actual.metrics,expected.metrics);assert.equal(checks,state.cofactors+1);
  }
});

test('in-flight extended publication defers then applies STOP at the next coherent node boundary',async()=>{
  const {prepareConnect4RbaAlphaBetaBehavior,solveConnect4RbaAlphaBetaBehavior}=await import('../addons/rba-connect4-alphabeta-behavior.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),root=connect4RbaFromMoves([],{geometry:g});
  const memory=behavior.createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
  const control=new behavior.BehaviorWorker(0,words,0,memory);
  behavior.publishWorkerBehavior32(words,0,1,2);Atomics.store(words,4,3);
  const state=prepareConnect4RbaAlphaBetaBehavior({geometry:g,cacheCapacity:4096,behavior:control});
  const load=state.behaviorLoad;let checks=0;
  state.behaviorLoad=offset=>{if(++checks===3)Atomics.store(words,4,4);return load(offset);};
  const result=solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
  assert.equal(result.status,'CANCELLED');assert.equal(checks,3);assert.equal(control.behaviorExtensions[0],2);
});
