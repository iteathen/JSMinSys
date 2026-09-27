import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta,RBA_AB_CPC_ONLY} from '../addons/rba-connect4-alphabeta.mjs';
import {prepareConnect4RbaCofactorPlanCache32} from '../addons/rba-connect4-coordinate.mjs';

test('support-derived cofactor plans preserve exact search and deterministic work',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  const moves=Array.from('45461667',ch=>ch.charCodeAt(0)-49);
  const root=connect4RbaFromMoves(moves,{geometry:g});
  const control=prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_ONLY,cacheCapacity:65536});
  const planned=prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_ONLY,cacheCapacity:65536});
  const planCache=prepareConnect4RbaCofactorPlanCache32(g,{capacity:32768});
  planned.profile.cofactorPlanCache=planCache;

  const a=solveConnect4RbaAlphaBeta(root,{state:control,reflected:root.reflected});
  const b=solveConnect4RbaAlphaBeta(root,{state:planned,reflected:root.reflected});
  assert.deepEqual({value:b.value,relative:b.relative,move:b.move,metrics:b.metrics},
    {value:a.value,relative:a.relative,move:a.move,metrics:a.metrics});
  assert.ok(planCache.count>1000,'fixture must populate many support plans');
  const count=planCache.count;
  const c=solveConnect4RbaAlphaBeta(root,{state:planned,reflected:root.reflected});
  assert.deepEqual({value:c.value,relative:c.relative,move:c.move,metrics:c.metrics},
    {value:a.value,relative:a.relative,move:a.move,metrics:a.metrics});
  assert.equal(planCache.count,count,'same deterministic search should need no new support plans');
});

test('cofactor plan cache derives carrier dimensions from configured geometry',()=>{
  const g4=prepareConnect4RbaGeometry({columns:4,rows:4});
  const c4=prepareConnect4RbaCofactorPlanCache32(g4,{capacity:8});
  assert.equal(c4.planByKey.length,(g4.rows+1)**g4.columns*g4.columns);
  assert.equal(c4.stride,g4.maxBasis);assert.equal(c4.words,g4.coordWords);
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  assert.throws(()=>prepareConnect4RbaCofactorPlanCache32(g,{capacity:0}),/capacity/);
  assert.throws(()=>prepareConnect4RbaCofactorPlanCache32(g,{capacity:262145}),/capacity/);
  assert.throws(()=>prepareConnect4RbaCofactorPlanCache32(g,{capacity:8,maxKeyCount:10}),/key space/);
});
