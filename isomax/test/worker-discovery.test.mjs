import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {discoverWorkerPlan,prepareLazySmpConnect4Rba32,prepareConnect4RbaGeometry} from '../index.mjs';

test('default prepared application creates discovered workers before search',async()=>{
 const discovered=await discoverWorkerPlan();
 if(discovered.workers<2||discovered.workers>64){
  await assert.rejects(()=>prepareLazySmpConnect4Rba32(),/2\.\.64/);return;
 }
 const app=await prepareLazySmpConnect4Rba32({geometry:prepareConnect4RbaGeometry({columns:1,rows:4}),sharedCacheCapacity:256,localCacheCapacity:256,supportBasisPlanBudgetBytes:0});
 try{
  assert.equal(app.state().readyWorkers,discovered.workers);
  assert.equal(app.state().searchStarted,false);
  assert.equal(app.workerPlan.workers,discovered.workers);
  const result=await app.solve([]);
  assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,0);
  assert.equal(result.workersExited,discovered.workers);assert.equal(result.cleanup,true);
 }finally{await app.close();}
});
test('explicit worker override retains a reproducible four-worker solve',async()=>{
 const app=await prepareLazySmpConnect4Rba32({workers:4,geometry:prepareConnect4RbaGeometry({columns:4,rows:1}),sharedCacheCapacity:256,localCacheCapacity:256,supportBasisPlanBudgetBytes:0});
 try{
  assert.equal(app.workerPlan.selection,'explicit');assert.equal(app.state().readyWorkers,4);
  const result=await app.solve([]);assert.equal(result.rootWdl,0);assert.equal(result.workersExited,4);
 }finally{await app.close();}
});
test('portable launcher reports discovered count and explicit override',async()=>{
 const discovered=await discoverWorkerPlan();
 for(const args of [[],['--workers','4']]){
  const r=spawnSync(process.execPath,[fileURLToPath(new URL('../run.mjs',import.meta.url)),'--columns','1','--rows','4','--shared-entries','256','--local-entries','256',...args],{encoding:'utf8',timeout:15000});
  if(!args.length&&(discovered.workers<2||discovered.workers>64)){assert.equal(r.status,1);assert.match(r.stderr,/2\.\.64/);continue;}
  assert.equal(r.status,0,r.stderr);const out=JSON.parse(r.stdout);
  assert.equal(out.configuration.workers,out.workerPlan.workers);
  assert.equal(out.result.workersExited,out.workerPlan.workers);
  if(args.length)assert.equal(out.workerPlan.selection,'explicit');
  else assert.notEqual(out.workerPlan.selection,'explicit');
 }
});
test('invalid worker counts reject before solver allocation',async()=>{
 for(const workers of [1,0,65,2.5,'guess'])await assert.rejects(()=>prepareLazySmpConnect4Rba32({workers}),/worker/i);
});
