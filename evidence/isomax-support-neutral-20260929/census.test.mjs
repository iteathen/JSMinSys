import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {describe,qualifyGraph,sampleTransitions} from './census.mjs';

test('neutral pooled identity preserves native mapped transitions and WDL on complete 4x4 graph',()=>{
  const result=qualifyGraph(4,4);
  assert.ok(result.states>30000);
  assert.ok(result.extraMerges>0);
  assert.equal(result.transitionMismatches,0);
  assert.equal(result.valueMismatches,0);
  console.log(JSON.stringify(result));
});
test('neutral capacity is retained and sample records generator economics',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  const q=connect4RbaFromMoves([1,0,3,1,1,2,2,2],{geometry:g,canonical:false});
  const d=describe(g,q.words,q.basis);
  assert.ok(d.neutralCapacity>0);
  const r=sampleTransitions(7,6,50);
  assert.ok(r.transitions>500);
  assert.ok(r.insertions>r.transitions);
  assert.equal(r.understatedMasks,0);
});
