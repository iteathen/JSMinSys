import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import * as cacheApi from '../addons/rba-connect4-shared-exact-cache-layout.mjs';
import {Worker} from 'node:worker_threads';
const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
test('banked compact32 keeps distinct global slots, exact keys and proof tags',()=>{
 const cache=cacheApi.createConnect4RbaSharedLayoutCache32({capacity:16,bankCapacity:8,keyWords:geometry.keyWords,geometry});
 assert.equal(cache.banks?.length,2);
 assert.equal(cache.layout.entryBytes,32);
 const access=cacheApi.prepareSharedCacheAccess(cache),first=connect4RbaFromMoves([],{geometry}).words,
   second=first.slice();second[0]=1;
 access.store(cache,first,0,4,0);access.store(cache,second,0,5,8);
 assert.equal(access.probe(cache,first,0,0),4);
 assert.equal(access.probe(cache,second,0,8),5);
 assert.equal(access.probe(cache,second,0,0),0);
 assert.equal(access.probe(cache,first,0,8),0);
 for(let lane=0;lane<first.length;lane++){
  const changed=first.slice();changed[lane]^=1;
  assert.equal(access.probe(cache,changed,0,0),0,`exact lane ${lane}`);
 }
 access.store(cache,second,0,3,16);
 assert.equal(access.probe(cache,first,0,0),0);
 assert.equal(access.probe(cache,second,0,0),3);
 assert.deepEqual(Array.from(cache.stats),[0,0,0]);
 const clone=structuredClone(cache);
 cacheApi.attachConnect4RbaSharedLayoutCache32(clone);
 assert.equal(cacheApi.prepareSharedCacheAccess(clone).probe(clone,second,0,8),5);
 assert.equal(clone.banks[0].entries.buffer.byteLength,256);
});
test('bank attachment rejects aliases, inconsistent mapping and malformed buffers',()=>{
 const make=()=>cacheApi.createConnect4RbaSharedLayoutCache32({capacity:16,bankCapacity:8,keyWords:geometry.keyWords,geometry});
 for(const corrupt of [c=>c.bankShift++,c=>c.bankMask=0,c=>c.banks[1]=c.banks[0],c=>c.banks[0].entries=new Uint32Array(new SharedArrayBuffer(4))]){
  const cache=make();assert.equal(cache.banks?.length,2);corrupt(cache);
  assert.throws(()=>cacheApi.attachConnect4RbaSharedLayoutCache32(cache),RangeError);
 }
});
test('concurrent banked writers never return a value for a different exact key',async()=>{
 const cache=cacheApi.createConnect4RbaSharedLayoutCache32({capacity:16,bankCapacity:8,keyWords:geometry.keyWords,geometry}),
  first=connect4RbaFromMoves([],{geometry}).words,keys=[first,first.slice(),first.slice()];keys[1][0]=1;keys[2][0]=2;
 const code=`const {workerData,parentPort}=require('node:worker_threads');
 (async()=>{const m=await import(workerData.url),c=m.attachConnect4RbaSharedLayoutCache32(workerData.cache),a=m.prepareSharedCacheAccess(c);
 for(let i=0;i<12000;i++){const n=(i+workerData.id)%3,k=workerData.keys[n],h=(i&1)*8;
 a.store(c,k,0,n+1,h);const v=a.probe(c,k,0,h);if(v!==0&&v!==n+1)throw Error('cross-key value '+v);}
 parentPort.postMessage('ok');})().catch(e=>{throw e;});`;
 const workers=[0,1].map(id=>new Worker(code,{eval:true,workerData:{id,cache,keys,url:new URL('../addons/rba-connect4-shared-exact-cache-layout.mjs',import.meta.url).href}}));
 try{await Promise.all(workers.map(worker=>new Promise((resolve,reject)=>{worker.on('error',reject);worker.on('exit',status=>status?reject(Error('worker exit '+status)):resolve());})));}
 finally{await Promise.all(workers.map(worker=>worker.terminate()));}
 assert.deepEqual(Array.from(cache.stats),[0,0,0]);
});
test('prepared host initializes banked TT before search and joins all workers',async()=>{
 const {prepareLazySmpConnect4Rba32}=await import('../addons/rba-connect4-prepared-session-host.mjs'),
  app=await prepareLazySmpConnect4Rba32({geometry,workers:2,sharedCacheLayout:'native',sharedCacheCapacity:16,
    sharedBankCapacity:8,localCacheCapacity:16,localCacheLayout:'native',sharedProofBounds:true});
 try{assert.equal(app.state().readyWorkers,2);assert.equal(app.state().searchStarted,false);}
 finally{await app.close();}
 assert.equal(app.state().workersExited,2);assert.equal(app.state().cleanup,true);
});
