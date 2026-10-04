import {performance} from 'node:perf_hooks';
import os from 'node:os';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {runLazySmpConnect4Rba32,RBA_LAZY_SMP_WORKER_MINIMAL} from '../addons/rba-connect4-lazy-smp-host.mjs';
import {processCycleCounter} from './process-cycle-counter.mjs';

const geometry=prepareConnect4RbaGeometry({columns:7,rows:6}),
  counter=await processCycleCounter(),
  cycles0=counter.read(),
  t0=performance.now();

let result;
try{
  result=await runLazySmpConnect4Rba32([],{
    geometry,
    workers:4,
    workerMode:RBA_LAZY_SMP_WORKER_MINIMAL,
    sharedCacheCapacity:134217728,
    localCacheCapacity:16777216,
    sharedSampleMask:0,
    timeoutMs:600000,
  });
}finally{
  // Read before closing the FFI library so the interval includes worker cleanup.
}
const wallMs=performance.now()-t0,
  cycles1=counter.read();
counter.close();

console.log(JSON.stringify({
  kind:'minimal-worker-i5-12600k-full-solve-v1',
  runtime:{node:process.version,v8:process.versions.v8},
  platform:{platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model??null,logicalProcessors:os.cpus().length},
  target:{wallTimeMsMax:10000,workers:4,workerMode:RBA_LAZY_SMP_WORKER_MINIMAL},
  wallMs,
  processCycles:(cycles1-cycles0).toString(),
  status:result.status,
  rootWdl:result.rootWdl,
  move:result.move,
  sharedCacheHits:result.sharedCacheHits,
  sharedCacheStores:result.sharedCacheStores,
  sharedCacheStoreContention:result.sharedCacheStoreContention,
  cleanup:result.cleanup,
  workersExited:result.workersExited,
  errorCode:result.errorCode,
},null,2));

if(result.status!=='EXACT')process.exitCode=2;
else if(wallMs>10000)process.exitCode=3;
