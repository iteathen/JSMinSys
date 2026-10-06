import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {mixSpan32Locator32} from '../src/widekey32.mjs';
const g=prepareConnect4RbaGeometry({columns:7,rows:6});

test('banked partial24 keeps exact independent rows and publication through clones',async()=>{
 const api=await import('../addons/rba-connect4-index-partial-cache.mjs');
 assert.equal(typeof api.createBankedIndexPartialCache32,'function');
 const cache=api.createBankedIndexPartialCache32({geometry:g,capacity:32,bankCapacity:8}),pairs=new Map();
 assert.equal(cache.banks.length,4);assert.equal(cache.payloadBytes,32*24);assert.equal(cache.logicalEntries,32);
 for(let value=0;value<1000&&pairs.size<32;value++){
  const q=new Uint32Array(14);q[8]=12345;q[9]=67890;q[11]=54321;q[12]=value;
  const hash=mixSpan32Locator32(q,0,14);pairs.set(hash&31,{q,hash});
 }
 assert.equal(pairs.size,32);
 for(let tag=1;tag<=5;tag++){
  for(const {q,hash} of pairs.values())api.storeBankedIndexPartial24Shared32(cache,q,0,tag,hash,api.packIndexPartial24Support32(q,0));
  for(const {q,hash} of pairs.values())assert.equal(api.probeBankedIndexPartial24Shared32(cache,q,0,hash,api.packIndexPartial24Support32(q,0)),tag);
 }
 const cloned=api.attachBankedIndexPartialCache32(structuredClone(cache));
 for(const {q,hash} of pairs.values()){
  const bank=cloned.banks[(hash>>>cloned.bankShift)&cloned.bankMask],row=(hash&bank.mask)*6,
   packed=api.packIndexPartial24Support32(q,0);
  assert.equal(api.probeBankedIndexPartial24Shared32(cloned,q,0,hash,packed),5);
  Atomics.store(bank.entries,row,0xffffffff);
  assert.equal(api.probeBankedIndexPartial24Shared32(cloned,q,0,hash,packed),0);
  api.storeBankedIndexPartial24Shared32(cloned,q,0,2,hash,packed);
  assert.equal(Atomics.load(bank.entries,row),0xffffffff);
  Atomics.store(bank.entries,row,0xfffffffe);
  api.storeBankedIndexPartial24Shared32(cloned,q,0,2,hash,packed);
  assert.equal(Atomics.load(bank.entries,row),0);
  assert.equal(api.probeBankedIndexPartial24Shared32(cloned,q,0,hash,packed),0);
  api.storeBankedIndexPartial24Shared32(cloned,q,0,2,hash,packed);
  assert.equal(api.probeBankedIndexPartial24Shared32(cloned,q,0,hash,packed),2);
 }
 assert.deepEqual(Array.from(cache.stats),[0,0,0]);
 const aliased=structuredClone(cache);aliased.banks[1]=aliased.banks[0];
 assert.throws(()=>api.attachBankedIndexPartialCache32(aliased),/aliased/);
 assert.throws(()=>api.createBankedIndexPartialCache32({geometry:g,capacity:16,bankCapacity:2**29}),/invalid|range/);
});

test('banked partial24 prepared host initializes both banks before solving',async()=>{
 const {prepareLazySmpConnect4Rba32}=await import('../addons/rba-connect4-prepared-session-host.mjs');
 const app=await prepareLazySmpConnect4Rba32({geometry:g,workers:2,sharedCacheCapacity:256,sharedBankCapacity:128,
  localCacheCapacity:256,sharedCacheLayout:'native',localCacheLayout:'native',sharedProofBounds:true,
  cacheIdentity:'partial24',supportBasisViews:true,supportBasisPlanBudgetBytes:2**30,
  supportClosurePlan:true,supportReflectionPlan:true,initializationTimeoutMs:30000});
 try{
  assert.equal(app.state().readyWorkers,2);assert.equal(app.state().searchStarted,false);
  const result=await app.solve([5,6,6,2,5,3,3,3,5,3,6,5,5,5,6,3,2,2,2,1,3,6,2,6,2,1,0,0,4,4,1,4,4,0,1,1,0,1,4,0]);
  assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,0);assert.equal(result.sharedTtBanks,2);
  assert.equal(result.sharedTtBankEntries,128);assert.equal(result.sharedTtPayloadBytes,256*24);
  assert.equal(result.cleanup,true);assert.equal(result.workersExited,2);
 }finally{await app.close();}
});
