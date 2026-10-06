import test from 'node:test';import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';
import {prepareSupportCompiledTransitions32} from '../addons/rba-connect4-support-compiled-transition.mjs';
test('compiled preparation and resource fallback both release four workers without position work',async()=>{
 for(const [columns,rows,budget,compiled] of [[4,3,8388608,true],[9,4,2147483648,false]]){
  const p=await prepareLazySmpConnect4Rba32({geometry:prepareConnect4RbaGeometry({columns,rows}),workers:4,sharedCacheCapacity:16,localCacheCapacity:16,
   supportBasisPlanBudgetBytes:budget,supportClosurePlan:true,supportReflectionPlan:true,supportBasisViews:true,initializationTimeoutMs:30000});
  try{const s=p.state();assert.equal(s.readyWorkers,4);assert.equal(s.searchStarted,false);assert.equal(s.basisViews,true);assert.equal(s.compiledTransitions,compiled);}
  finally{await p.close();}
  assert.equal(p.state().workersExited,4);assert.equal(p.state().cleanup,true);
 }
});
test('public prepared session reuses supplied compiled geometry without inflating resource reporting',async()=>{
 const g=prepareConnect4RbaGeometry({columns:4,rows:3}),base=prepareSupportBasisPlans32(g,8388608,true,true),plan=prepareSupportCompiledTransitions32(g,base),
  p=await prepareLazySmpConnect4Rba32({geometry:{...g,supportBasisPlans:plan},workers:4,sharedCacheCapacity:16,localCacheCapacity:16,supportBasisViews:true});
 let result;
 try{assert.equal(p.state().readyWorkers,4);result=await p.solve([]);}
 finally{await p.close();}
 assert.equal(result.status,'EXACT');assert.equal(result.supportBasisPlanBytes,13072);assert.equal(result.supportPlanWorkingBytes,plan.workingBytes);
 assert.equal(p.state().workersExited,4);assert.equal(p.state().cleanup,true);
});
