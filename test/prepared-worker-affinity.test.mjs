import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverWorkerPlan} from '../addons/worker-topology.mjs';
import {prepareLazySmpConnect4Rba32} from '../addons/rba-connect4-prepared-session-host.mjs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
test('each worker verifies its CPU binding before READY and search',async()=>{
 if(!['win32','linux'].includes(process.platform))return;
 const plan=await discoverWorkerPlan(),workers=Math.min(4,plan.workers);
 if(workers<2)return;
 const app=await prepareLazySmpConnect4Rba32({geometry:prepareConnect4RbaGeometry({columns:1,rows:4}),workers,workerTargets:plan.targets.slice(0,workers),sharedCacheCapacity:256,localCacheCapacity:256});
 try{
  assert.equal(app.state().readyWorkers,workers);assert.equal(app.state().affinityVerified,true);assert.equal(app.state().searchStarted,false);
  const result=await app.solve([]);assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,0);
  assert.equal(result.workersExited,workers);assert.equal(result.cleanup,true);
  assert.equal(new Set(result.workerAffinity.map(a=>`${a.group}:${a.cpu}`)).size,workers);
  for(const [i,a] of result.workerAffinity.entries()){
   assert.equal(a.verified,true);assert.equal(a.cpu,plan.targets[i].cpu??plan.targets[i].processor);
  }
 }finally{await app.close();}
});
test('invalid affinity closes every worker and never releases search',async()=>{
 if(!['win32','linux'].includes(process.platform))return;
 const bad={platform:process.platform,cpu:-1,group:0,processor:-1},app=await prepareLazySmpConnect4Rba32({geometry:prepareConnect4RbaGeometry({columns:1,rows:4}),workers:2,workerTargets:[bad,bad],sharedCacheCapacity:256,localCacheCapacity:256});
 try{assert.equal(app.state().searchStarted,false);assert.equal(app.state().closed,true);assert.equal(app.state().cleanup,true);assert.equal(app.state().workersExited,2);}
 finally{await app.close();}
});
