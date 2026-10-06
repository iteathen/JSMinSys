import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepareConnect4RbaGeometry,evaluateConnect4RankLocalLanding32,runLazySmpConnect4Rba32} from '../index.mjs';
import '../verify.mjs';
test('optional calculator preserves all seven controls',()=>{
 const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
 for(const s of ['','4','44','444','4444','44444','41']){
  const r=evaluateConnect4RankLocalLanding32([...s].map(c=>+c-1),{geometry});
  assert.equal(r.status,s==='44444'?'UNRESOLVED':'CERTIFIED');assert.equal(r.move,s==='44444'?-1:3);
 }
});
for(const [C,R,moves,wdl] of [
 [7,6,[6,0,5,2,0,0,4,1,2,6,5,6,1,5,5,0,5,1,6,6,2,4,6,4,4,4,4,5,0,1,0,2,2,1],1],
 [7,5,[2,6,3,2,4,1,6,0,3,1,2,4,6,5,0,0,1,4,3,2,6,2,4,5,4,0,0,6,5],-1],
 [1,4,[],0],[4,1,[],0]
])test('four-worker '+C+'x'+R+' preserves exact outcome and cleanup',async()=>{
 for(const budget of C===7?[0,1073741824]:[0]){
  const result=await runLazySmpConnect4Rba32(moves,{workers:4,geometry:prepareConnect4RbaGeometry({columns:C,rows:R}),sharedCacheCapacity:256,localCacheCapacity:256,supportBasisPlanBudgetBytes:budget,timeoutMs:10000});
  assert.equal(result.status,'EXACT',JSON.stringify(result.errors));assert.equal(result.rootWdl,wdl);assert.equal(result.workersExited,4);assert.equal(result.cleanup,true);assert.equal(result.nodeCounts,null);assert.equal(result.basisViews,C===7&&budget>0);
 }
});
test('portable launcher starts without installation and reports empty-board execution',()=>{
 const r=spawnSync(process.execPath,[fileURLToPath(new URL('../run.mjs',import.meta.url)),'--workers','4','--columns','1','--rows','4','--shared-entries','256','--local-entries','256'],{encoding:'utf8',timeout:15000});
 assert.equal(r.status,0,r.stderr);const out=JSON.parse(r.stdout);assert.equal(out.startingPosition,'empty');assert.equal(out.result.rootWdl,0);assert.equal(out.result.workersExited,4);assert.equal(out.configuration.workers,4);
});
