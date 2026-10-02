// Explicit cold qualification; never imported by solver or default test suite.
import assert from 'node:assert/strict';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import * as tt from '../isomax-lean/shared-cache.mjs';

const capacity=134217728,hash=capacity-1;
const words=Uint32Array.from([3,4,2,5,1,6,0,2,0xabcdef01,0x12345678,17,0x2468abcd,0x76543210,9]);
if(isMainThread){
  const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
  const cache=tt.createConnect4RbaSharedExactCache32({capacity,keyWords:14,geometry});
  const stride=cache.layout?.entryBytes??40;
  assert.equal(cache.entries.byteLength,capacity*stride);
  tt.storeConnect4RbaSharedExactCache32(cache,words,0,2,hash);
  const worker=new Worker(new URL(import.meta.url),{workerData:{cache}});
  const result=await new Promise((resolve,reject)=>{
    worker.once('message',resolve);worker.once('error',reject);
    worker.once('exit',code=>{if(code)reject(Error('worker exit '+code));});
  });
  await worker.terminate();
  assert.equal(result.probed,2);
  assert.equal(tt.probeConnect4RbaSharedExactCache32(cache,words,0,hash),3);
  console.log(JSON.stringify({status:'PASS',node:process.version,v8:process.versions.v8,
    capacity,bytes:cache.entries.byteLength,lastRecordByteOffset:hash*stride,
    parentObservedWorkerStore:true,...result},null,2));
}else{
  const cache=workerData.cache,beforeLength=cache.entries.length,backing=cache.entries.buffer;
  tt.attachConnect4RbaSharedExactCache32(cache);
  assert.equal(cache.entries.buffer,backing);
  assert.equal(cache.entries.length,capacity*(cache.layout?.entryWords??10));
  const probed=tt.probeConnect4RbaSharedExactCache32(cache,words,0,hash);
  tt.storeConnect4RbaSharedExactCache32(cache,words,0,3,hash);
  parentPort.postMessage({beforeLength,attachedLength:cache.entries.length,probed});
}
