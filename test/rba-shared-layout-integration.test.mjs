import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareLazySmpConnect4Rba32,runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';

test('native layout is selected once at initialization with four ready workers',async()=>{
  for(const [columns,rows] of [[3,3],[7,5],[7,6]]){
    const geometry=prepareConnect4RbaGeometry({columns,rows});
    const moves=columns===3?[]:[3,0,3,0,3,1];
    const result=await runLazySmpConnect4Rba32(moves,{geometry,workers:4,workerMode:'minimal',
      sharedCacheLayout:'native',sharedCacheCapacity:256,localCacheCapacity:256,timeoutMs:5000});
    assert.equal(result.status,'EXACT');assert.equal(result.sharedCacheLayout,'native');
    assert.equal(result.readyWorkers,4);assert.equal(result.workersExited,4);
    if(columns===7&&rows===6)assert.equal(result.sharedTtEntryBytes,32);
    if(columns===7)assert.equal(result.rootWdl,1);
  }
});
test('invalid native halfword capacity rejects before any shared allocation',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
  const original=globalThis.SharedArrayBuffer;let allocations=0;
  globalThis.SharedArrayBuffer=new Proxy(original,{construct(target,args){allocations++;throw Error('unexpected allocation');}});
  try{await assert.rejects(prepareLazySmpConnect4Rba32({geometry,workers:4,
    sharedCacheLayout:'native',sharedCacheCapacity:2**28,sharedBankCapacity:2**28,localCacheCapacity:256}),RangeError);
    assert.equal(allocations,0);
  }finally{globalThis.SharedArrayBuffer=original;}
});
test('native memory accounting counts aliased TT backing once',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:7,rows:6}),results=[];
  for(const sharedCacheLayout of ['split40','native']){
    const app=await prepareLazySmpConnect4Rba32({geometry,workers:4,sharedCacheLayout,
      sharedCacheCapacity:256,localCacheCapacity:256,timeoutMs:5000});
    results.push(await app.solve([3,0,3,0,3,1]));
  }
  assert.equal(results[0].sharedBytes-results[1].sharedBytes,256*8);
});
test('both layout owners clean up idle, active and aborted applications',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
  for(const sharedCacheLayout of ['split40','native']){
    const opts={geometry,workers:4,sharedCacheLayout,sharedCacheCapacity:256,localCacheCapacity:256,timeoutMs:5000};
    const idle=await prepareLazySmpConnect4Rba32(opts);await idle.close();
    assert.equal(idle.state().workersExited,4);assert.equal(idle.state().searchStarted,false);
    const active=await prepareLazySmpConnect4Rba32(opts),pending=active.solve([]);
    await active.close();assert.equal((await pending).status,'INTERRUPTED');
    const controller=new AbortController(),aborted=await prepareLazySmpConnect4Rba32({...opts,signal:controller.signal});
    controller.abort();const result=await aborted.solve([]);
    assert.equal(result.status,'INTERRUPTED');assert.equal(result.workersExited,4);
  }
});
test('automatic layout uses qualified 7x6 storage and preserves generic storage',async()=>{
  for(const [columns,rows,expected,bytes] of [[7,6,'native',32],[7,5,'split40',56],[3,3,'split40',24]]){
    const geometry=prepareConnect4RbaGeometry({columns,rows});
    const result=await runLazySmpConnect4Rba32(columns===3?[]:[3,0,3,0,3,1],{
      geometry,workers:4,workerMode:'minimal',sharedCacheCapacity:256,localCacheCapacity:256,timeoutMs:5000});
    assert.equal(result.status,'EXACT');assert.equal(result.sharedCacheLayout,expected);
    assert.equal(result.sharedTtEntryBytes,bytes);assert.equal(result.workersExited,4);
  }
});
