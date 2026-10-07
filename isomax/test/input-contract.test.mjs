import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,evaluateConnect4RankLocalLanding32,prepareLazySmpConnect4Rba32} from '../index.mjs';
import {createConnect4RbaSharedExactCache32} from '../runtime/addons/rba-connect4-shared-exact-cache.mjs';
import {createConnect4RbaSharedLayoutCache32} from '../runtime/addons/rba-connect4-shared-exact-cache-layout.mjs';

const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
test('packaged rank-local history rejects non-indexed views',()=>{
  assert.throws(()=>evaluateConnect4RankLocalLanding32(new DataView(new ArrayBuffer(4)),{geometry}),TypeError);
  assert.deepEqual(evaluateConnect4RankLocalLanding32(new Uint8Array([3,0]),{geometry}),
    evaluateConnect4RankLocalLanding32([3,0],{geometry}));
});
test('packaged capacity guards reject unsupported views before allocating',async()=>{
  const Native=globalThis.SharedArrayBuffer;let allocations=0;
  globalThis.SharedArrayBuffer=class {constructor(){allocations++;throw Error('allocation attempted');}};
  try{
    for(const capacity of [4294967297,4294967298,9007199254740992]){
      await assert.rejects(()=>prepareLazySmpConnect4Rba32({geometry,sharedCacheCapacity:capacity}),RangeError);
      await assert.rejects(()=>prepareLazySmpConnect4Rba32({geometry,localCacheCapacity:capacity}),RangeError);
      assert.throws(()=>createConnect4RbaSharedExactCache32({capacity,geometry,keyWords:geometry.keyWords}),RangeError);
    }
    // The total8GiB profile is valid, but a single8GiB leaf view is not.
    await assert.rejects(()=>prepareLazySmpConnect4Rba32({geometry,cacheIdentity:'native32',sharedCacheLayout:'native',sharedCacheCapacity:268435456,sharedBankCapacity:268435456}),RangeError);
    assert.throws(()=>createConnect4RbaSharedLayoutCache32({capacity:268435456,bankCapacity:268435456,geometry,keyWords:geometry.keyWords}),RangeError);
    assert.equal(allocations,0);
  }finally{globalThis.SharedArrayBuffer=Native;}
});
