import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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

test('actual search nibble decoder preserves every CPC interval and mover direction',()=>{
  const source=readFileSync(new URL('../addons/rba-connect4-alphabeta.mjs',import.meta.url),'utf8');
  const matches=[...source.matchAll(/cpcProof=(0x[0-9a-f]+)>>>\(state\.cpc\.proofMask\[0\]<<2\)/g)];
  assert.equal(matches.length,3,'CPC-only, Four-Front and root each decode at their boundary');
  for(const match of matches)for(const s of states){
    const packed=Number(match[1])>>>(s.mask<<2),lo=packed&3,hi=(packed>>>2)&3;
    assert.deepEqual([lo,hi],s.interval);
    for(const mover of [0,1])assert.deepEqual(
      mover?[2-hi,2-lo]:[lo-2,hi-2],
      mover?[2-s.interval[1],2-s.interval[0]]:[s.interval[0]-2,s.interval[1]-2]);
  }
  assert.equal(byMask.has(0),false,'contradiction is never a valid proof');
  assert.equal(byMask.has(5),false,'non-convex loss-or-win is not a CPC interval');
});

test('CPC scratch carries one exact six-state proof mask',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),s=prepareConnect4CpcScratch(g);
  assert.ok(s.proofMask instanceof Uint8Array);
  assert.equal(s.proofMask.length,1);
  assert.equal('interval' in s,false);
});

test('CPC ledger counts mandatory resets and direct indexed traffic on every exit',()=>{
  const ledger=JSON.parse(readFileSync(new URL('../catalog/addon-cycle-ledger-v0.json',import.meta.url),'utf8'));
  const u=ledger.units.find(u=>u.name==='evaluateConnect4CpcNonterminal32');
  const counts=(op,params)=>u.operations.filter(x=>x.op===op).reduce((n,x)=>n+
    Function(...Object.keys(params),`return (${x.count})`)(...Object.values(params)),0);
  const common={W:3,L:0,P:0,G:0,PR:0,ONE:0,U:0,PM_REF:0,PM_ASSIGN:1,
    PM_EXACT_TEST:0,PM_GATE:0,PM_BOUND_LOAD:0,PM_BOUND_SECOND:0,PM_TACTICAL:0};
  assert.equal(counts('memory.store.u32',common),4,'immediate exact still resets four fields');
  assert.equal(counts('memory.store.u8',common),1);
  const unknown={...common,PM_ASSIGN:0,PM_EXACT_TEST:2,PM_GATE:1,PM_BOUND_LOAD:2,PM_BOUND_SECOND:1,U:1};
  assert.equal(counts('memory.load.u32',unknown),8,'meta, six coordinate words, preemption count');
  assert.equal(counts('memory.store.u32',{...unknown,ONE:1,G:1}),7,'forced action adds three stores');
  assert.equal(counts('memory.store.u32',{...common,PR:1}),8,'advisory reset happens even on early return');
});

test('checked terminal CPC overwrites reused proof and restriction scratch',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
    q=connect4RbaFromMoves([],{geometry:g}),
    s=prepareConnect4CpcScratch(g,{projectedAdvisory:true});
  for(const [value,mask] of [[1,4],[2,2],[3,1]]){
    q.words[g.metaOffset]=value;
    s.proofMask[0]=7;s.forcedColumn[0]=3;
    s.preemptionMask32[0]=15;s.preemptionCount[0]=4;s.precursorCount[0]=2;
    s.projectedCount.fill(2);s.projectedForks.fill(3);
    assert.equal(evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,s),CPC_EXACT);
    assert.equal(s.proofMask[0],mask);
    assert.equal(s.forcedColumn[0],-1);
    assert.equal(s.preemptionMask32[0]|s.preemptionCount[0]|s.precursorCount[0],0);
    assert.deepEqual([...s.projectedCount,...s.projectedForks],[0,0,0,0]);
  }
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
