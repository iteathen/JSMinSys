import test from 'node:test';import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';

test('native private view workers preserve explicit native and split shared layouts',async()=>{
 for(const sharedCacheLayout of ['native','split40'])for(const sharedProofBounds of [false,true]){
  const r=await runLazySmpConnect4Rba32([],{geometry:prepareConnect4RbaGeometry({columns:7,rows:6}),workers:4,workerMode:'minimal',
   sharedCacheCapacity:256,localCacheCapacity:256,localCacheLayout:'native',sharedCacheLayout,sharedProofBounds,
   supportBasisPlanBudgetBytes:1073741824,supportClosurePlan:true,supportReflectionPlan:true,supportBasisViews:true,timeoutMs:100});
  assert.ok(['TIMEOUT','EXACT'].includes(r.status),JSON.stringify({sharedCacheLayout,sharedProofBounds,r}));
  assert.equal(r.sharedCacheLayout,sharedCacheLayout);assert.equal(r.localCacheLayout,'native');assert.equal(r.basisViews,true);assert.equal(r.readyWorkers,4);assert.equal(r.cleanup,true);assert.equal(r.workersExited,4);
 }
});
