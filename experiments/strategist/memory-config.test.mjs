import test from 'node:test';
import assert from 'node:assert/strict';
import {memoryBytes,validateMemoryArm} from './memory-config.mjs';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {createConnect4RbaExactCache32} from '../../addons/rba-connect4-alphabeta.mjs';
import {createConnect4RbaSharedExactCache32} from '../../addons/rba-connect4-shared-exact-cache.mjs';
test('memory campaign capacities route to exact public allocator payloads',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});assert.equal(g.keyWords,14);
  const shared=createConnect4RbaSharedExactCache32({capacity:65536,keyWords:g.keyWords}),
    local=createConnect4RbaExactCache32({capacity:262144,keyWords:g.keyWords});
  const bytes=x=>Object.values(x).reduce((s,v)=>s+(ArrayBuffer.isView(v)?v.byteLength:0),0);
  assert.equal(bytes(shared)+4*bytes(local),memoryBytes(65536,262144));
  assert.equal(memoryBytes(1048576,1048576),308*1048576+12);
  assert.equal(memoryBytes(2097152,2097152),616*1048576+12);
});
test('memory campaign bounds fail closed',()=>{
  const c={shared:1048576,local:1048576,timeoutMs:30000};assert.equal(validateMemoryArm(c),c);
  for(const n of [0,4096,65537,4194304,NaN])for(const key of ['shared','local'])assert.throws(()=>validateMemoryArm({...c,[key]:n}));
  assert.throws(()=>validateMemoryArm({...c,timeoutMs:300000}));
});
