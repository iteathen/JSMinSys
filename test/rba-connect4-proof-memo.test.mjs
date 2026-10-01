import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {
  prepareConnect4RbaProofMemo32,
  mixConnect4RbaProofMemoKey32,
  probeConnect4RbaProofMemo32,
  storeConnect4RbaProofMemo32,
} from '../addons/rba-connect4-proof-memo.mjs';

function qFrom(g,moves){
  const q=connect4RbaFromMoves(moves,{geometry:g,canonical:false});
  return {words:q.words,basis:q.basis};
}

test('standard 7x6 proof memo uses exact compact RBA identity plus guard/horizon',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  const memo=prepareConnect4RbaProofMemo32({capacity:32,keyWords:g.keyWords,geometry:g});
  assert.equal(g.keyWords,14);
  assert.equal(memo.compact8,1);
  assert.equal(memo.storedKeyWords,10);

  const q=qFrom(g,[3,3,3,3,3,0,4,5,5,5]);
  const guard=98305,horizon=25;
  const hash=mixConnect4RbaProofMemoKey32(q.words,0,g.keyWords,guard,horizon);
  assert.equal(probeConnect4RbaProofMemo32(memo,q.words,0,guard,horizon,hash),0);
  storeConnect4RbaProofMemo32(memo,q.words,0,guard,horizon,hash,1);
  assert.equal(probeConnect4RbaProofMemo32(memo,q.words,0,guard,horizon,hash),1);

  const guardHash=mixConnect4RbaProofMemoKey32(q.words,0,g.keyWords,guard^1,horizon);
  assert.equal(probeConnect4RbaProofMemo32(memo,q.words,0,guard^1,horizon,guardHash),0);
  const horizonHash=mixConnect4RbaProofMemoKey32(q.words,0,g.keyWords,guard,horizon-2);
  assert.equal(probeConnect4RbaProofMemo32(memo,q.words,0,guard,horizon-2,horizonHash),0);
});

test('direct-map replacement preserves correctness by turning collisions into misses',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  const memo=prepareConnect4RbaProofMemo32({capacity:1,keyWords:g.keyWords,geometry:g});
  const a=qFrom(g,[3,2,3,2]);
  const b=qFrom(g,[3,4,3,4]);
  const guard=1,horizon=9;
  const ha=mixConnect4RbaProofMemoKey32(a.words,0,g.keyWords,guard,horizon);
  const hb=mixConnect4RbaProofMemoKey32(b.words,0,g.keyWords,guard,horizon);

  storeConnect4RbaProofMemo32(memo,a.words,0,guard,horizon,ha,1);
  assert.equal(probeConnect4RbaProofMemo32(memo,a.words,0,guard,horizon,ha),1);
  storeConnect4RbaProofMemo32(memo,b.words,0,guard,horizon,hb,7);
  assert.equal(probeConnect4RbaProofMemo32(memo,b.words,0,guard,horizon,hb),7);
  assert.equal(probeConnect4RbaProofMemo32(memo,a.words,0,guard,horizon,ha),0);
});

test('generic geometry retains full RBA words plus side state',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  const memo=prepareConnect4RbaProofMemo32({capacity:16,keyWords:g.keyWords,geometry:g});
  assert.equal(memo.compact8,0);
  assert.equal(memo.storedKeyWords,g.keyWords+2);

  const q=qFrom(g,[1,2,1,2]);
  const guard=5,horizon=7,value=4;
  const hash=mixConnect4RbaProofMemoKey32(q.words,0,g.keyWords,guard,horizon);
  storeConnect4RbaProofMemo32(memo,q.words,0,guard,horizon,hash,value);
  assert.equal(probeConnect4RbaProofMemo32(memo,q.words,0,guard,horizon,hash),value);
});
