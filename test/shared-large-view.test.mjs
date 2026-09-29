import test from 'node:test';
import assert from 'node:assert/strict';
import * as shared from '../addons/rba-connect4-shared-exact-cache.mjs';
test('worker attachment restores a truncated full-buffer view without copying storage',()=>{
 assert.equal(typeof shared.attachConnect4RbaSharedExactCache32,'function');
 const cache=shared.createConnect4RbaSharedExactCache32({capacity:4,keyWords:2});
 const buffer=cache.keys.buffer;cache.keys[7]=123;cache.keys=new Uint32Array(buffer,0,0);
 shared.attachConnect4RbaSharedExactCache32(cache);
 assert.equal(cache.keys.buffer,buffer);assert.equal(cache.keys.length,8);assert.equal(cache.keys[7],123);
 const normal=cache.keys;shared.attachConnect4RbaSharedExactCache32(cache);assert.equal(cache.keys,normal);
});
test('worker attachment rejects wrong backing size rather than fabricating capacity',()=>{
 assert.equal(typeof shared.attachConnect4RbaSharedExactCache32,'function');
 const cache=shared.createConnect4RbaSharedExactCache32({capacity:4,keyWords:2});cache.keys=new Uint32Array(new SharedArrayBuffer(4));
 assert.throws(()=>shared.attachConnect4RbaSharedExactCache32(cache));
});
