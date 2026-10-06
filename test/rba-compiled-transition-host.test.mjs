import test from 'node:test';import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';
test('compiled preparation and resource fallback both release four workers without position work',async()=>{
 for(const [columns,rows,budget,compiled] of [[4,3,8388608,true],[9,4,2147483648,false]]){
  const p=await prepareLazySmpConnect4Rba32({geometry:prepareConnect4RbaGeometry({columns,rows}),workers:4,sharedCacheCapacity:16,localCacheCapacity:16,
   supportBasisPlanBudgetBytes:budget,supportClosurePlan:true,supportReflectionPlan:true,supportBasisViews:true,initializationTimeoutMs:30000});
  try{const s=p.state();assert.equal(s.readyWorkers,4);assert.equal(s.searchStarted,false);assert.equal(s.basisViews,true);assert.equal(s.compiledTransitions,compiled);}
  finally{await p.close();}
  assert.equal(p.state().workersExited,4);assert.equal(p.state().cleanup,true);
 }
});
