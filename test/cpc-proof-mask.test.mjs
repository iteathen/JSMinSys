import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {
  prepareConnect4CpcScratch,evaluateConnect4Cpc32,
  CPC_NONE,CPC_EXACT,CPC_BOUND,
} from '../addons/cpc-connect4.mjs';

const states=[
  {name:'EXACT_WIN',mask:1,interval:[3,3]},
  {name:'EXACT_DRAW',mask:2,interval:[2,2]},
  {name:'DRAW_OR_WIN',mask:3,interval:[2,3]},
  {name:'EXACT_LOSS',mask:4,interval:[1,1]},
  {name:'LOSS_OR_DRAW',mask:6,interval:[1,2]},
  {name:'UNKNOWN',mask:7,interval:[1,3]},
];
const byMask=new Map(states.map(x=>[x.mask,x]));
function intervalIntersection(a,b){
  const lo=Math.max(a[0],b[0]),hi=Math.min(a[1],b[1]);
  return lo<=hi?[lo,hi]:null;
}

test('CPC scratch carries one exact six-state proof mask',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),s=prepareConnect4CpcScratch(g);
  assert.ok(s.proofMask instanceof Uint8Array);
  assert.equal(s.proofMask.length,1);
  assert.equal('interval' in s,false);
});

test('six-state mask AND is exactly endpoint intersection',()=>{
  for(const a of states)for(const b of states){
    const intersection=a.mask&b.mask,expected=intervalIntersection(a.interval,b.interval);
    if(!expected){
      assert.equal(intersection,0,`${a.name} & ${b.name}`);
      continue;
    }
    const actual=byMask.get(intersection);
    assert.ok(actual,`unexpected nonempty mask ${intersection}`);
    assert.deepEqual(actual.interval,expected,`${a.name} & ${b.name}`);
  }
});

test('CPC proof mask preserves representative exact/bound/unknown facts',()=>{
  {
    const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
      q=connect4RbaFromMoves([0,1,0,1],{geometry:g,canonical:false}),
      s=prepareConnect4CpcScratch(g),
      kind=evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,s);
    assert.ok([CPC_NONE,CPC_BOUND,CPC_EXACT].includes(kind));
    assert.ok(byMask.has(s.proofMask[0]));
  }

  {
    const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
      q=connect4RbaFromMoves([0,1,0,1,0,1],{geometry:g,canonical:false}),
      s=prepareConnect4CpcScratch(g);
    const kind=evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,s);
    assert.equal(kind,CPC_EXACT);
    assert.equal(s.proofMask[0],1,'P0 exact win is mask 001');
  }

  {
    const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
      q=connect4RbaFromMoves([0,1,0,1,2,1],{geometry:g,canonical:false}),
      s=prepareConnect4CpcScratch(g);
    evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,s);
    assert.ok(byMask.has(s.proofMask[0]));
  }
});
