import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {evaluateConnect4RankLocalLanding32} from '../addons/connect4-rank-local-presearch.mjs';

const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
test('rank-local history requires an indexed array or typed array',()=>{
  for(const moves of [new DataView(new ArrayBuffer(4)),{},null,'3'])
    assert.throws(()=>evaluateConnect4RankLocalLanding32(moves,{geometry}),TypeError);
  const expected=evaluateConnect4RankLocalLanding32([3,0],{geometry});
  for(const moves of [new Uint8Array([3,0]),new Int32Array([3,0]),new Float64Array([3,0])])
    assert.deepEqual(evaluateConnect4RankLocalLanding32(moves,{geometry}),expected);
});
test('rank-local history rejects lengths beyond board capacity before indexing',()=>{
  const moves=new Array(geometry.cellCount+1);
  Object.defineProperty(moves,'0',{get(){throw Error('history was indexed');}});
  assert.throws(()=>evaluateConnect4RankLocalLanding32(moves,{geometry}),RangeError);
});
