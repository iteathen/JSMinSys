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
  assert.equal(app.state().affinityReady,true);
  assert.equal(app.state().affinityVerified,discovered.platform!=='darwin');
  assert.equal(app.workerPlan.workers,discovered.workers);
  const result=await app.solve([]);
  assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,0);
  assert.equal(result.workersExited,discovered.workers);assert.equal(result.cleanup,true);
  for(const a of result.workerAffinity){assert.equal(a.verified,discovered.platform!=='darwin');assert.equal(a.hintsApplied,discovered.platform==='darwin');}
 }finally{await app.close();}
});
test('explicit worker override uses a supported pinned worker count',async()=>{
 const discovered=await discoverWorkerPlan(),workers=Math.min(4,discovered.workers);
 if(workers<2)return;
 const app=await prepareLazySmpConnect4Rba32({workers,geometry:prepareConnect4RbaGeometry({columns:4,rows:1}),sharedCacheCapacity:256,localCacheCapacity:256,supportBasisPlanBudgetBytes:0});
 try{
  assert.equal(app.workerPlan.selection,'explicit');assert.equal(app.state().readyWorkers,workers);
  const result=await app.solve([]);assert.equal(result.rootWdl,0);assert.equal(result.workersExited,workers);
 }finally{await app.close();}
});
test('portable launcher reports discovered count and explicit override',async()=>{
 const discovered=await discoverWorkerPlan();
 for(const args of [[],['--workers',String(Math.max(2,Math.min(4,discovered.workers)))]]){
  const r=spawnSync(process.execPath,[fileURLToPath(new URL('../run.mjs',import.meta.url)),'--columns','1','--rows','4','--shared-entries','256','--local-entries','256',...args],{encoding:'utf8',timeout:15000});
  if(discovered.workers<2||(!args.length&&discovered.workers>64)){assert.equal(r.status,1);assert.match(r.stderr,/2\.\.64|physical CPU/);continue;}
  assert.equal(r.status,0,r.stderr);const out=JSON.parse(r.stdout);
  assert.equal(out.configuration.workers,out.workerPlan.workers);
  assert.equal(out.result.workersExited,out.workerPlan.workers);
  if(args.length)assert.equal(out.workerPlan.selection,'explicit');
  else assert.notEqual(out.workerPlan.selection,'explicit');
 }
});
test('no override may silently allocate more workers than distinct physical targets',async()=>{
 const p=await discoverWorkerPlan();if(p.workers>=64)return;
 await assert.rejects(()=>prepareLazySmpConnect4Rba32({workers:Math.max(2,p.workers+1)}),/exceed.*physical/);
});
test('invalid worker counts reject before solver allocation',async()=>{
 for(const workers of [1,0,65,2.5,'guess'])await assert.rejects(()=>prepareLazySmpConnect4Rba32({workers}),/worker/i);
});
