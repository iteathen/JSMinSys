import test from 'node:test';
import assert from 'node:assert/strict';

import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta,RBA_AB_CPC_ONLY} from '../addons/rba-connect4-alphabeta.mjs';
import * as cpc from '../addons/cpc-connect4.mjs';
const {evaluateConnect4CpcWin32}=cpc;

function moves(sequence){
  return Array.from(sequence, ch => Number(ch)-1);
}

test('CPC proves a whole-reservoir response-parity win without WDL side channels',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  // P1 has just moved. P0 is to move, so P1 is the response controller.
  // The certificate must prove only P1's forced win from the remaining event
  // reservoir; no draw/loss/bound/restriction result is part of this API.
  const q=connect4RbaFromMoves(moves('24447434'),{geometry:g,canonical:false});
  assert.equal((q.words[g.metaOffset]>>>2)&1,0);
  assert.equal(
    evaluateConnect4CpcWin32(g,q.words,0,q.basis,0,q.basis.length,1),
    1,
  );
});

test('CPC leaves an unclosed reservoir unresolved',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  const q=connect4RbaFromMoves([],{geometry:g,canonical:false});
  assert.equal(
    evaluateConnect4CpcWin32(g,q.words,0,q.basis,0,q.basis.length,1),
    0,
  );
});

test('CPC module surface is win-only rather than WDL/bound/restriction closure',()=>{
  for(const name of [
    'CPC_EXACT','CPC_BOUND','CPC_RESTRICT',
    'evaluateConnect4Cpc32','evaluateConnect4CpcNonterminal32',
    'prepareConnect4CpcScratch',
  ]) assert.equal(name in cpc,false,name);
});

test('CPC does not promote a proved no-win bound into a win',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  // Historical long-range pairing proves P0 cannot win here, but the exact
  // position is a draw. Win-only CPC must remain unresolved for the prior mover.
  const q=connect4RbaFromMoves([0,1,0,0],{geometry:g,canonical:false});
  assert.equal(
    evaluateConnect4CpcWin32(g,q.words,0,q.basis,0,q.basis.length,1),
    0,
  );
});

test('Negamax consumes CPC win closure as a player-relative exact win',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  const q=connect4RbaFromMoves(moves('2444743'),{geometry:g});
  const state=prepareConnect4RbaAlphaBeta({
    geometry:g,
    mode:RBA_AB_CPC_ONLY,
    cacheCapacity:65536,
  });
  const result=solveConnect4RbaAlphaBeta(q,{state,reflected:q.reflected});
  assert.equal(result.value,1);
  assert.ok(result.metrics.cpcWins>0,result.metrics);
});

test('CPC reservoir proof has no arbitrary standard-width cap',()=>{
  const g=prepareConnect4RbaGeometry({columns:8,rows:4,specializationBudgetBytes:0});
  const words=new Uint32Array(g.keyWords);
  const basis=new Uint32Array([8]); // singleton at row 1, column 0
  words[g.metaOffset]=0;            // P0 to move; P1 is the response controller
  words[g.p1Offset]=1;              // P1 residual {cell 8} is active
  assert.equal(
    evaluateConnect4CpcWin32(g,words,0,basis,0,1,1),
    1,
  );
});
