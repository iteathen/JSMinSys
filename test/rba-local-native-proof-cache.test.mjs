import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';
const api=await import('../addons/rba-connect4-local-native-proof-cache.mjs').catch(()=>({}));

test('private native proof records allocate cold and preserve all exact compact key lanes',()=>{
 assert.equal(typeof api.createLocalNativeProofCache32,'function');
 const g=prepareConnect4RbaGeometry({columns:7,rows:6}),cache=api.createLocalNativeProofCache32(g,1),
  q=connect4RbaFromMoves([],{geometry:g,canonical:false}).words;
 assert.equal(cache.entries.byteLength,32);
 assert.equal(cache.halves.buffer,cache.entries.buffer);
 assert.equal(cache.entries[0],0);
 const check=api.localNativeProofKeyMatches32,store=api.storeLocalNativeProofEntry32;
 for(let tag=1;tag<=5;tag++){
  store(cache,q,0,0,tag);assert.equal(cache.entries[0],tag);assert.equal(check(cache,q,0,0),true);
  for(let w=0;w<14;w++){
   const other=q.slice();
   // Every bit in the legitimate coordinate tail, native height and metadata
   // domains is part of identity; rank is reconstructed from heights by RBA.
   const width=w===7?2:(w===10||w===13)?5:w<7?3:32;
   for(let bit=0;bit<width;bit++){
    other.set(q);other[w]^=1<<bit;
    assert.equal(check(cache,other,0,0),false,`word${w} bit${bit}`);
   }
  }
 }
 const gray=q.slice();gray.fill(0,g.p0Offset);store(cache,gray,0,0,5);
 assert.equal(check(cache,q,0,0),false);assert.equal(check(cache,gray,0,0),true);
 const shifted=new Uint32Array(37);shifted.set(q,9);store(cache,shifted,9,0,2);
 assert.equal(check(cache,shifted,9,0),true);
 assert.equal(check(cache,gray,0,0),false);
});

test('private native allocation refuses unsupported profiles and invalid capacities before allocation',()=>{
 assert.equal(typeof api.createLocalNativeProofCache32,'function');
 for(const [columns,rows] of [[7,5],[4,4],[3,3],[10,10]]){
  const g=prepareConnect4RbaGeometry({columns,rows});
  assert.throws(()=>api.createLocalNativeProofCache32(g,1),RangeError);
 }
 const g=prepareConnect4RbaGeometry({columns:7,rows:6});
 for(const n of [0,3,-1,2**32,2**28+1,NaN])assert.throws(()=>api.createLocalNativeProofCache32(g,n),RangeError);
 const cache=api.createLocalNativeProofCache32(g,2),q=connect4RbaFromMoves([],{geometry:g,canonical:false}).words;
 api.storeLocalNativeProofEntry32(cache,q,0,1,4);
 assert.equal(cache.entries[0],0);assert.equal(cache.entries[8],4);
 assert.equal(api.localNativeProofKeyMatches32(cache,q,0,1),true);
});

test('private layout is selected cold for the geometry and all four workers agree on exact results',async()=>{
 for(const [columns,rows,moves] of [[7,6,[0,6,1,6,2,5]],[7,5,[0,6,1,6,2,5]],[4,4,[0,1,0,1,0,2]]]){
  const geometry=prepareConnect4RbaGeometry({columns,rows});
  for(const sharedProofBounds of [false,true]){
   const result=await runLazySmpConnect4Rba32(moves,{geometry,workers:4,workerMode:'minimal',
    sharedCacheCapacity:256,localCacheCapacity:256,sharedProofBounds,localCacheLayout:'native',timeoutMs:5000,
    supportBasisPlanBudgetBytes:8*2**20,supportClosurePlan:true,supportReflectionPlan:true});
   assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,1);
   assert.equal(result.localCacheLayout,rows===6?'native':'split');
   assert.equal(result.privateTtEntryBytes,rows===6?32:geometry.keyWords*4+1);
   assert.equal(result.readyWorkers,4);assert.equal(result.workersExited,4);assert.equal(result.cleanup,true);
  }
 }
 const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
 await assert.rejects(runLazySmpConnect4Rba32([],{geometry,workerMode:'minimal',localCacheLayout:'junk'}),TypeError);
});
