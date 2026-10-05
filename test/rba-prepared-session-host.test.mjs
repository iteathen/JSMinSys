import test from 'node:test';
import assert from 'node:assert/strict';
import * as host from '../addons/rba-connect4-lazy-smp-host.mjs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {ManagedThreadSession} from '../addons/branch-manager-host.mjs';

const options=()=>({geometry:prepareConnect4RbaGeometry({columns:4,rows:3}),workers:4,
  workerMode:'minimal',sharedCacheCapacity:4096,localCacheCapacity:4096,timeoutMs:10000});

test('abort during joined exact-result cleanup cannot replace DONE',async()=>{
  const original=ManagedThreadSession.prototype.close;
  let entered,release;
  const closed=new Promise(resolve=>{entered=resolve;}),gate=new Promise(resolve=>{release=resolve;});
  ManagedThreadSession.prototype.close=async function(){await original.call(this);entered();await gate;};
  const controller=new AbortController();let prepared;
  try{
    prepared=await host.prepareLazySmpConnect4Rba32({...options(),
      geometry:prepareConnect4RbaGeometry({columns:1,rows:1}),signal:controller.signal});
    const pending=prepared.solve([]);await closed;
    assert.equal(prepared.state().done,true);controller.abort();release();
    const result=await pending;assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,0);
    assert.equal(result.errorCode,0);assert.equal(result.workersExited,4);
  }finally{release();if(prepared)await prepared.close();ManagedThreadSession.prototype.close=original;}
});

test('application preparation allocates all four workers but performs no search',async()=>{
  assert.equal(typeof host.prepareLazySmpConnect4Rba32,'function');
  const prepared=await host.prepareLazySmpConnect4Rba32(options());
  try{
    assert.equal(prepared.state().readyWorkers,4);
    assert.equal(prepared.state().searchStarted,false);
    assert.equal(prepared.state().done,false);
    const result=await prepared.solve([]);
    assert.equal(result.status,'EXACT');assert.equal(result.cleanup,true);
    assert.equal(result.workersExited,4);assert.equal(result.readyWorkers,4);
    await assert.rejects(prepared.solve([]),/one-shot|already/);
  }finally{await prepared.close();}
});

test('closing an idle prepared application joins workers without a solve',async()=>{
  assert.equal(typeof host.prepareLazySmpConnect4Rba32,'function');
  const prepared=await host.prepareLazySmpConnect4Rba32(options());
  await prepared.close();await prepared.close();
  assert.equal(prepared.state().searchStarted,false);
  assert.equal(prepared.state().cleanup,true);
  assert.equal(prepared.state().workersExited,4);
});

test('ordinary minimal API also waits for every worker before search',async()=>{
  const result=await host.runLazySmpConnect4Rba32([3,3,2],options());
  assert.equal(result.status,'EXACT');assert.equal(result.readyWorkers,4);
  assert.equal(result.cleanup,true);assert.equal(result.workersExited,4);
});

test('pre-aborted empty preparation returns INTERRUPTED rather than initialization error',async()=>{
  const result=await host.runLazySmpConnect4Rba32([],{...options(),preparedEmptyTiming:true,signal:AbortSignal.abort()});
  assert.equal(result.status,'INTERRUPTED');assert.equal(result.cleanup,true);
});

test('closing an active prepared search resolves its result and joins every worker',async()=>{
  const prepared=await host.prepareLazySmpConnect4Rba32({...options(),
    geometry:prepareConnect4RbaGeometry({columns:7,rows:6}),timeoutMs:10000});
  const solving=prepared.solve([]);
  await prepared.close();
  const result=await solving;
  assert.equal(result.status,'INTERRUPTED');assert.equal(result.cleanup,true);
  assert.equal(result.workersExited,4);
});
