import test from 'node:test';import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareSupportSearchBasisScratch32} from '../addons/rba-connect4-support-search-view.mjs';
import {initializeSupportBasisHandle32} from '../addons/rba-connect4-support-handle-view.mjs';
import * as dense from '../addons/rba-connect4-coordinate-closure-search-view-dense.mjs';
import * as sparse from '../addons/rba-connect4-coordinate-closure-search-view-prepared.mjs';
import {connect4RbaSupportCanonicalizeView} from '../addons/rba-connect4-coordinate-support-reflection-view.mjs';
import {prepareConnect4ResidualProofFrontier32} from '../addons/connect4-residual-proof-frontier.mjs';

test('search view native/span and nested/sibling recursion transport one canonical handle into proof frames',()=>{
 let seed=20261044,checks=0,nested=0,reflections=0;
 const next=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
 for(const [columns,rows,budget] of [[4,3,2097152],[3,4,2097152],[4,4,16777216],[7,5,1073741824],[7,6,1073741824]]){
  const g=prepareConnect4RbaGeometry({columns,rows});g.supportBasisPlans=prepareSupportBasisPlans32(g,budget,true,true);assert.ok(g.supportBasisPlans);
  const original=g.supportBasisPlans.basis,readOnly=new Proxy(original,{set(){assert.fail('shared basis write');},get(t,k){const v=Reflect.get(t,k,t);return typeof v==='function'?v.bind(t):v;}});
  g.supportBasisPlans={...g.supportBasisPlans,basis:readOnly};
  const p=prepareConnect4RbaExecutionProfile(g),frontier=prepareConnect4ResidualProofFrontier32(g),sc=prepareSupportSearchBasisScratch32(g),sizes=new Uint32Array(3),vb=readOnly;
  const fns=[dense.connect4RbaClosureSearchViewDenseSpanCofactorKnownHeight,sparse.connect4RbaClosureSearchViewPreparedSpanCofactorKnownHeight,...(g.coordWords===3?[dense.connect4RbaClosureSearchViewDense3CofactorKnownHeight,sparse.connect4RbaClosureSearchViewPrepared3CofactorKnownHeight]:[])];
  function play(q,handle,c,out,depth,fn){
   const bi=handle*g.maxBasis;
   const term=fn(g,p,q.words,0,vb,bi,q.basis.length,c,q.words[c],out,0,vb,0,undefined,sizes,depth,sc.map,sc.inverse,handle);
   const n=sizes[depth];if(term)return {term};
   const reflected=connect4RbaSupportCanonicalizeView(g,p,out,0,vb,0,n,sc),childHandle=sc.map[0];
   frontier.child(childHandle,0,depth);let expected=0;for(let x=0;x<columns;x++)expected+=out[x]*g.supportBasisPlans.strides[x];
   assert.equal(childHandle,expected);assert.equal(frontier.frames[2*depth],expected,'canonical support must not be reflected twice');
   const ids=vb.subarray(childHandle*g.maxBasis,childHandle*g.maxBasis+n);reflections+=reflected;return {term,reflected,handle:childHandle,bi:childHandle*g.maxBasis,q:{words:out,basis:ids}};
  }
  for(let walk=0;walk<16;walk++){
   const moves=[];
   for(let rank=0;rank<g.cellCount;rank++){
    const q=connect4RbaFromMoves(moves,{geometry:g});if(q.words[g.metaOffset]&3)break;
    const handle=initializeSupportBasisHandle32(g,q.words,0,q.basis,0,q.basis.length),candidates=[];frontier.child(handle,0,0);
    for(let c=0;c<columns;c++)if(q.words[c]<rows){
      const physical=q.reflected?g.mirrorColumn[c]:c,child=connect4RbaFromMoves([...moves,physical],{geometry:g});
      for(const fn of fns){
       const first=play(q,handle,c,new Uint32Array(g.keyWords),1,fn);assert.equal(first.term,child.words[g.metaOffset]&3);checks++;
       if(first.term)continue;
       assert.deepEqual(first.q.words,child.words);assert.deepEqual(Array.from(first.q.basis),Array.from(child.basis));
       let tried=0;
       for(let c2=0;c2<columns&&tried<2;c2++)if(first.q.words[c2]<rows){
        const physical2=(q.reflected^first.reflected)?g.mirrorColumn[c2]:c2,expected=connect4RbaFromMoves([...moves,physical,physical2],{geometry:g});
        const second=play(first.q,first.handle,c2,new Uint32Array(g.keyWords),2,fn);assert.equal(second.term,expected.words[g.metaOffset]&3);
        if(!second.term){assert.deepEqual(second.q.words,expected.words);assert.deepEqual(Array.from(second.q.basis),Array.from(expected.basis));}
        tried++;nested++;
       }
       // Nested scratch reuse must not alter the parent's row offset argument.
       const again=play(q,handle,c,new Uint32Array(g.keyWords),1,fn);assert.deepEqual(again.q.words,child.words);assert.equal(again.bi,first.bi);
      }
      if(!(child.words[g.metaOffset]&3))candidates.push(physical);
    }
    if(!candidates.length)break;moves.push(candidates[next()%candidates.length]);
   }
  }
 }
 assert.ok(checks>1000&&nested>1000&&reflections>0);console.log(JSON.stringify({kind:'C64-search-recursion-canonical-proof-frame',checks,nested,reflections,seed}));
});
