import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {mixSpan32Locator32} from '../src/widekey32.mjs';
const g=prepareConnect4RbaGeometry({columns:7,rows:6}),gray=[5,6,6,2,5,3,3,3,5,3,6,5,5,5,6,3,2,2,2,1,3,6,2,6,2,1,0,0,4,4,1,4,4,0,1,1,0,1,4,0];
test('mixed16/24 cache retains full identity coverage and records actual bytes',async()=>{
 const api=await import('../addons/rba-connect4-index-partial-cache.mjs');
 assert.equal(typeof api.createMixedIndexPartialCache32,'function');
 const cache=api.createMixedIndexPartialCache32({geometry:g,capacity:16,shared:true});
 assert.equal(cache.payloadBytes,16*16+8*24);assert.equal(cache.logicalEntries,24);
 for(const moves of [[],[3,2,3,2],gray]){
  const root=connect4RbaFromMoves(moves,{geometry:g}),q=root.words,h=mixSpan32Locator32(q,0,14),
   packed=root.basis.length<=32?api.packIndexPartial16Heights32(q,0):api.packIndexPartial24Support32(q,0)|0x80000000;
  for(let tag=1;tag<=5;tag++){
   api.storeIndexPartialMixedShared32(cache,q,0,tag,h,packed);
   assert.equal(api.probeIndexPartialMixedShared32(cache,q,0,h,packed),tag);
  }
 }
 const cloned=api.attachMixedIndexPartialCache32(structuredClone(cache));
 assert.equal(cloned.entries.buffer,cloned.narrow.entries.buffer);
 assert.deepEqual(Array.from(cloned.stats),[0,0,0]);
});
