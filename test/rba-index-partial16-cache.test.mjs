import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {mixSpan32Locator32} from '../src/widekey32.mjs';
const g=prepareConnect4RbaGeometry({columns:7,rows:6}),grayMoves=[5,6,6,2,5,3,3,3,5,3,6,5,5,5,6,3,2,2,2,1,3,6,2,6,2,1,0,0,4,4,1,4,4,0,1,1,0,1,4,0];
test('narrow16 exact index-partial keys reject ineligible residual words',async()=>{
 const api=await import('../addons/rba-connect4-index-partial-cache.mjs');
 assert.equal(typeof api.probeIndexPartial16Shared32,'function');
 const cache=api.createIndexPartialCache32({geometry:g,capacity:8,shared:true,kind:'partial16'}),
  q=connect4RbaFromMoves(grayMoves,{geometry:g}).words,hash=mixSpan32Locator32(q,0,14);
 assert.equal(cache.entryBytes,16);assert.ok(api.packIndexPartial16Support32(q,0)>=0);
 for(let tag=1;tag<=5;tag++){api.storeIndexPartial16Shared32(cache,q,0,tag,hash);assert.equal(api.probeIndexPartial16Shared32(cache,q,0,hash),tag);}
 for(const lane of [9,10,12,13]){
  const outside=q.slice();outside[lane]=1;const h=mixSpan32Locator32(outside,0,14),before=Array.from(cache.entries);
  assert.equal(api.packIndexPartial16Support32(outside,0),-1);
  assert.equal(api.probeIndexPartial16Shared32(cache,outside,0,h),0);
  api.storeIndexPartial16Shared32(cache,outside,0,2,h);assert.deepEqual(Array.from(cache.entries),before);
 }
 let collision;for(let value=1;value<1000;value++){const other=q.slice();other[11]=value;const h=mixSpan32Locator32(other,0,14);if(h!==hash&&(h&7)===(hash&7)){collision={other,h};break;}}
 assert.ok(collision);assert.equal(api.probeIndexPartial16Shared32(cache,collision.other,0,collision.h),0);
 api.storeIndexPartial16Shared32(cache,collision.other,0,3,collision.h);
 assert.equal(api.probeIndexPartial16Shared32(cache,q,0,hash),0);
 assert.equal(api.probeIndexPartial16Shared32(cache,collision.other,0,collision.h),3);
});
test('narrow16 retains busy wrap clone and private proof protocols',async()=>{
 const api=await import('../addons/rba-connect4-index-partial-cache.mjs'),q=connect4RbaFromMoves(grayMoves,{geometry:g}).words,
  hash=mixSpan32Locator32(q,0,14),cache=api.createIndexPartialCache32({geometry:g,capacity:8,shared:true,kind:'partial16'}),record=(hash&7)*4;
 Atomics.store(cache.entries,record,11);const before=Array.from(cache.entries);
 assert.equal(api.probeIndexPartial16Shared32(cache,q,0,hash),0);api.storeIndexPartial16Shared32(cache,q,0,3,hash);assert.deepEqual(Array.from(cache.entries),before);
 Atomics.store(cache.entries,record,0xfffffffe);api.storeIndexPartial16Shared32(cache,q,0,3,hash);assert.equal(api.probeIndexPartial16Shared32(cache,q,0,hash),0);
 api.storeIndexPartial16Shared32(cache,q,0,5,hash);assert.equal(api.probeIndexPartial16Shared32(api.attachIndexPartialCache32(structuredClone(cache)),q,0,hash),5);
 const local=api.createIndexPartialCache32({geometry:g,capacity:8,kind:'partial16'});
 for(let tag=1;tag<=5;tag++){api.storeIndexPartial16Local32(local,q,0,tag,hash);assert.equal(api.probeIndexPartial16Local32(local,q,0,hash),tag);}
});
