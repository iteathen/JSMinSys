import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {
  prepareConnect4GuardSurvival32,
  loadConnect4GuardSurvivalRoot32,
  proveConnect4GuardSurvival32,
} from '../addons/cpc-connect4-guard-survival.mjs';

const candidate6Moves=[3,3,3,3,3,0,4,5,5,5];
const candidate6OddDefenderMask=98305;

test('NEES guard survival kernel reproduces established candidate6 D15 certificate',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  const root=connect4RbaFromMoves(candidate6Moves,{geometry:g,canonical:false});
  const ctx=prepareConnect4GuardSurvival32({geometry:g,memoCapacity:1<<20});
  loadConnect4GuardSurvivalRoot32(ctx,root.words,0,root.basis,0,root.basis.length);
  assert.equal(proveConnect4GuardSurvival32(ctx,15,candidate6OddDefenderMask),1);
});

test('guard survival kernel rejects non-standard geometry specialization',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  assert.throws(()=>prepareConnect4GuardSurvival32({geometry:g,memoCapacity:16}),/standard 7x6/);
});
