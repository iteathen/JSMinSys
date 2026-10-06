import test from 'node:test';
import assert from 'node:assert/strict';
import * as banks from '../addons/rba-connect4-shared-banked-cache.mjs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import * as cacheApi from '../addons/rba-connect4-shared-exact-cache-layout.mjs';
test('128GiB compact bank plan uses full unsigned hash space without allocating',()=>{
 assert.equal(typeof banks.prepareBankedSharedCapacity32,'function');
 const plan=banks.prepareBankedSharedCapacity32(2**32,2**27);
 assert.deepEqual(plan,{capacity:2**32,bankCapacity:2**27,bankShift:27,bankMask:31,bankCount:32});
 for(const hash of [0,2**27-1,2**27,2**31-1,2**31,0xffffffff]){
  const bank=(hash>>>plan.bankShift)&plan.bankMask,slot=hash&(plan.bankCapacity-1);
  assert.equal(bank*plan.bankCapacity+slot,hash);
  assert.ok(slot*16+15<=0x7fffffff);
 }
 assert.throws(()=>banks.prepareBankedSharedCapacity32(2**33,2**27),RangeError);
});
test('profile sizing accounts for every worker and exact fit boundary',async()=>{
 const m=await import('../addons/isomax-memory-profile.mjs'),geometry=prepareConnect4RbaGeometry({columns:7,rows:6}),GiB=2**30;
 for(const workers of [2,3,4,5,6,64]){
  const required=(8+workers/4+2)*GiB;
  assert.equal(m.selectIsoMaxMemoryProfile32({geometry,workers,availableBytes:required}).profile.sharedGiB,8);
  assert.equal(m.selectIsoMaxMemoryProfile32({geometry,workers,availableBytes:required-1}).profile.sharedGiB,4);
 }
 for(const profile of m.ISOMAX_MEMORY_PROFILES){
  const selected=m.selectIsoMaxMemoryProfile32({geometry,workers:6,availableBytes:256*GiB,requested:profile.id});
  assert.equal(selected.sharedBytes,profile.sharedBudgetBytes);assert.equal(selected.privateBytes,1.5*GiB);
 }
 assert.equal(m.selectIsoMaxMemoryProfile32({geometry,workers:6,availableBytes:256*GiB,allowExperimental:true}).profile.sharedGiB,128);
});
test('dimension-dependent profile layouts fit all 1x1 through10x10 boards',async()=>{
 const m=await import('../addons/isomax-memory-profile.mjs');
 for(let columns=1;columns<=10;columns++)for(let rows=1;rows<=10;rows++){
  const geometry=prepareConnect4RbaGeometry({columns,rows});
  for(const requested of ['1','8','128']){
   const plan=m.selectIsoMaxMemoryProfile32({geometry,workers:6,availableBytes:256*2**30,requested});
   assert.ok(plan.sharedBytes<=Number(requested)*2**30);assert.ok(plan.privateBytesPerWorker<=2**28);
   assert.ok(plan.bankEntries*plan.bankCount===plan.sharedCacheCapacity);
  }
 }
});
test('native memory discovery reports physical and process/commit headroom',async()=>{
 const {discoverAvailableSolverMemory32}=await import('../addons/isomax-memory-profile.mjs'),snapshot=await discoverAvailableSolverMemory32();
 assert.ok(Number.isSafeInteger(snapshot.availableBytes));assert.ok(snapshot.availableBytes>=0);
 assert.ok(snapshot.availableBytes<=snapshot.physicalAvailableBytes);assert.ok(snapshot.availableBytes<=snapshot.processAvailableBytes);
 if(process.platform==='win32'){assert.ok(snapshot.commitAvailableBytes>=snapshot.availableBytes);assert.match(snapshot.source,/GlobalMemoryStatusEx/);}
});
test('generic board banks retain native field identity without compact assumptions',()=>{
 for(const [columns,rows] of [[7,5],[4,1],[1,4],[10,10]]){
  const geometry=prepareConnect4RbaGeometry({columns,rows}),cache=cacheApi.createConnect4RbaSharedLayoutCache32({capacity:16,bankCapacity:8,keyWords:geometry.keyWords,geometry}),
   access=cacheApi.prepareSharedCacheAccess(cache),words=new Uint32Array(geometry.keyWords),other=words.slice();other[0]=1;
  assert.equal(cache.banks.length,2);access.store(cache,words,0,4,0);access.store(cache,other,0,5,8);
  assert.equal(access.probe(cache,words,0,0),4);assert.equal(access.probe(cache,other,0,8),5);
  assert.equal(access.probe(cache,other,0,0),0);
  const clone=structuredClone(cache);cacheApi.attachConnect4RbaSharedLayoutCache32(clone);
  assert.equal(cacheApi.prepareSharedCacheAccess(clone).probe(clone,other,0,8),5);
 }
});
test('memory profile catalog and selection include tested8 and experimental128',async()=>{
 const m=await import('../addons/isomax-memory-profile.mjs').catch(()=>({}));
 assert.equal(typeof m.selectIsoMaxMemoryProfile32,'function');
 assert.deepEqual(m.ISOMAX_MEMORY_PROFILES.map(p=>p.sharedGiB),[1,2,4,8,16,32,64,128]);
 assert.deepEqual(m.ISOMAX_MEMORY_PROFILES.map(p=>p.status),['tested','tested','tested','tested','experimental','experimental','experimental','experimental']);
 const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
 assert.equal(m.selectIsoMaxMemoryProfile32({geometry,workers:6,availableBytes:256*2**30}).profile.sharedGiB,128);
 const large=m.selectIsoMaxMemoryProfile32({geometry,workers:6,availableBytes:256*2**30,requested:'128'});
 assert.equal(large.sharedCacheCapacity,2**32);assert.equal(large.bankCount,32);
 assert.throws(()=>m.selectIsoMaxMemoryProfile32({geometry,workers:6,availableBytes:4*2**30,requested:'8'}),/memory|headroom/i);
});
