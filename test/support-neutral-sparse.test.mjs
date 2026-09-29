import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch,connect4RbaShapeSubset} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {connect4RbaBasisFromSupport} from '../addons/rba-connect4-coordinate.mjs';
import {prepareSupportNeutralSparse32,projectSupportNeutralSparse32} from '../addons/rba-connect4-support-neutral.mjs';
import {createConnect4RbaExactCache32,probeConnect4RbaExactCache32,storeConnect4RbaExactCache32,prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../addons/rba-connect4-alphabeta.mjs';
import {describe} from '../evidence/isomax-support-neutral-20260929/census.mjs';

const fixtures=JSON.parse(readFileSync(new URL('../evidence/isomax-support-neutral-20260929/census-result.json',import.meta.url))).standard.sparseFixtures;
test('deferred sparse key preserves exact pooled identity across support-local bases',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),prepared=prepareSupportNeutralSparse32(g),scratch=prepareConnect4RbaCoordinateScratch(g);
  const a=new Uint32Array(14),b=new Uint32Array(14);let merges=0;
  for(const moves of fixtures){
    const q=connect4RbaFromMoves(moves,{geometry:g,canonical:false}),d=describe(g,q.words,q.basis);
    assert.equal(projectSupportNeutralSparse32(prepared,q.words,0,q.basis,0,a),1);
    assert.notDeepEqual(a,q.words);
    for(let from=0;from<7;from++)for(let to=0;to<7;to++){
      if(from===to||(d.active&(1<<from))||(d.active&(1<<to))||!q.words[from]||q.words[to]===6)continue;
      const words=q.words.slice(),basis=new Uint32Array(g.maxBasis);words[from]--;words[to]++;
      words.fill(0,8);
      const n=connect4RbaBasisFromSupport(g,words,0,basis,0,scratch.seen);
      let representable=true;
      for(let p=0;p<2;p++)for(const id of d.minima[p]){
        if(!basis.subarray(0,n).includes(id)){representable=false;break;}
        for(let i=0;i<n;i++)if(connect4RbaShapeSubset(g,id,basis[i]))words[(p?11:8)+(i>>>5)]|=1<<(i&31);
      }
      if(!representable)continue;
      assert.equal(describe(g,words,basis.subarray(0,n)).key,d.key);
      if(!projectSupportNeutralSparse32(prepared,words,0,basis,0,b))continue;
      assert.deepEqual(a,b);merges++;
    }
  }
  assert.ok(merges>10);
});
test('sparse cache transport preserves root output, mirrors, and reused depth frames',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),control=prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:1024}),candidate=prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:1024});
  control.neutralColumns=null;let checked=0,projected=false;
  for(const fixture of fixtures)for(const length of [fixture.length-3,fixture.length])for(const mirror of [false,true]){
    const moves=fixture.slice(0,length).map(c=>mirror?6-c:c),root=connect4RbaFromMoves(moves,{geometry:g}),saved=root.words.slice();
    const a=solveConnect4RbaAlphaBeta(root,{state:control,reflected:root.reflected}),b=solveConnect4RbaAlphaBeta(root,{state:candidate,reflected:root.reflected});
    assert.equal(b.value,a.value);assert.equal(b.move,a.move);assert.deepEqual(root.words,saved);
    projected ||= candidate.cacheWords.some(w=>w>=0x80000000);checked++;
  }
  assert.ok(checked>=80);assert.ok(projected,'real recursive path exercised projection');
});
test('sparse projection rejects non-sparse coordinates and keeps full equality on hash collisions',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),p=prepareSupportNeutralSparse32(g),out=new Uint32Array(14);
  const empty=connect4RbaFromMoves([],{geometry:g});
  out.fill(123);
  assert.equal(projectSupportNeutralSparse32(p,empty.words,0,empty.basis,0,out),0);
  assert.equal(out[0],123);
  const q=connect4RbaFromMoves(fixtures[0],{geometry:g,canonical:false});
  assert.equal(projectSupportNeutralSparse32(p,q.words,0,q.basis,0,out),1);
  const cache=createConnect4RbaExactCache32({capacity:1,keyWords:14,geometry:g});
  storeConnect4RbaExactCache32(cache,out,0,2);
  assert.equal(probeConnect4RbaExactCache32(cache,out,0),2);
  const different=out.slice();different[8]^=1;
  assert.equal(probeConnect4RbaExactCache32(cache,different,0),0);
  assert.equal(probeConnect4RbaExactCache32(cache,q.words,0),0);
  assert.equal(prepareSupportNeutralSparse32(prepareConnect4RbaGeometry({columns:4,rows:4})),null);
});
