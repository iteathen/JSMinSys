import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareConnect4CpcScratch,evaluateConnect4CpcNonterminal32,CPC_NONE,CPC_EXACT} from '../addons/cpc-connect4.mjs';

test('win-only candidate drops predictive loss/bounds and clears stale restrictions',()=>{
  for(const [columns,rows,moves] of [
    [5,4,[1,1,2,1,3]], // opponent double threat, not a mover win
    [4,4,[0,0,1,0,0,1,1,1,3]], // forced loss by support exposure
    [4,4,[0,1,0,0]], // response bound, no current win
  ]){
    const g=prepareConnect4RbaGeometry({columns,rows}),q=connect4RbaFromMoves(moves,{geometry:g,canonical:false}),s=prepareConnect4CpcScratch(g);
    s.forcedColumn[0]=2;s.preemptionCount[0]=2;s.preemptionMask32[0]=7;
    assert.equal(evaluateConnect4CpcNonterminal32(g,q.words,0,q.basis,0,q.basis.length,s),CPC_NONE);
    assert.deepEqual([...s.interval],[1,3]);
    assert.equal(s.forcedColumn[0],-1);assert.equal(s.preemptionCount[0],0);assert.equal(s.preemptionMask32[0],0);
  }
});

test('win-only candidate retains both player immediate wins',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  for(const [moves,value] of [[[0,1,0,1,0,2],3],[[0,1,2,1,2,1,3],1]]){
    const q=connect4RbaFromMoves(moves,{geometry:g,canonical:false}),s=prepareConnect4CpcScratch(g);
    assert.equal(evaluateConnect4CpcNonterminal32(g,q.words,0,q.basis,0,q.basis.length,s),CPC_EXACT);
    assert.deepEqual([...s.interval],[value,value]);
  }
});
