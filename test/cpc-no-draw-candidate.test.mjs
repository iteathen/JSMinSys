import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareConnect4CpcScratch,evaluateConnect4CpcNonterminal32,CPC_NONE,CPC_EXACT} from '../addons/cpc-connect4.mjs';

test('no-draw candidate leaves residual exhaustion and response bounds unresolved',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  const q=connect4RbaFromMoves([0,1,0,0],{geometry:g,canonical:false}),s=prepareConnect4CpcScratch(g,{frontierResponse:true});
  assert.equal(evaluateConnect4CpcNonterminal32(g,q.words,0,q.basis,0,q.basis.length,s),CPC_NONE);
  assert.deepEqual([...s.interval],[1,3]);
  // Explicit unresolved-state contract: neither player has any residual win.
  // Solver still explores until its retained physical terminal handling closes.
  q.words.fill(0,g.p0Offset,g.p0Offset+2*g.coordWords);
  assert.equal(evaluateConnect4CpcNonterminal32(g,q.words,0,q.basis,0,q.basis.length,s),CPC_NONE);
  assert.deepEqual([...s.interval],[1,3]);
});

test('no-draw candidate retains exact predictive losses',()=>{
  for(const [columns,rows,moves,value] of [
    [5,4,[1,1,2,1,3],3],
    [4,4,[0,0,1,0,0,1,1,1,3],3],
    [4,4,[0,0,0,0,1,1,1,2,1,2,2,2],1],
  ]){
    const g=prepareConnect4RbaGeometry({columns,rows}),q=connect4RbaFromMoves(moves,{geometry:g,canonical:false}),s=prepareConnect4CpcScratch(g);
    assert.equal(evaluateConnect4CpcNonterminal32(g,q.words,0,q.basis,0,q.basis.length,s),CPC_EXACT);
    assert.deepEqual([...s.interval],[value,value]);
  }
});
