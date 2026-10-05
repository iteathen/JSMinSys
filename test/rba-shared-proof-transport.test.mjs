import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
const proof=await import('../addons/rba-connect4-shared-proof-cache.mjs').catch(error=>{
 if(error.code==='ERR_MODULE_NOT_FOUND')return {};throw error;
});

test('concurrent proof writers cannot associate another key with a bound',async()=>{
 assert.equal(typeof proof.prepareSharedProofCacheAccess,'function');
 for(const [columns,rows] of [[7,6],[7,5]]){
  const geometry=prepareConnect4RbaGeometry({columns,rows}),
   cache=createConnect4RbaSharedLayoutCache32({capacity:1,keyWords:geometry.keyWords,geometry}),
   first=connect4RbaFromMoves([],{geometry}).words,second=first.slice();second[0]=1;
  cache.proofDomain='absolute-wdl-zero-v1';
  const code=`const {workerData,parentPort}=require('node:worker_threads');
   (async()=>{const m=await import(workerData.url),a=m.prepareSharedProofCacheAccess(workerData.cache);
    for(let i=0;i<12000;i++){a.store(workerData.cache,workerData.key,0,workerData.tag,0);
     const got=a.probe(workerData.cache,workerData.key,0,0);
     if(got!==0&&got!==workerData.tag)throw Error('wrong key/tag '+got);}
    parentPort.postMessage('ok');})().catch(error=>{throw error;});`;
  const workers=[[first,4],[second,5]].map(([key,tag])=>new Worker(code,{eval:true,workerData:{cache,key,tag,url:new URL('../addons/rba-connect4-shared-proof-cache.mjs',import.meta.url).href}}));
  try{
   await Promise.all(workers.map(w=>new Promise((resolve,reject)=>{w.on('error',reject);w.on('exit',code=>code?reject(Error('exit '+code)):resolve());})));
  }finally{await Promise.all(workers.map(w=>w.terminate()));}
 }
});
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {createConnect4RbaSharedLayoutCache32} from '../addons/rba-connect4-shared-exact-cache-layout.mjs';

test('zero-bound transport preserves exact tags and reverses the inequality for owner1',()=>{
 assert.equal(typeof proof.transportConnect4ZeroBound32,'function');
 for(const tag of [0,1,2,3,4,5])for(const mover of [0,1]){
  const absolute=proof.transportConnect4ZeroBound32(tag,mover);
  assert.equal(absolute,tag>3&&mover?9-tag:tag);
  assert.equal(proof.transportConnect4ZeroBound32(absolute,mover),tag);
 }
 // Both players' relative >=0 statements imply opposite absolute inequalities.
 assert.equal(proof.transportConnect4ZeroBound32(4,0),4);
 assert.equal(proof.transportConnect4ZeroBound32(4,1),5);
});

test('proof storage retains exact key comparison, both bound tags and uncounted protocol across dimensions',()=>{
 assert.equal(typeof proof.prepareSharedProofCacheAccess,'function');
 for(const [columns,rows] of [[7,6],[7,5],[4,4]]){
  const geometry=prepareConnect4RbaGeometry({columns,rows}),
   cache=createConnect4RbaSharedLayoutCache32({capacity:1,keyWords:geometry.keyWords,geometry}),
   words=connect4RbaFromMoves([],{geometry}).words,
   other=words.slice();other[0]=1;
  assert.throws(()=>proof.prepareSharedProofCacheAccess(cache),TypeError);
  cache.proofDomain='absolute-wdl-zero-v1';const access=proof.prepareSharedProofCacheAccess(cache);
  for(const tag of [1,2,3,4,5]){
   access.store(cache,words,0,tag,0);
   assert.equal(access.probe(cache,words,0,0),tag);
   assert.equal(access.probe(cache,other,0,0),0);
  }
  assert.deepEqual(Array.from(cache.stats),[0,0,0]);
  cache.entries[0]|=1;
  assert.equal(access.probe(cache,words,0,0),0);
 }
});
