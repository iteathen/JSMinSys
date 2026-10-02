import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,evaluateConnect4RankLocalLanding32,runLazySmpConnect4Rba32} from '../index.mjs';
import '../verify.mjs';
test('packaged calculator computes five moves and all seven controls',()=>{
  const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
  for(const sequence of ['','4','44','444','4444','44444','41']){
    const result=evaluateConnect4RankLocalLanding32([...sequence].map(c=>+c-1),{geometry});
    assert.equal(result.status,sequence==='44444'?'UNRESOLVED':'CERTIFIED');
    assert.equal(result.move,sequence==='44444'?-1:3);
    if(sequence==='44444')assert.equal(result.reason,'UNIQUE_MAX_EXHAUSTS_COLUMN');
  }
});
test('standard board with sparse initialization keeps a valid worker path',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:7,rows:6,specializationBudgetBytes:0});
  const r=await runLazySmpConnect4Rba32([...'1320461024522311'].map(Number),{
    geometry,workers:2,sharedCacheCapacity:256,localCacheCapacity:256,timeoutMs:10000});
  assert.equal(r.executionProfile.solver,'./solver.mjs');
  assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,-1);assert.equal(r.cleanup,true);
});
for(const [columns,rows,moves,wdl] of [
  [7,6,[...'1320461024522311'].map(Number),-1],[7,5,[...'1320461024522311'].map(Number),-1],[4,4,[1,2,0,2,3,2,3,1,0,3],0],
  [4,5,[0,0,3,0,0,1,1,1,3,0,1,1,2,3],-1],
  [33,1,[8,3,22,19,15,24,1,10,20,28,27,7,32,25,18,23,17,16,21,2,12,6,11,9,31,5,29],-1],
  [1,1,[],0],
])test(`standalone ${columns}x${rows} actual workers`,async()=>{
  const geometry=prepareConnect4RbaGeometry({columns,rows});
  const result=await runLazySmpConnect4Rba32(moves,{geometry,workers:2,sharedCacheCapacity:256,localCacheCapacity:256,timeoutMs:10000});
  assert.equal(result.status,'EXACT',JSON.stringify(result.errors));assert.equal(result.rootWdl,wdl);
  assert.equal(result.cleanup,true);assert.equal(result.workersExited,2);
  assert.equal(result.nodeCounts,null);
  if(result.move>=0){assert.ok(result.move<columns);assert.ok(moves.filter(c=>c===result.move).length<rows);}
});

test('7x5 selects optimized library kernels under both preparation budgets',async()=>{
  for(const budget of [0,2097152]){
    const geometry=prepareConnect4RbaGeometry({columns:7,rows:5,specializationBudgetBytes:budget});
    const result=await runLazySmpConnect4Rba32([...'1320461024522311'].map(Number),{geometry,workers:2,sharedCacheCapacity:256,localCacheCapacity:256,timeoutMs:10000});
    assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,-1);assert.equal(result.cleanup,true);
    assert.equal(result.executionProfile.solver,budget?'./solver-general-dense.mjs':'./solver-general.mjs');
    assert.ok(geometry.containmentBytes>0);
  }
});
