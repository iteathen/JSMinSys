import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';
import {connect4RbaPreparedCofactorKnownHeight as reference} from '../addons/rba-connect4-coordinate-prepared.mjs';
import * as dense from '../addons/rba-connect4-coordinate-closure-dense.mjs';
import * as prepared from '../addons/rba-connect4-coordinate-closure-prepared.mjs';

test('three-word closures commit each owner lane once without reading interim output',()=>{
 const g=prepareConnect4RbaGeometry({columns:7,rows:6}),p=prepareConnect4RbaExecutionProfile(g);
 assert.equal(g.coordWords,3);
 g.supportBasisPlans=prepareSupportBasisPlans32(g,1024*2**20,true,true);
 let nonterminal=0,wins=0,draws=0;
 // Physical regression fixture only; never linked into solver runtime.
 const gray40=[5,6,6,2,5,3,3,3,5,3,6,5,5,5,6,3,2,2,2,1,3,6,2,6,2,1,0,0,4,4,1,4,4,0,1,1,0,1,4,0];
 for(const moves of [[],[0,1,0,1,0,2],[...gray40,0]]){
  const q=connect4RbaFromMoves(moves,{geometry:g,canonical:false});
  for(const column of [0,3,4,6].filter(c=>q.words[c]<g.rows)){
   function apply(fn,instrument){
    const dst=5,ci=3,target=new Uint32Array(g.keyWords+10).fill(0xa5a5a5a5),
     childBasis=new Uint32Array(g.maxBasis+6).fill(0xffffffff),s=prepareConnect4RbaCoordinateScratch(g),sizes=new Uint32Array(2),
     first=dst+g.p0Offset,last=dst+g.p1Offset+3,counts=new Uint32Array(6);
    let reads=0;
    const index=key=>typeof key==='string'&&/^\d+$/.test(key)?Number(key):-1;
    const proxy=new Proxy(target,{
     get(t,key){const i=index(key);if(i>=first&&i<last)reads++;return Reflect.get(t,key,t);},
     set(t,key,value){const i=index(key);if(i>=first&&i<last)counts[i-first]++;return Reflect.set(t,key,value,t);}
    });
    const term=fn(g,p,q.words,0,q.basis,0,q.basis.length,column,q.words[column],instrument?proxy:target,dst,childBasis,ci,s.seen,sizes,1,s.map,s.inverse);
    assert.equal(target[dst-1],0xa5a5a5a5);assert.equal(target[dst+g.keyWords],0xa5a5a5a5);
    return {term,words:target.slice(dst,dst+g.keyWords),basis:childBasis.slice(ci,ci+sizes[1]),reads,counts};
   }
   const expected=apply(reference,false);
   for(const [kind,module] of [['Dense',dense],['Prepared',prepared]])for(const nonWinning of [false,true]){
    if(nonWinning&&expected.term===3)continue;
    const fn=module['connect4RbaClosure'+kind+'3Cofactor'+(nonWinning?'NonWinning':'')+'KnownHeight'],actual=apply(fn,true);
    assert.deepEqual(actual.words,expected.words);assert.deepEqual(actual.basis,expected.basis);assert.equal(actual.term,expected.term);
    assert.equal(actual.reads,0,'absorption must use local owner accumulators');
    assert.deepEqual(Array.from(actual.counts),[1,1,1,1,1,1],'single final commit or terminal clear');
   }
   if(expected.term===3)wins++;else if(expected.term===2)draws++;else nonterminal++;
  }
 }
 assert.ok(nonterminal>0&&wins>0&&draws>0);
});
