import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';

test('prepared empty solve waits for all four workers and preserves the exact result',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:4,rows:3});
  const options={geometry,workers:4,workerMode:'minimal',sharedCacheCapacity:4096,localCacheCapacity:4096,timeoutMs:10000};
  const measured=await runLazySmpConnect4Rba32([],{...options,preparedEmptyTiming:true});
  assert.equal(measured.preparedTiming.readyWorkers,4);
  assert.equal(measured.preparedTiming.rootConstructedAfterReady,true);
  for(const key of ['initializationMs','solveMs','cleanupMs'])assert.ok(measured.preparedTiming[key]>=0,key);
  assert.equal(measured.status,'EXACT');assert.equal(measured.cleanup,true);assert.equal(measured.workersExited,4);
  const ordinary=await runLazySmpConnect4Rba32([],options);
  assert.equal(measured.rootWdl,ordinary.rootWdl);
  assert.ok(measured.move>=0&&measured.move<4);
});

test('prepared empty boundary rejects nonempty positions and legacy workers',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:4,rows:3});
  await assert.rejects(runLazySmpConnect4Rba32([1],{geometry,workers:4,workerMode:'minimal',preparedEmptyTiming:true}),/empty minimal/);
  await assert.rejects(runLazySmpConnect4Rba32([],{geometry,workers:4,preparedEmptyTiming:true}),/empty minimal/);
});
