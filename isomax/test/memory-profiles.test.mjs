import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../index.mjs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('public package exposes all tested and experimental memory profiles',()=>{
 assert.equal(Array.isArray(api.ISOMAX_MEMORY_PROFILES),true);
 assert.deepEqual(api.ISOMAX_MEMORY_PROFILES.map(p=>p.id),['1','2','4','8','12','16','32','64','128']);
 assert.equal(api.ISOMAX_MEMORY_PROFILES.find(p=>p.id==='8').status,'tested');
 assert.equal(api.ISOMAX_MEMORY_PROFILES.find(p=>p.id==='128').status,'experimental');
});
test('public profile selector allows automatic experimental choices without allocation',()=>{
 const geometry=api.prepareConnect4RbaGeometry({columns:7,rows:6});
 const chosen=api.selectIsoMaxMemoryProfile32({geometry,workers:6,availableBytes:256*2**30});
 assert.equal(chosen.profile.id,'128');assert.equal(chosen.profile.status,'experimental');
 assert.equal(chosen.sharedCacheCapacity,2**32);assert.equal(chosen.bankCount,32);
});
test('CLI profile listing reports tested8 and experimental16..128 without solving',()=>{
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('../run.mjs',import.meta.url)),'--list-memory-profiles'],{encoding:'utf8',timeout:10000});
 assert.equal(result.status,0,result.stderr);const profiles=JSON.parse(result.stdout);
 assert.deepEqual(profiles.map(p=>p.sharedGiB),[1,2,4,8,12,16,32,64,128]);assert.equal(profiles[3].status,'tested');
 assert.ok(profiles.slice(5).every(p=>p.status==='experimental'));
});
test('explicit tiny cache controls report custom memory and retain all discovered workers',async()=>{
 const geometry=api.prepareConnect4RbaGeometry({columns:1,rows:4}),detected=await api.discoverWorkerPlan();
 if(detected.workers<2||detected.workers>64)return;
 const app=await api.prepareLazySmpConnect4Rba32({geometry,sharedCacheCapacity:256,localCacheCapacity:256,supportBasisPlanBudgetBytes:0});
 try{
  assert.equal(app.memoryPlan.profile.id,'custom');assert.equal(app.workerPlan.workers,detected.workers);
  assert.ok(app.memoryPlan.requiredBytes<=app.memoryPlan.availableBytes);assert.equal(app.state().searchStarted,false);
  const result=await app.solve([]);assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,0);assert.equal(result.cleanup,true);
 }finally{await app.close();}
});
