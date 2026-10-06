import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import * as reference from '../addons/rba-connect4-shared-exact-cache.mjs';
import * as candidate from '../addons/rba-connect4-shared-exact-cache-layout.mjs';

const geometries=[[7,6],[7,5],[4,4],[33,1],[1,1]].map(([columns,rows])=>prepareConnect4RbaGeometry({columns,rows}));
function make(geometry,capacity=1){return candidate.createConnect4RbaSharedLayoutCache32({capacity,keyWords:geometry.keyWords,geometry});}

test('layout preserves exact semantic equality at forced collisions and nonzero offsets',()=>{
 for(const geometry of geometries){
  const cache=make(geometry),old=reference.createConnect4RbaSharedExactCache32({capacity:1,keyWords:geometry.keyWords,geometry}),
   access=candidate.prepareSharedCacheAccess(cache),root=connect4RbaFromMoves([],{geometry}),offset=3,
   words=new Uint32Array(geometry.keyWords+offset+2);
  words.set(root.words,offset);
  access.store(cache,words,offset,3,0);reference.storeConnect4RbaSharedExactCache32(old,words,offset,3,0);
  assert.equal(access.probe(cache,words,offset,0),3);
  for(let w=0;w<geometry.keyWords;w++){
   const changed=words.slice();changed[offset+w]^=1;
   assert.equal(access.probe(cache,changed,offset,0),reference.probeConnect4RbaSharedExactCache32(old,changed,offset,0),`${geometry.columns}x${geometry.rows} lane ${w}`);
   assert.equal(access.probe(cache,changed,offset,0),0);
  }
  access.store(cache,words,offset,2,0);assert.equal(access.probe(cache,words,offset,0),2);
 }
});

test('public layout APIs preserve optional full-q locator and no-geometry full-span identity',()=>{
 for(const [geometry,keyWords] of [[null,2],[null,14],...geometries.map(g=>[g,g.keyWords])]){
  const cache=candidate.createConnect4RbaSharedLayoutCache32({capacity:8,keyWords,geometry}),
   words=geometry?connect4RbaFromMoves([],{geometry}).words:Uint32Array.from({length:keyWords},(_,i)=>0x80000000+i);
  assert.equal(candidate.probeConnect4RbaSharedLayoutCache32(cache,words,0),0);
  assert.equal(candidate.storeConnect4RbaSharedLayoutCache32(cache,words,0,1),1);
  assert.equal(candidate.probeConnect4RbaSharedLayoutCache32(cache,words,0),1);
  assert.deepEqual(Array.from(cache.stats),[1,1,0]);
 }
});

test('uncounted binding keeps reporting untouched while counted busy writes are reported',()=>{
 for(const geometry of geometries){
  const cache=make(geometry),words=connect4RbaFromMoves([],{geometry}).words,access=candidate.prepareSharedCacheAccess(cache);
  cache.stats.set([11,22,33]);access.store(cache,words,0,3,0);assert.equal(access.probe(cache,words,0,0),3);
  assert.deepEqual(Array.from(cache.stats),[11,22,33]);
  cache.entries[0]|=1;const before=cache.entries.slice();
  assert.equal(candidate.storeConnect4RbaSharedLayoutCache32(cache,words,0,2,0),2);
  assert.equal(access.probe(cache,words,0,0),0);
  assert.deepEqual(cache.entries,before);assert.deepEqual(Array.from(cache.stats),[11,22,34]);
 }
});

test('zero sequence after rollover remains a miss and later publication restores visibility',()=>{
 for(const geometry of geometries){
  const cache=make(geometry),words=connect4RbaFromMoves([],{geometry}).words,access=candidate.prepareSharedCacheAccess(cache);
  cache.entries[0]=0xfffffffe;access.store(cache,words,0,3,0);
  assert.equal(cache.entries[0],0);assert.equal(access.probe(cache,words,0,0),0);
  access.store(cache,words,0,2,0);assert.equal(access.probe(cache,words,0,0),2);
 }
});

test('attachment repairs cloned/truncated views without copying and rejects wrong backing',()=>{
 for(const geometry of geometries){
  const cache=make(geometry,4),words=connect4RbaFromMoves([],{geometry}).words;
  candidate.prepareSharedCacheAccess(cache).store(cache,words,0,3,2);
  const cloned=structuredClone(cache),buffer=cloned.entries.buffer;cloned.entries=new Uint32Array(buffer,0,0);
  candidate.attachConnect4RbaSharedLayoutCache32(cloned);
  assert.equal(cloned.entries.buffer,buffer);assert.equal(candidate.prepareSharedCacheAccess(cloned).probe(cloned,words,0,2),3);
  candidate.prepareSharedCacheAccess(cloned).store(cloned,words,0,2,2);
  assert.equal(candidate.prepareSharedCacheAccess(cache).probe(cache,words,0,2),2);
  cloned.entries=new Uint32Array(new SharedArrayBuffer(4));assert.throws(()=>candidate.attachConnect4RbaSharedLayoutCache32(cloned),RangeError);
 }
});

test('native heights preserve both sides of uint8 and uint16 field boundaries',()=>{
 for(const rows of [255,256,65535,65536]){
  const geometry={columns:2,rows,coordWords:1,metaOffset:2,p0Offset:3,p1Offset:4,keyWords:5},cache=make(geometry),
   words=Uint32Array.from([rows,rows-1,3,0xffffffff,0x80000000]),access=candidate.prepareSharedCacheAccess(cache);
  access.store(cache,words,0,3,0);assert.equal(access.probe(cache,words,0,0),3);
  const changed=words.slice();changed[0]=0;assert.equal(access.probe(cache,changed,0,0),0);
 }
});

test('layout sizing rejects unsafe or aliased capacities before allocating',()=>{
 const geometry=geometries[0];
 for(const capacity of [0,-1,3,2**32,2**32+1,2**32+2,Number.MAX_SAFE_INTEGER,Infinity,1.5])
  assert.throws(()=>make(geometry,capacity),RangeError);
 assert.throws(()=>candidate.createConnect4RbaSharedLayoutCache32({capacity:1,keyWords:2**32}),RangeError);
});

test('attachment rejects malformed cloned layout offsets before permitting overlapping atomic fields',()=>{
 for(const geometry of [geometries[0],geometries[1],null]){
  const cache=candidate.createConnect4RbaSharedLayoutCache32({capacity:1,keyWords:geometry?.keyWords??2,geometry});
  const corrupt=structuredClone(cache);
  corrupt.layout={...corrupt.layout,...(geometry===geometries[0]?{entryWords:9,entryBytes:36}:
    geometry?{coordinateOffset:0}:{keyWords:1})};
  assert.throws(()=>candidate.attachConnect4RbaSharedLayoutCache32(corrupt),RangeError);
 }
});

test('concurrent compact/direct/full-span writers never return another exact key value',async()=>{
 for(const geometry of [geometries[0],geometries[1],null]){
  for(const heldLock of [false,true]){
  const keyWords=geometry?.keyWords??2,cache=candidate.createConnect4RbaSharedLayoutCache32({capacity:1,keyWords,geometry}),
   first=geometry?connect4RbaFromMoves([],{geometry}).words:Uint32Array.of(0x80000000,0xffffffff),
   keys=[first,first.slice(),first.slice()];keys[1][0]=1;keys[2][0]=2;
  // A competing publication may own this row for the entire reader lifetime.
  // That legal scheduling case produces only misses, without wrong-key values.
  if(heldLock)Atomics.store(cache.entries,0,1);
  const code=`const {parentPort,workerData}=require('node:worker_threads');
   (async()=>{const m=await import(workerData.url),cache=m.attachConnect4RbaSharedLayoutCache32(workerData.cache),a=m.prepareSharedCacheAccess(cache);
    let hits=0;for(let i=0;i<12000;i++){const n=(i+workerData.id)%3,k=workerData.keys[n];a.store(cache,k,0,n+1,0);
     const got=a.probe(cache,k,0,0);if(got!==0&&got!==n+1)throw Error('cross-key value '+got);if(got)hits++;}
    parentPort.postMessage(hits);})().catch(e=>{throw e;});`;
  const workers=[0,1].map(id=>new Worker(code,{eval:true,workerData:{id,cache,keys,url:new URL('../addons/rba-connect4-shared-exact-cache-layout.mjs',import.meta.url).href}}));
  try{
   const hits=await Promise.all(workers.map(w=>new Promise((resolve,reject)=>{let n;w.on('message',v=>{n=v;});w.on('error',reject);w.on('exit',code=>code?reject(Error('worker exit '+code)):resolve(n));})));
   assert.ok(hits.every(n=>Number.isInteger(n)&&n>=0));
   if(heldLock)assert.deepEqual(hits,[0,0],'a continuously owned row must remain a miss');
   if(heldLock)Atomics.store(cache.entries,0,0);
   const access=candidate.prepareSharedCacheAccess(cache);
   for(let n=0;n<keys.length;n++){
    access.store(cache,keys[n],0,n+1,0);assert.equal(access.probe(cache,keys[n],0,0),n+1);
    for(let other=0;other<keys.length;other++)if(other!==n)assert.equal(access.probe(cache,keys[other],0,0),0,'quiescent row cannot alias another exact key');
   }
  }finally{await Promise.all(workers.map(w=>w.terminate()));}
  }
 }
});
