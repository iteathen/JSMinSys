import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,connect4RbaShapeSubset} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../experiments/isomax-lean/profile-supersets.mjs';
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
