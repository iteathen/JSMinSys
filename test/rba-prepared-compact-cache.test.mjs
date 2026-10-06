import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {compactSupportProfile8,compactTailProfile8} from '../addons/rba-connect4-shared-exact-cache.mjs';
import {createLocalNativeProofCache32,localNativeProofKeyMatches32,storeLocalNativeProofEntry32} from '../addons/rba-connect4-local-native-proof-cache.mjs';
import {createConnect4RbaSharedLayoutCache32,probeCompactSharedCache32,storeCompactSharedCache32} from '../addons/rba-connect4-shared-exact-cache-layout.mjs';
import {localPreparedCompactKeyMatches32,storeLocalPreparedCompactEntry32,probeSharedPreparedCompact32,storeSharedPreparedCompact32} from '../addons/rba-connect4-prepared-compact-cache.mjs';

test('prepared native fields preserve exact keys, collisions and all proof tags',()=>{
 const g=prepareConnect4RbaGeometry({columns:7,rows:6}),local=createLocalNativeProofCache32(g,4),shared=createConnect4RbaSharedLayoutCache32({capacity:4,keyWords:g.keyWords,geometry:g});
 const q=new Uint32Array(40),offset=9;
 q.set([1,2,3,4,5,6,0,3,0x12345678,0x87654321,29,0xaaaaaaaa,0x55555555,17],offset);
 const support=()=>compactSupportProfile8(q,offset),tail=()=>compactTailProfile8(q,offset),slot=1,hash=1;
 for(let tag=1;tag<=5;tag++){
  storeLocalPreparedCompactEntry32(local,q,offset,slot,tag,support(),tail());
  assert.equal(localNativeProofKeyMatches32(local,q,offset,slot),true);
  storeLocalNativeProofEntry32(local,q,offset,slot,tag);
  assert.equal(localPreparedCompactKeyMatches32(local,q,offset,slot,support(),tail()),true);
  storeSharedPreparedCompact32(shared,q,offset,tag,hash,support(),tail());
  assert.equal(probeCompactSharedCache32(shared,q,offset,hash),tag);
  storeCompactSharedCache32(shared,q,offset,tag,hash);
  assert.equal(probeSharedPreparedCompact32(shared,q,offset,hash,support(),tail()),tag);
  for(let i=0;i<g.keyWords;i++){
   const old=q[offset+i];q[offset+i]^=1;
   assert.equal(localPreparedCompactKeyMatches32(local,q,offset,slot,support(),tail()),false,`key field ${i}`);
   assert.equal(probeSharedPreparedCompact32(shared,q,offset,hash,support(),tail()),0,`shared field ${i}`);
   q[offset+i]=old;
  }
 }
 // Busy ownership is a miss and the store does not touch held payload.
 Atomics.store(shared.entries,slot*8,11);
 const before=Array.from(shared.entries);
 assert.equal(probeSharedPreparedCompact32(shared,q,offset,hash,support(),tail()),0);
 assert.equal(storeSharedPreparedCompact32(shared,q,offset,2,hash,support(),tail()),2);
 assert.deepEqual(Array.from(shared.entries),before);
 Atomics.store(shared.entries,slot*8,0xfffffffe);
 storeSharedPreparedCompact32(shared,q,offset,3,hash,support(),tail());
 assert.equal(probeSharedPreparedCompact32(shared,q,offset,hash,support(),tail()),0,'sequence wrap reserves zero as miss');
 storeSharedPreparedCompact32(shared,q,offset,3,hash,support(),tail());
 assert.equal(probeSharedPreparedCompact32(shared,q,offset,hash,support(),tail()),3);
});
