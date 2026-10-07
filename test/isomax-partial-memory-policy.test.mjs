import test from 'node:test';
import assert from 'node:assert/strict';
import * as memory from '../addons/isomax-memory-profile.mjs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
const GiB=2**30,geometry=prepareConnect4RbaGeometry({columns:7,rows:6});

test('automatic package identity admits partial24 only with complete standard plans',()=>{
 assert.equal(typeof memory.resolveIsoMaxCacheIdentity32,'function');
 assert.equal(memory.resolveIsoMaxCacheIdentity32({geometry,workers:6}),'partial24');
 assert.equal(memory.resolveIsoMaxCacheIdentity32({geometry,workers:6,supportBasisPlanBudgetBytes:0}),'native32');
 assert.equal(memory.resolveIsoMaxCacheIdentity32({geometry,workers:6,supportBasisViews:false}),'native32');
 for(let columns=1;columns<=10;columns++)for(let rows=1;rows<=10;rows++){
  if(columns===7&&rows===6)continue;
  assert.equal(memory.resolveIsoMaxCacheIdentity32({geometry:prepareConnect4RbaGeometry({columns,rows}),workers:4}),'native32');
 }
});

test('12GiB profile reproduces measured rows, private size and bank boundary without allocating',()=>{
 const plan=memory.selectIsoMaxMemoryProfile32({geometry,workers:6,availableBytes:20*GiB,cacheIdentity:'partial24',requested:'12'});
 assert.equal(plan.sharedCacheCapacity,2**29);assert.equal(plan.sharedBytes,12*GiB);
 assert.equal(plan.localCacheCapacity,2**23);assert.equal(plan.privateBytesPerWorker,192*2**20);
 assert.equal(plan.bankCount,2);assert.equal(plan.bankEntries,2**28);assert.equal(plan.entryBytes,24);
 assert.equal(plan.cacheIdentity,'partial24');assert.equal(plan.localEvidenceMatchesGeometryAndWorkers,true);
 const auto=memory.selectIsoMaxMemoryProfile32({geometry,workers:6,availableBytes:20*GiB,cacheIdentity:'partial24'});
 assert.equal(auto.profile.id,'12','equal actual16-budget allocation must not displace tested12');
 assert.throws(()=>memory.selectIsoMaxMemoryProfile32({geometry,workers:6,availableBytes:plan.requiredBytes-1,cacheIdentity:'partial24',requested:'12'}),/headroom/);
 const large=memory.selectIsoMaxMemoryProfile32({geometry,workers:6,availableBytes:256*GiB,cacheIdentity:'partial24'});
 assert.equal(large.profile.id,'128');assert.equal(large.sharedCacheCapacity,2**32);
});
