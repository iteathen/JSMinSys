import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {compactSupportProfile8,compactTailProfile8} from '../addons/rba-connect4-shared-exact-cache.mjs';
import {transportConnect4ZeroBound32} from '../addons/rba-connect4-shared-proof-cache.mjs';

for(const center of [false,true])for(const native of [false,true])test(`actual proof view cache reuses mover, center=${center} native=${native}`,()=>{
 const file='rba-connect4-lazy-smp-worker-minimal-views'+(center?'-center':'')+'-proofs'+(native?'-local32':'')+'.mjs',s=readFileSync(new URL('../addons/'+file,import.meta.url),'utf8');
 const g=prepareConnect4RbaGeometry({columns:native?7:4,rows:native?6:3}),slot=1,hash=1;
 function body(name,next,ctx){const a=s.indexOf('function '+name+'('),b=s.indexOf('\nfunction '+next+'(',a);assert.ok(a>=0&&b>a);return runInNewContext('('+s.slice(a,b).trim()+')',ctx);}
 for(const mover of [0,1]){
  const q=connect4RbaFromMoves(mover?[0]:[],{geometry:g}),support=native?compactSupportProfile8(q.words,0):0,tail=native?compactTailProfile8(q.words,0):0;
  assert.equal((q.words[g.metaOffset]>>>2)&1,mover);
  const guarded=new Proxy(q.words,{get(t,k){if(k===String(g.metaOffset))assert.fail('redundant metadata read');return Reflect.get(t,k,t);}});
  for(const tag of [1,2,3,4,5]){
   const promoted=[],published=[],localValues=new Uint8Array(4),localKeys=new Uint32Array(32),ctx={g,words:guarded,localValues,localKeys,shared:{},sharedSampleBits:0,
    localKeyMatches:()=>true,sharedProbe:()=>tag,storeLocalEntry:(_slot,_src,v)=>promoted.push(v),sharedStore:(_cache,_words,_src,v)=>published.push(v),frontStore:()=>{},transportConnect4ZeroBound32};
   const probe=body('probeCache','storeExact',ctx),args=native?[0,hash,slot,support,tail,mover]:[0,hash,slot,mover];
   assert.equal(probe(...args),transportConnect4ZeroBound32(tag,mover));assert.deepEqual(promoted,[transportConnect4ZeroBound32(tag,mover)]);
   ctx.sharedSampleBits=hash;promoted.length=0;assert.equal(probe(...args),0);assert.equal(promoted.length,0);
   ctx.sharedSampleBits=0;
   const bound=body('storeBound','negamax',ctx);
   for(const v of [4,5]){
    published.length=0;promoted.length=0;localValues[slot]=0;localKeys[slot*8]=0;
    assert.equal(bound(0,hash,slot,v,1,mover,support,tail),v);assert.deepEqual(published,[transportConnect4ZeroBound32(v,mover)]);assert.deepEqual(promoted,[v]);
   }
   localValues[slot]=4;localKeys[slot*8]=4;published.length=0;promoted.length=0;
   assert.equal(bound(0,hash,slot,5,1,mover,support,tail),2);assert.deepEqual(published,[]);assert.deepEqual(promoted,[2]);
  }
 }
});
