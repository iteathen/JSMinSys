import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,connect4RbaShapeSubset} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../experiments/isomax-lean/profile-supersets.mjs';
import {prepareConnect4RbaExecutionProfile as prepareMasks} from '../experiments/isomax-lean/profile-masks.mjs';
import {prepareLeanExecutionProfile} from '../experiments/isomax-lean/execution-profile.mjs';
import {runLazySmpConnect4Rba32} from '../experiments/isomax-lean/host.mjs';
test('standard execution compiles exactly the strict superset relation before search',()=>{
  for(const specializationBudgetBytes of [0,2097152]){
    const g=prepareConnect4RbaGeometry({columns:7,rows:6,specializationBudgetBytes});
    const {supersetOffsets:offsets,supersetIds:ids}=prepareConnect4RbaExecutionProfile(g);
    assert.ok(offsets instanceof Uint32Array,'compiled offsets required');
    assert.ok(ids instanceof Uint16Array);
    assert.equal(offsets.byteLength+ids.byteLength,8348);
    for(let a=0;a<g.shapeCount;a++){
      const expected=[];
      for(let b=0;b<g.shapeCount;b++)if(a!==b&&connect4RbaShapeSubset(g,a,b))expected.push(b);
      assert.deepEqual([...ids.subarray(offsets[a],offsets[a+1])],expected);
    }
  }
});

test('mask-only profile compiles exact sets and cold dispatch preserves sparse geometry',async()=>{
  for(const specializationBudgetBytes of [0,2097152]){
    const g=prepareConnect4RbaGeometry({columns:7,rows:6,specializationBudgetBytes});
    const p=prepareMasks(g);
    assert.equal(p.supersetIds,undefined);assert.equal(p.supersetOffsets,undefined);
    for(let a=0;a<625;a++){
      const actual=[];
      for(let i=p.supersetWordOffsets[a];i<p.supersetWordOffsets[a+1];i++)
        for(let bit=0;bit<32;bit++)if(p.supersetMasks[i]&(1<<bit))actual.push(p.supersetWords[i]*32+bit);
      const expected=[];for(let b=0;b<625;b++)if(a!==b&&connect4RbaShapeSubset(g,a,b))expected.push(b);
      assert.deepEqual(actual,expected);
    }
    assert.equal(prepareLeanExecutionProfile(g).solver,specializationBudgetBytes?'./solver-dense.mjs':'./solver.mjs');
    const r=await runLazySmpConnect4Rba32([...('1320461024522311')].map(Number),{
      geometry:g,workers:2,sharedCacheCapacity:4096,localCacheCapacity:4096,timeoutMs:10000});
    assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,-1);assert.equal(r.cleanup,true);
  }
});
