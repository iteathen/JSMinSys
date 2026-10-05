import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';
import {connect4RbaClosureDense3CofactorKnownHeight as three,connect4RbaClosureDenseSpanCofactorKnownHeight as span} from '../addons/rba-connect4-coordinate-closure-dense.mjs';
import {connect4RbaSupportCanonicalize} from '../addons/rba-connect4-coordinate-support-reflection.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareConnect4ResidualProofFrontier32} from '../addons/connect4-residual-proof-frontier.mjs';

test('actual closure and reflection publish the exact canonical frontier support handle',()=>{
 let seed=20261054,checked=0,reflections=0;
 const next=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
 for(const [columns,rows] of [[4,3],[3,4],[4,4],[7,6]]){
  const g=prepareConnect4RbaGeometry({columns,rows});
  g.supportBasisPlans=prepareSupportBasisPlans32(g,1073741824,true,true);assert.ok(g.supportBasisPlans);
  const p=prepareConnect4ResidualProofFrontier32(g),profile=prepareConnect4RbaExecutionProfile(g),scratch=prepareConnect4RbaCoordinateScratch(g),
   out=new Uint32Array(g.keyWords),basis=new Uint32Array(g.maxBasis),size=new Uint32Array(1),
   cofactor=g.coordWords===3?three:span;
  for(let walk=0;walk<32;walk++){
   const moves=[];
   for(let rank=0;rank<g.cellCount;rank++){
    const q=connect4RbaFromMoves(moves,{geometry:g});p.initialize(q.words,0);
    const candidates=[];
    for(let c=0;c<columns;c++)if(q.words[c]<rows){
     const term=cofactor(g,profile,q.words,0,q.basis,0,q.basis.length,c,q.words[c],out,0,basis,0,scratch.seen,size,0,scratch.map,scratch.inverse);
     if(term)continue;
     const reflected=connect4RbaSupportCanonicalize(g,profile,out,0,basis,0,size[0],scratch);
     p.child(scratch.map[0],reflected,1);
     let expected=0;for(let x=0;x<columns;x++)expected+=out[x]*g.supportBasisPlans.strides[x];
     assert.equal(p.frames[2],expected);assert.equal(g.supportBasisPlans.sizes[expected],size[0]);
     const physical=q.reflected?g.mirrorColumn[c]:c;candidates.push(physical);
     reflections+=reflected;checked++;
    }
    if(!candidates.length)break;moves.push(candidates[next()%candidates.length]);
   }
  }
 }
 assert.ok(checked>1000);assert.ok(reflections>0);console.log(JSON.stringify({kind:'C54-actual-canonical-support-frame',checked,reflections,seed}));
});
