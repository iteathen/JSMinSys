import test from 'node:test';
import assert from 'node:assert/strict';

import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {evaluateConnect4CpcWin32} from '../addons/cpc-connect4.mjs';

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
