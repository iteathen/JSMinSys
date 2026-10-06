import test from 'node:test';import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,prepareLazySmpConnect4Rba32} from '../index.mjs';
test('packaged preparation selects compiled planes before releasing four workers',async()=>{
 const app=await prepareLazySmpConnect4Rba32({workers:4,geometry:prepareConnect4RbaGeometry({columns:4,rows:3}),sharedCacheCapacity:16,localCacheCapacity:16});
 let result;
 try{
  assert.equal(app.state().readyWorkers,4);assert.equal(app.state().searchStarted,false);assert.equal(app.state().compiledTransitions,true);
  result=await app.solve([]);
 }finally{await app.close();}
 assert.equal(result.status,'EXACT');assert.equal(result.compiledTransitions,true);assert.equal(result.supportBasisPlanBytes,13072);
 assert.equal(result.supportTransitionPlanBytes,7168);assert.equal(app.state().workersExited,4);assert.equal(app.state().cleanup,true);
});
