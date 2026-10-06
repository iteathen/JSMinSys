import test from 'node:test';import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareSupportBasisViewScratch32,initializeSupportBasisView32} from '../addons/rba-connect4-support-basis-view.mjs';
import {connect4RbaClosureViewPreparedSpanCofactorKnownHeight} from '../addons/rba-connect4-coordinate-closure-view-prepared.mjs';
import {connect4RbaSupportCanonicalizeView} from '../addons/rba-connect4-coordinate-support-reflection-view.mjs';

test('immutable view preserves the actual sparse removal profile',()=>{
 const g=prepareConnect4RbaGeometry({columns:4,rows:4,specializationBudgetBytes:0});assert.equal(g.removeByCell,null);
 g.supportBasisPlans=prepareSupportBasisPlans32(g,8*2**20,true,true);const p=prepareConnect4RbaExecutionProfile(g),sc=prepareSupportBasisViewScratch32(g),size=new Uint32Array(1),moves=[0,1,2,3,0,1],q=connect4RbaFromMoves(moves,{geometry:g}),bi=initializeSupportBasisView32(g,q.words,0,q.basis,0,q.basis.length);
 for(let c=0;c<4;c++){
 const out=new Uint32Array(g.keyWords),term=connect4RbaClosureViewPreparedSpanCofactorKnownHeight(g,p,q.words,0,g.supportBasisPlans.basis,bi,q.basis.length,c,q.words[c],out,0,g.supportBasisPlans.basis,0,undefined,size,0,sc.map,sc.inverse);
 const physical=q.reflected?3-c:c,expected=connect4RbaFromMoves([...moves,physical],{geometry:g});assert.equal(term,expected.words[g.metaOffset]&3);
 if(!term){connect4RbaSupportCanonicalizeView(g,p,out,0,g.supportBasisPlans.basis,0,size[0],sc);assert.deepEqual(out,expected.words);assert.deepEqual(Array.from(g.supportBasisPlans.basis.subarray(sc.map[0]*g.maxBasis,sc.map[0]*g.maxBasis+size[0])),Array.from(expected.basis));}
 }
});
