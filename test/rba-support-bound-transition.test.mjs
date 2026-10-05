import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../addons/rba-connect4-coordinate-support-transition.mjs';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';

test('bound transition factories preserve offsets, tails, terminals and independent geometry contexts',()=>{
 assert.equal(typeof api.prepareConnect4RbaTransitionSpanCofactorKnownHeight,'function');
 const contexts=[];
 for(const [columns,rows] of [[1,4],[4,1],[4,4],[6,4],[2,10],[10,1]]){
  const g=prepareConnect4RbaGeometry({columns,rows}),p=prepareConnect4RbaExecutionProfile(g);
  assert.throws(()=>api.prepareConnect4RbaTransitionSpanCofactorKnownHeight(g),/complete transition plan/);
  g.supportBasisPlans=prepareSupportBasisPlans32(g,32*2**20,true,true,true);
  for(const three of g.coordWords===3?[false,true]:[false])for(const nonWinning of [false,true]){
   const name='connect4RbaTransition'+(three?'3':'Span')+'Cofactor'+(nonWinning?'NonWinning':'')+'KnownHeight',
    fn=api['prepare'+name[0].toUpperCase()+name.slice(1)](g);
   contexts.push({g,p,name,fn,nonWinning});
  }
 }
 let checks=0;
 for(const {g,p,name,fn,nonWinning} of contexts){
  let moves=[];
  for(let ply=0;ply<Math.min(g.cellCount,14);ply++){
   const q=connect4RbaFromMoves(moves,{geometry:g,canonical:false});if(q.words[g.metaOffset]&3)break;
   const legal=[];
   for(let c=0;c<g.columns;c++)if(q.words[c]<g.rows){
    legal.push(c);
    function apply(f){
     const out=new Uint32Array(g.keyWords+8).fill(0xa5a5a5a5),b=new Uint32Array(g.maxBasis+8).fill(0xffffffff),s=prepareConnect4RbaCoordinateScratch(g);
     s.seen.fill(0x81234567);s.inverse.fill(0xffffffff);
     const term=f(g,p,q.words,0,q.basis,0,q.basis.length,c,q.words[c],out,3,b,3,s.seen,s.size,0,s.map,s.inverse);
     assert.equal(out[2],0xa5a5a5a5);assert.equal(out[g.keyWords+3],0xa5a5a5a5);
     assert.ok(s.seen.every(v=>v===0x81234567));assert.ok(s.inverse.every(v=>v===0xffffffff));
     return {term,words:out.slice(3,3+g.keyWords),basis:b.slice(3,3+s.size[0])};
    }
    // The normal authority establishes the nonwinning precondition first.
    const normal=api[name.replace('NonWinning','')],expected=apply(normal);
    if(nonWinning&&[1,3].includes(expected.term))continue;
    assert.deepEqual(apply(fn),expected);checks++;
   }
   if(!legal.length)break;moves.push(legal[ply%legal.length]);
  }
 }
 assert.ok(checks>150);console.log(JSON.stringify({boundTransitionChecks:checks,contexts:contexts.length}));
});
