import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,resolveIsoMaxCacheIdentity32,selectIsoMaxMemoryProfile32,prepareLazySmpConnect4Rba32} from '../index.mjs';

test('public policy reaches tested partial24 capacities without allocating',()=>{
 const geometry=prepareConnect4RbaGeometry({columns:7,rows:6}),
  cacheIdentity=resolveIsoMaxCacheIdentity32({geometry,workers:6}),
  plan=selectIsoMaxMemoryProfile32({geometry,workers:6,availableBytes:20*2**30,cacheIdentity});
 assert.equal(cacheIdentity,'partial24');assert.equal(plan.profile.id,'12');
 assert.equal(plan.sharedBytes,12*2**30);assert.equal(plan.privateBytesPerWorker,192*2**20);
 assert.equal(plan.bankEntries,2**28);assert.equal(plan.bankCount,2);
});

test('public prepared session reports actual partial backing and private capacity',async()=>{
 const geometry=prepareConnect4RbaGeometry({columns:7,rows:6}),app=await prepareLazySmpConnect4Rba32({geometry,workers:2,sharedCacheCapacity:256,localCacheCapacity:256});
 try{
  assert.equal(app.memoryPlan.sharedBytes,256*24);
  assert.equal(app.memoryPlan.privateBytesPerWorker,256*24);
  const result=await app.solve([3,0,3,0,3,1]);
  assert.equal(result.cacheIdentity,'partial24');assert.equal(result.sharedTtPayloadBytes,app.memoryPlan.sharedBytes);
  assert.equal(result.privateTtEntryBytes,24);assert.equal(result.rootWdl,1);
  assert.equal(result.workersExited,2);assert.equal(result.cleanup,true);
 }finally{await app.close();}
});

test('custom split40 metadata matches its actual allocation',async()=>{
 const geometry=prepareConnect4RbaGeometry({columns:7,rows:6}),
  app=await prepareLazySmpConnect4Rba32({geometry,workers:2,cacheIdentity:'native32',sharedCacheLayout:'split40',
   sharedCacheCapacity:256,localCacheCapacity:256,supportBasisPlanBudgetBytes:0});
 try{
  assert.equal(app.memoryPlan.entryBytes,40);
  assert.equal(app.memoryPlan.sharedBytes,256*40);
  const result=await app.solve([3,0,3,0,3,1]);
  assert.equal(result.sharedTtEntryBytes,app.memoryPlan.entryBytes);assert.equal(result.rootWdl,1);
 }finally{await app.close();}
});

test('public automatic fallback executes split layouts and tiny TT capacities',async()=>{
 const {prepareSupportBasisPlans32}=await import('../runtime/addons/rba-connect4-support-basis-plan.mjs'),
  {prepareSupportCompiledTransitions32}=await import('../runtime/addons/rba-connect4-support-compiled-transition.mjs'),
  geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
 geometry.supportBasisPlans=prepareSupportBasisPlans32(geometry,2**30,true,true);
 geometry.supportBasisPlans=prepareSupportCompiledTransitions32(geometry,geometry.supportBasisPlans);
 for(const custom of [{localCacheLayout:'split'},{sharedCacheLayout:'split40'},
  {sharedCacheCapacity:1,localCacheCapacity:4}]){
  const app=await prepareLazySmpConnect4Rba32({geometry,workers:2,sharedCacheCapacity:256,
   localCacheCapacity:256,supportBasisPlanBudgetBytes:0,...custom});
  try{
   const result=await app.solve([3,0,3,0,3,1]);
   assert.equal(result.cacheIdentity,'native32');assert.equal(result.status,'EXACT');
   assert.equal(result.rootWdl,1);assert.equal(result.workersExited,2);assert.equal(result.cleanup,true);
  }finally{await app.close();}
 }
});
