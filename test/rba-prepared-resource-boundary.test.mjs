import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareLazySmpConnect4Rba32} from '../addons/rba-connect4-prepared-session-host.mjs';
import {ManagedThreadSession} from '../addons/branch-manager-host.mjs';
const options=()=>({geometry:prepareConnect4RbaGeometry({columns:4,rows:3}),workers:4,
 sharedCacheCapacity:8192,localCacheCapacity:256,sharedCacheLayout:'native',supportBasisPlanBudgetBytes:0,timeoutMs:10000});

test('already-expired initialization stops before launching any worker',async()=>{
 const spawn=ManagedThreadSession.prototype.spawn;let launched=0,app;
 ManagedThreadSession.prototype.spawn=function(...args){launched++;return spawn.apply(this,args);};
 try{
  app=await prepareLazySmpConnect4Rba32({...options(),initializationTimeoutMs:Number.MIN_VALUE});
  const result=await app.solve([]);
  assert.equal(result.status,'TIMEOUT');assert.equal(launched,0);
  assert.equal(result.workersExited,0);assert.equal(result.cleanup,true);
 }finally{ManagedThreadSession.prototype.spawn=spawn;if(app)await app.close();}
});

test('pre-aborted partial preparation cancels before requiring compiled plans',async()=>{
 const app=await prepareLazySmpConnect4Rba32({...options(),geometry:prepareConnect4RbaGeometry({columns:7,rows:6}),
  cacheIdentity:'partial24',localCacheLayout:'native',signal:AbortSignal.abort()});
 try{const result=await app.solve([]);assert.equal(result.status,'INTERRUPTED');assert.equal(result.workersUsed,0);}
 finally{await app.close();}
});

test('retaining a closed application does not retain its large shared TT buffer',{skip:typeof global.gc!=='function'},async()=>{
 const Native=globalThis.SharedArrayBuffer,argv=[...process.execArgv],tracked=[];let app;
 process.execArgv.splice(0,process.execArgv.length,...argv.filter(a=>a!=='--expose-gc'));
 globalThis.SharedArrayBuffer=class extends Native{
  constructor(size){super(size);if(size>=65536)tracked.push(new WeakRef(this));}
 };
 try{
  app=await prepareLazySmpConnect4Rba32(options());
  assert.ok(tracked.length>0,'actual shared TT allocation was observed');
  globalThis.SharedArrayBuffer=Native;
  await app.close();
  for(let i=0;i<8;i++){await new Promise(setImmediate);global.gc();await new Promise(setImmediate);}
  assert.ok(tracked.every(ref=>ref.deref()===undefined),'closed application still retains TT backing handle');
  assert.equal(app.state().cleanup,true);assert.equal(app.state().workersExited,4);
  const afterClose=await app.solve([]);
  assert.ok(afterClose.sharedTtPayloadBytes>=65536,'allocated TT size remains available after reference release');
  assert.ok(afterClose.sharedBytes>=afterClose.sharedTtPayloadBytes);
  assert.equal(afterClose.sharedTtLogicalEntries,8192);
  assert.equal(afterClose.searchStarted,undefined);
  assert.equal(afterClose.preparedTiming.rootConstructedAfterReady,false);
  assert.equal(afterClose.workersUsed,4);assert.equal(afterClose.workersExited,4);
  await app.close();
 }finally{
  globalThis.SharedArrayBuffer=Native;process.execArgv.splice(0,process.execArgv.length,...argv);
  if(app)await app.close();
 }
});
