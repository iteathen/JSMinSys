import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../addons/rba-connect4-alphabeta.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';

test('live-line-only path has no CPC action restrictions, center order or eager sorting',()=>{
  const s=readFileSync(new URL('../addons/rba-connect4-alphabeta.mjs',import.meta.url),'utf8');
  const hot=s.slice(s.indexOf('function searchCpcOnly('),s.indexOf('function search(state,'));
  const root=s.slice(s.indexOf('export function solveConnect4RbaAlphaBeta('));
  for(const text of [hot,root])for(const forbidden of ['forcedColumn','preemptionCount','preemptionMask','actionMask','actionOrder','moveOrder','priorScore'])
    assert.equal(text.includes(forbidden),false,forbidden);
  assert.equal(s.includes('orderOffset'),false);
  const worker=readFileSync(new URL('../addons/rba-connect4-lazy-smp-worker.mjs',import.meta.url),'utf8');
  assert.equal(worker.includes('orderOffset'),false);
});

test('lazy live-line scores have independent preallocated depth storage',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),state=prepareConnect4RbaAlphaBeta({geometry:g});
  assert.equal(state.moveScores.length,g.cellCount+1);
  assert.ok(state.moveScores[0] instanceof Int32Array);
  state.moveScores[0][0]=71;state.moveScores[1][0]=99;
  assert.equal(state.moveScores[0][0],71);
  assert.equal('moveOrder' in state,false);assert.equal('actionOrder' in state,false);
  const q=connect4RbaFromMoves([],{geometry:g});
  assert.equal(solveConnect4RbaAlphaBeta(q,{state,reflected:q.reflected}).move,0);
});
