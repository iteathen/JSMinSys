import test from 'node:test';
import {Worker} from 'node:worker_threads';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,shareConnect4RbaGeometry32} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {
  prepareConnect4RbaAlphaBeta,
  solveConnect4RbaAlphaBeta,
  RBA_AB_CPC_ONLY,
} from '../addons/rba-connect4-alphabeta.mjs';
import {
  createConnect4RbaSharedExactCache32,
  probeConnect4RbaSharedExactCache32,
  storeConnect4RbaSharedExactCache32,
} from '../addons/rba-connect4-shared-exact-cache.mjs';
import {mixSpan32Locator32} from '../src/widekey32.mjs';
import {
  runLazySmpConnect4Rba32,
  RBA_LAZY_SMP_WORKER_LEGACY,
  RBA_LAZY_SMP_WORKER_MINIMAL,
} from '../addons/rba-connect4-lazy-smp-host.mjs';

test('shared exact cache publishes only fully committed exact rows',()=>{
  const cache=createConnect4RbaSharedExactCache32({capacity:8,keyWords:2}),
    a=Uint32Array.from([11,22]),b=Uint32Array.from([33,44]);
  assert.equal(probeConnect4RbaSharedExactCache32(cache,a,0),0);
  assert.equal(storeConnect4RbaSharedExactCache32(cache,a,0,3),3);
  assert.equal(probeConnect4RbaSharedExactCache32(cache,a,0),3);
  storeConnect4RbaSharedExactCache32(cache,b,0,2);
  assert.ok(cache.stats[1]>=2);
});

test('shared exact known-hash path retains full-key validation',()=>{
  const cache=createConnect4RbaSharedExactCache32({capacity:8,keyWords:2}),
    a=Uint32Array.from([11,22]),b=Uint32Array.from([33,44]),
    hash=mixSpan32Locator32(a,0,2);
  assert.equal(storeConnect4RbaSharedExactCache32(cache,a,0,3,hash),3);
  assert.equal(probeConnect4RbaSharedExactCache32(cache,a,0,hash),3);
  assert.equal(probeConnect4RbaSharedExactCache32(cache,b,0,hash),0);
  assert.equal(probeConnect4RbaSharedExactCache32(cache,a,0),3);
});

test('standard 7x6 shared exact cache uses lossless compact identity',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),
    a=connect4RbaFromMoves([3,2,3,2,4,2],{geometry:g}),
    b=connect4RbaFromMoves([3,2,3,2,5,2],{geometry:g}),
    cache=createConnect4RbaSharedExactCache32({capacity:1,keyWords:g.keyWords,geometry:g}),
    hashA=mixSpan32Locator32(a.words,0,g.keyWords),hashB=mixSpan32Locator32(b.words,0,g.keyWords);
  assert.equal(cache.keyWords,14);
  assert.equal(cache.storedKeyWords,8);
  assert.equal(cache.compact8,1);
  assert.equal(cache.keys.length,8);
  assert.equal(storeConnect4RbaSharedExactCache32(cache,a.words,0,3,hashA),3);
  assert.equal(probeConnect4RbaSharedExactCache32(cache,a.words,0,hashA),3);
  // Capacity one forces the distinct q through the same shared slot.
  assert.equal(probeConnect4RbaSharedExactCache32(cache,b.words,0,hashB),0);
});

test('non-7x6 shared exact cache retains full-key identity',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
    a=connect4RbaFromMoves([0,1,0,1],{geometry:g}),
    b=connect4RbaFromMoves([0,1,0,2],{geometry:g}),
    cache=createConnect4RbaSharedExactCache32({capacity:1,keyWords:g.keyWords,geometry:g});
  assert.equal(cache.compact8,0);
  assert.equal(cache.storedKeyWords,g.keyWords);
  assert.equal(cache.keys.length,g.keyWords);
  storeConnect4RbaSharedExactCache32(cache,a.words,0,3);
  assert.equal(probeConnect4RbaSharedExactCache32(cache,a.words,0),3);
  assert.equal(probeConnect4RbaSharedExactCache32(cache,b.words,0),0);
});

test('Lazy SMP is a separate 2+ worker exact execution option',async()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
    moves=[0,1,0,1],
    root=connect4RbaFromMoves(moves,{geometry:g}),
    serial=solveConnect4RbaAlphaBeta(root,{
      state:prepareConnect4RbaAlphaBeta({
        geometry:g,
        mode:RBA_AB_CPC_ONLY,
        cacheCapacity:4096,
      }),
      reflected:root.reflected,
    }),
    lazy=await runLazySmpConnect4Rba32(moves,{
      geometry:g,
      workers:2,
      sharedCacheCapacity:4096,
      localCacheCapacity:4096,
      timeoutMs:5000,
    });
  assert.equal(lazy.status,'EXACT',JSON.stringify(lazy));
  assert.equal(lazy.rootWdl,serial.value-2);
  const child=connect4RbaFromMoves([...moves,lazy.move],{geometry:g});
  const childResult=solveConnect4RbaAlphaBeta(child,{
    state:prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_ONLY,cacheCapacity:4096}),
    reflected:child.reflected,
  });
  assert.equal(childResult.value,serial.value,'diversified winner must still publish an optimal move');
  assert.equal(lazy.workerMode,RBA_LAZY_SMP_WORKER_LEGACY);
  assert.equal(lazy.cleanup,true);
  assert.equal(lazy.workersExited,2);
  assert.equal(lazy.workersUsed,2);
  assert.ok(lazy.winner>=0&&lazy.winner<2);
  assert.ok(lazy.sharedCacheStores>0);
  assert.ok(lazy.winnerMetrics.nodes>=0);
});

test('Lazy SMP rejects single-worker execution and is the sole Connect4 parallel composition',async()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  await assert.rejects(
    ()=>runLazySmpConnect4Rba32([0,1,0,1],{geometry:g,workers:1,timeoutMs:1000}),
    /at least two/,
  );
  const addons=await import('../addons/index.mjs');
  assert.equal('runManagedConnect4CpcRba32' in addons,false);
});

test('Lazy SMP matches serial CPC-Negamax on a standard 7x6 late position',async()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),
    moves=[4,0,0,0,3,3,0,0,6,2,3,0,2,3,6,3,6,3,4,6,2,2,6,1,2,5,6,4],
    root=connect4RbaFromMoves(moves,{geometry:g}),
    serial=solveConnect4RbaAlphaBeta(root,{
      state:prepareConnect4RbaAlphaBeta({
        geometry:g,
        mode:RBA_AB_CPC_ONLY,
        cacheCapacity:65536,
      }),
      reflected:root.reflected,
    }),
    lazy=await runLazySmpConnect4Rba32(moves,{
      geometry:g,
      workers:2,
      sharedCacheCapacity:65536,
      localCacheCapacity:65536,
      timeoutMs:5000,
    });
  assert.equal(lazy.status,'EXACT',JSON.stringify(lazy));
  assert.equal(lazy.rootWdl,serial.value-2);
  const child=connect4RbaFromMoves([...moves,lazy.move],{geometry:g});
  const childResult=solveConnect4RbaAlphaBeta(child,{
    state:prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_ONLY,cacheCapacity:65536}),
    reflected:child.reflected,
  });
  assert.equal(childResult.value,serial.value,'diversified winner must still publish an optimal move');
  assert.equal(lazy.cleanup,true);
  assert.ok(lazy.sharedCacheStores>0);
});



test('sharing-density masks preserve exact Lazy SMP results',async()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
    moves=[0,1,0,1],
    root=connect4RbaFromMoves(moves,{geometry:g}),
    serial=solveConnect4RbaAlphaBeta(root,{
      state:prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_ONLY,cacheCapacity:4096}),
      reflected:root.reflected,
    });
  for(const sharedSampleMask of [0,1,3,7,15,31,63,127,255]){
    const lazy=await runLazySmpConnect4Rba32(moves,{
      geometry:g,workers:2,sharedCacheCapacity:4096,localCacheCapacity:4096,
      sharedSampleMask,timeoutMs:5000,
    });
    assert.equal(lazy.status,'EXACT',JSON.stringify({sharedSampleMask,lazy}));
    assert.equal(lazy.rootWdl,serial.value-2);
    assert.equal(lazy.sharedSampleMask,sharedSampleMask);
  }
});


test('Lazy SMP move ordering is center-line distance only',async()=>{
  const g=prepareConnect4RbaGeometry({
    columns:3,
    rows:3,
    actionOrder:[0,2,1],
  });
  const lazy=await runLazySmpConnect4Rba32([],{
    geometry:g,
    workers:2,
    sharedCacheCapacity:256,
    localCacheCapacity:256,
    timeoutMs:5000,
    workerMode:RBA_LAZY_SMP_WORKER_MINIMAL,
  });
  assert.equal(lazy.status,'EXACT',JSON.stringify(lazy));
  assert.equal(lazy.workerMode,RBA_LAZY_SMP_WORKER_MINIMAL);
  assert.equal(lazy.rootWdl,0);
  assert.equal(lazy.move,1,'minimal worker must ignore geometry actionOrder and choose minimum center-line distance');
});


test('Lazy SMP workers diversify only equal center-distance ties',async()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:1}),
    root=connect4RbaFromMoves([],{geometry:g,positionCode:false}),
    geometry=shareConnect4RbaGeometry32(g);

  async function run(workerIndex){
    const workers=2,
      control=new Int32Array(new SharedArrayBuffer(5*Int32Array.BYTES_PER_ELEMENT)),
      resultWords=new Int32Array(new SharedArrayBuffer(workers*4*Int32Array.BYTES_PER_ELEMENT)),
      metricBuffer=new SharedArrayBuffer(workers*15*Float64Array.BYTES_PER_ELEMENT),
      sharedExactCache=createConnect4RbaSharedExactCache32({capacity:64,keyWords:g.keyWords,geometry:g});
    control[4]=-1;
    const worker=new Worker(new URL('../addons/rba-connect4-lazy-smp-worker-minimal.mjs',import.meta.url),{
      workerData:{
        control,resultWords,metricBuffer,workerIndex,workerCount:workers,
        geometry,root,rootReflected:root.reflected,sharedExactCache,
        localCacheCapacity:64,sharedSampleMask:0,
      },
    });
    await new Promise((resolve,reject)=>{
      worker.once('error',reject);
      worker.once('exit',code=>code===0?resolve():reject(new Error('worker exit '+code)));
    });
    assert.equal(resultWords[workerIndex*4],2);
    return resultWords[workerIndex*4+2];
  }

  assert.equal(await run(0),1);
  assert.equal(await run(1),2);
});


test('minimal Lazy SMP worker rejects legacy-only controls',async()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  for(const options of [
    {rootFrontier:true},
    {cpcFrontierResponse:true},
    {cpcProjectedAdvisory:true},
  ])await assert.rejects(
    ()=>runLazySmpConnect4Rba32([0,1,0,1],{
      geometry:g,workers:2,workerMode:RBA_LAZY_SMP_WORKER_MINIMAL,
      timeoutMs:1000,...options,
    }),
    /does not support legacy behavior\/CPC options/,
  );
});

test('Lazy SMP rejects unknown worker mode',async()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  await assert.rejects(
    ()=>runLazySmpConnect4Rba32([0,1,0,1],{geometry:g,workers:2,workerMode:'unknown',timeoutMs:1000}),
    /invalid Lazy SMP worker mode/,
  );
});


test('minimal worker never publishes local bounds to shared exact cache',async()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
    root=connect4RbaFromMoves([0,1,0,1],{geometry:g,positionCode:false}),
    geometry=shareConnect4RbaGeometry32(g),
    workers=2,
    control=new Int32Array(new SharedArrayBuffer(5*Int32Array.BYTES_PER_ELEMENT)),
    resultWords=new Int32Array(new SharedArrayBuffer(workers*4*Int32Array.BYTES_PER_ELEMENT)),
    metricBuffer=new SharedArrayBuffer(workers*15*Float64Array.BYTES_PER_ELEMENT),
    sharedExactCache=createConnect4RbaSharedExactCache32({capacity:4096,keyWords:g.keyWords,geometry:g});
  control[4]=-1;
  const running=[];
  for(let workerIndex=0;workerIndex<workers;workerIndex+=1)running.push(new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('../addons/rba-connect4-lazy-smp-worker-minimal.mjs',import.meta.url),{
      workerData:{
        control,resultWords,metricBuffer,workerIndex,workerCount:workers,
        geometry,root,rootReflected:root.reflected,sharedExactCache,
        localCacheCapacity:4096,sharedSampleMask:0,
      },
    });
    worker.once('error',reject);
    worker.once('exit',code=>code===0?resolve():reject(new Error('worker exit '+code)));
  }));
  await Promise.all(running);
  for(const value of sharedExactCache.value)assert.ok(value<=3,'local-only bound leaked into shared exact cache');
});


test('minimal worker omits hot diagnostic counters',async()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
    result=await runLazySmpConnect4Rba32([0,1,0,1],{
      geometry:g,workers:2,workerMode:RBA_LAZY_SMP_WORKER_MINIMAL,
      sharedCacheCapacity:4096,localCacheCapacity:4096,timeoutMs:5000,
    });
  assert.equal(result.status,'EXACT',JSON.stringify(result));
  assert.equal(result.winnerMetrics,null);
  assert.equal(result.sharedCacheHits,null);
  assert.equal(result.sharedCacheStores,null);
  assert.equal(result.sharedCacheStoreContention,null);
});


test('minimal timeout is host-terminated without recursive polling',async()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),
    result=await runLazySmpConnect4Rba32([],{
      geometry:g,workers:2,workerMode:RBA_LAZY_SMP_WORKER_MINIMAL,
      sharedCacheCapacity:65536,localCacheCapacity:65536,timeoutMs:1,
    });
  assert.equal(result.status,'TIMEOUT',JSON.stringify(result));
  assert.equal(result.cleanup,true);
  assert.equal(result.workersExited,2);
});

test('pre-aborted minimal call allocates no workers',async()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),
    controller=new AbortController();
  controller.abort();
  const result=await runLazySmpConnect4Rba32([],{
    geometry:g,workers:2,workerMode:RBA_LAZY_SMP_WORKER_MINIMAL,
    sharedCacheCapacity:65536,localCacheCapacity:65536,timeoutMs:5000,
    signal:controller.signal,
  });
  assert.equal(result.status,'INTERRUPTED',JSON.stringify(result));
  assert.equal(result.cleanup,true);
  assert.equal(result.workersExited,0);
  assert.equal(result.workersUsed,0);
  assert.equal(result.requestedWorkers,2);
});


test('minimal four-worker search returns after an immediate winning center move',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
  // Player zero has three center tokens; the next center move wins vertically.
  const result=await runLazySmpConnect4Rba32([3,0,3,0,3,1],{
    geometry,workers:4,workerMode:RBA_LAZY_SMP_WORKER_MINIMAL,
    sharedCacheCapacity:1024,localCacheCapacity:1024,timeoutMs:5000,
  });
  assert.equal(result.status,'EXACT',JSON.stringify(result));
  assert.equal(result.rootWdl,1);
  assert.equal(result.move,3);
  assert.equal(result.cleanup,true);
  assert.equal(result.workersExited,4);
});


test('minimal four-worker search finds an off-center immediate win before descending',async()=>{
  for(const rows of [6,5])for(const sequence of ['141412','4141213','747476','4747675']){
    const geometry=prepareConnect4RbaGeometry({columns:7,rows});
    const moves=[...sequence].map(c=>Number(c)-1);
    const result=await runLazySmpConnect4Rba32(moves,{
      geometry,workers:4,workerMode:RBA_LAZY_SMP_WORKER_MINIMAL,
      sharedCacheCapacity:16384,localCacheCapacity:16384,timeoutMs:5000,
    });
    assert.equal(result.status,'EXACT',sequence+' '+JSON.stringify(result));
    assert.equal(result.rootWdl,moves.length%2?-1:1,sequence);
    assert.equal(result.move,sequence.startsWith('7')||sequence.startsWith('47')?6:0,sequence);
    assert.equal(result.cleanup,true);
    assert.equal(result.workersExited,4);
  }
});
