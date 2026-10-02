// Diagnostic only. Run with --allow-natives-syntax --print-opt-code
// --print-opt-code-filter=*Locator32. Never imported by a solver worker.
import assert from 'node:assert/strict';
import {mixSpan32Locator32} from '../../src/widekey32.mjs';
import {mix14x32Locator32} from '../isomax-lean/fixed-ops.mjs';
const words=Uint32Array.from({length:28},(_,i)=>Math.imul(i+1,0x9e3779b1));
%PrepareFunctionForOptimization(mixSpan32Locator32);
%PrepareFunctionForOptimization(mix14x32Locator32);
let checksum=0;
for(let i=0;i<10000;i++){
  const offset=(i&1)*14;words[offset]^=i;
  const a=mixSpan32Locator32(words,offset,14),b=mix14x32Locator32(words,offset);
  assert.equal(a,b);checksum^=a;
}
%OptimizeFunctionOnNextCall(mixSpan32Locator32);
%OptimizeFunctionOnNextCall(mix14x32Locator32);
assert.equal(mixSpan32Locator32(words,14,14),mix14x32Locator32(words,14));
console.log(JSON.stringify({kind:'isolated JIT inspection, not solver performance evidence',
  node:process.version,v8:process.versions.v8,checksum:checksum>>>0}));
