import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../addons/worker-behavior.mjs';
import {encodeRootFrontier32} from '../addons/worker-root-frontier.mjs';
import * as baseline from '../addons/rba-connect4-frontier.mjs';
import * as oldCpc from '../addons/cpc-connect4.mjs';
import * as oldTT from '../addons/rba-connect4-shared-exact-cache.mjs';
import * as lean from '../experiments/isomax-lean/solver.mjs';
import * as cpc from '../experiments/isomax-lean/cpc.mjs';
import * as tt from '../experiments/isomax-lean/shared-cache.mjs';
import {runLazySmpConnect4Rba32} from '../experiments/isomax-lean/host.mjs';

const g=prepareConnect4RbaGeometry({columns:7,rows:6});
const sequences=['1320461024522311','2053635233350500','0011223'];
function prepare(api,offset=0){
  const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
  publishWorkerBehavior32(words,0,encodeRootFrontier32({release:true}));
  const shared=(api===baseline?oldTT:tt).createConnect4RbaSharedExactCache32({capacity:4096,keyWords:g.keyWords,geometry:g});
  return {words,state:api.prepareConnect4RbaFrontier({geometry:g,cacheCapacity:4096,
    sharedExactCache:shared,orderOffset:offset,behavior:new BehaviorWorker(0,words,0,memory)})};
}
test('lean recursive path has no reporting, frontier or fixed configuration branches',()=>{
  const src=readFileSync(new URL('../experiments/isomax-lean/solver.mjs',import.meta.url),'utf8');
  const recursive=src.slice(src.indexOf('function searchCpcOnlyFrontier'),src.indexOf('export function solveConnect4RbaFrontier')).replace(/\/\/[^\n]*/g,'');
  assert.doesNotMatch(recursive,/nodeCounts|cacheHits|cutoffs|cofactors|horizon|frontier|unfinished|performance|Date\.|console\./);
  assert.doesNotMatch(recursive,/if\(movePackShift|live\.wordCount===|cache\.compact8|sharedSampleBits/);
  const cache=readFileSync(new URL('../experiments/isomax-lean/shared-cache.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(cache,/Atomics\.add|cache\.stats|knownHash===undefined|if\(cache\.compact8\)/);
  const cpcSrc=readFileSync(new URL('../experiments/isomax-lean/cpc.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(cpcSrc,/scratch\.(forcedTotal|precursorTotal|projectedForkTotal)|if\(scratch\.projectedAdvisory\)|=scratch\.frontierResponse/);
});
test('full-window deep result and tie-breaking match released baseline for every worker order and reflection',()=>{
  for(let order=0;order<4;order++){
    const a=prepare(baseline,order).state,b=prepare(lean,order).state;
    for(const sequence of sequences)for(const mirror of [false,true]){
      const moves=[...sequence].map(Number).map(c=>mirror?6-c:c);
      const root=connect4RbaFromMoves(moves,{geometry:g});
      const expected=baseline.solveConnect4RbaFrontier(root,{state:a,reflected:root.reflected});
      const actual=lean.solveConnect4RbaFrontier(root,{state:b,reflected:root.reflected});
      assert.deepEqual([actual.status,actual.value,actual.relative,actual.move],
        [expected.status,expected.value,expected.relative,expected.move]);
      assert.equal(actual.metrics,null);
      // Single-thread deterministic traversal must leave identical TT contents,
      // including weak-bound tags, replacements and exact shared publications.
      for(const field of ['keys','tag'])assert.deepEqual(b.cache[field],a.cache[field]);
      for(const field of ['keys','sequence','value'])assert.deepEqual(b.cache.shared[field],a.cache.shared[field]);
    }
  }
});
test('CPC retains exact intervals, forced moves and restriction masks on deterministic legal walks',()=>{
  const a=oldCpc.prepareConnect4CpcScratch(g),b=cpc.prepareConnect4CpcScratch(g);
  let seed=72391,positions=0;
  for(let game=0;game<30;game++){
    const moves=[],heights=new Uint8Array(7);
    for(let ply=0;ply<=42;ply++){
      const root=connect4RbaFromMoves(moves,{geometry:g});
      const args=[g,root.words,0,root.basis,0,root.basis.length];
      assert.equal(cpc.evaluateConnect4Cpc32(...args,b),oldCpc.evaluateConnect4Cpc32(...args,a));
      for(const field of ['interval','forcedColumn','preemptionCount','preemptionMask32','precursorCount'])
        assert.deepEqual(b[field],a[field],field);
      positions++;
      if(root.words[g.metaOffset]&3)break;
      const legal=Array.from({length:7},(_,c)=>c).filter(c=>heights[c]<6);
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const col=legal[seed%legal.length];moves.push(col);heights[col]++;
    }
  }
  assert.ok(positions>400);
});
test('shared TT keeps seqlock, compact identity and collisions without statistics',()=>{
  const a=oldTT.createConnect4RbaSharedExactCache32({capacity:2,keyWords:g.keyWords,geometry:g});
  const b=tt.createConnect4RbaSharedExactCache32({capacity:2,keyWords:g.keyWords,geometry:g});
  for(const sequence of ['','3','33','333','3333','33333']){
    const root=connect4RbaFromMoves([...sequence].map(Number),{geometry:g});
    for(const hash of [0,1,2,3]){
      assert.equal(tt.probeConnect4RbaSharedExactCache32(b,root.words,0,hash),oldTT.probeConnect4RbaSharedExactCache32(a,root.words,0,hash));
      tt.storeConnect4RbaSharedExactCache32(b,root.words,0,3,hash);
      oldTT.storeConnect4RbaSharedExactCache32(a,root.words,0,3,hash);
      for(const field of ['keys','sequence','value'])assert.deepEqual(b[field],a[field]);
      assert.equal(tt.probeConnect4RbaSharedExactCache32(b,root.words,0,hash),3);
      Atomics.store(b.sequence,hash&1,5);
      assert.equal(tt.probeConnect4RbaSharedExactCache32(b,root.words,0,hash),0);
      Atomics.store(b.sequence,hash&1,a.sequence[hash&1]);
    }
  }
  assert.equal(b.stats,undefined);
});
test('STOP cancels deep search without publishing WDL and state can be reused',()=>{
  const {state,words}=prepare(lean),root=connect4RbaFromMoves([...sequences[0]].map(Number),{geometry:g});
  const load=state.behaviorLoad;let reads=0;
  state.behaviorLoad=()=>{if(++reads===8)publishWorkerBehavior32(words,0,1);return load();};
  assert.equal(lean.solveConnect4RbaFrontier(root,{state,reflected:root.reflected}).status,'CANCELLED');
  state.behaviorLoad=load;publishWorkerBehavior32(words,0,0);
  assert.equal(lean.solveConnect4RbaFrontier(root,{state,reflected:root.reflected}).status,'EXACT');
});
test('lean host returns unavailable counters honestly and closes workers on exact and timeout',async()=>{
  const config={geometry:g,workers:4,sharedCacheCapacity:4096,localCacheCapacity:4096,timeoutMs:10000};
  const result=await runLazySmpConnect4Rba32([...sequences[0]].map(Number),config);
  assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,-1);
  assert.equal(result.nodeCounts,null);assert.equal(result.winnerMetrics,null);
  assert.equal(result.sharedCacheHits,null);assert.equal(result.cleanup,true);assert.equal(result.workersExited,4);
  const timeout=await runLazySmpConnect4Rba32([],{...config,timeoutMs:100});
  assert.equal(timeout.status,'TIMEOUT');assert.equal(timeout.rootWdl,null);assert.equal(timeout.cleanup,true);
  await assert.rejects(runLazySmpConnect4Rba32([],{...config,sharedSampleMask:1}),/sample/);
  await assert.rejects(runLazySmpConnect4Rba32([],{...config,rootFrontier:true}),/deep/);
});
