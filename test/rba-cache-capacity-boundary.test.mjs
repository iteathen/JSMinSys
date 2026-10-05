import test from 'node:test';
import assert from 'node:assert/strict';
import {createConnect4RbaSharedExactCache32} from '../addons/rba-connect4-shared-exact-cache.mjs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';

test('invalid oversized capacities are rejected before any shared allocation',()=>{
  const Original=globalThis.SharedArrayBuffer;
  let attempted=0;
  try{
    globalThis.SharedArrayBuffer=class {constructor(){attempted++;throw new Error('allocation reached');}};
    for(const capacity of [4294967297,4294967298,9007199254740992,3,0,-1,1.5])
      assert.throws(()=>createConnect4RbaSharedExactCache32({capacity,keyWords:1}),RangeError);
    assert.equal(attempted,0);
  }finally{globalThis.SharedArrayBuffer=Original;}
});

test('local capacity is checked before shared geometry or TT allocation',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:4,rows:3});
  const Original=globalThis.SharedArrayBuffer;
  let attempted=0;
  try{
    globalThis.SharedArrayBuffer=class {constructor(){attempted++;throw new Error('allocation reached');}};
    await assert.rejects(runLazySmpConnect4Rba32([],{geometry,workers:4,workerMode:'minimal',localCacheCapacity:4294967297}),RangeError);
    assert.equal(attempted,0);
  }finally{globalThis.SharedArrayBuffer=Original;}
});

test('native key-view lengths are validated before attempting allocation',()=>{
  const Original=globalThis.SharedArrayBuffer;
  try{
    globalThis.SharedArrayBuffer=class {constructor(){throw new Error('allocation reached');}};
    assert.throws(()=>createConnect4RbaSharedExactCache32({capacity:536870912,keyWords:8}),RangeError);
  }finally{globalThis.SharedArrayBuffer=Original;}
});
