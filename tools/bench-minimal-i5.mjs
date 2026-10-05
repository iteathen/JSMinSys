import {performance} from 'node:perf_hooks';
import os from 'node:os';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {runLazySmpConnect4Rba32,RBA_LAZY_SMP_WORKER_MINIMAL} from '../addons/rba-connect4-lazy-smp-host.mjs';
import {processCycleCounter} from './process-cycle-counter.mjs';

const sharedCacheCapacity=Number(process.env.JMS_BENCH_SHARED_CAPACITY??134217728),
  localCacheCapacity=Number(process.env.JMS_BENCH_LOCAL_CAPACITY??33554432),
  sharedCacheLayout=process.env.JMS_BENCH_TT_LAYOUT??'auto',
  sharedProofBounds=process.env.JMS_BENCH_SHARED_PROOF_BOUNDS==='1',
  resourceBounds=process.env.JMS_BENCH_RESOURCE_BOUNDS==='1',
  localCacheLayout=process.env.JMS_BENCH_LOCAL_TT_LAYOUT??'split',
  supportBasisPlanBudgetBytes=Number(process.env.JMS_BENCH_SUPPORT_PLAN_BUDGET??0),
  supportClosurePlan=process.env.JMS_BENCH_SUPPORT_CLOSURES==='1',
  supportReflectionPlan=process.env.JMS_BENCH_SUPPORT_REFLECTION==='1',
  geometry=prepareConnect4RbaGeometry({columns:7,rows:6}),
  counter=await processCycleCounter(),
  cycles0=counter.read(),
  t0=performance.now();

let result;
try{
  result=await runLazySmpConnect4Rba32([],{
    geometry,
    workers:4,
    workerMode:RBA_LAZY_SMP_WORKER_MINIMAL,
    sharedCacheCapacity,
    localCacheCapacity,
    sharedSampleMask:0,
    sharedCacheLayout,
    sharedProofBounds,
    resourceBounds,
    localCacheLayout,
    supportBasisPlanBudgetBytes,
    supportClosurePlan,
    supportReflectionPlan,
    timeoutMs:600000,
    preparedEmptyTiming:true,
  });
}finally{
  // Read before closing the FFI library so the interval includes worker cleanup.
}
const wallMs=performance.now()-t0,
  cycles1=counter.read();
counter.close();

console.log(JSON.stringify({
  kind:'minimal-worker-i5-12600k-prepared-empty-solve-v2',
  runtime:{node:process.version,v8:process.versions.v8},
  platform:{platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model??null,logicalProcessors:os.cpus().length},
  target:{wallTimeMsMax:10000,workers:4,workerMode:RBA_LAZY_SMP_WORKER_MINIMAL},
  configuration:{sharedCacheCapacity,localCacheCapacity,sharedProofBounds:result.sharedProofBounds,resourceBounds:result.resourceBounds,sharedCacheLayout:result.sharedCacheLayout,sharedTtEntryBytes:result.sharedTtEntryBytes,sharedTtBytes:sharedCacheCapacity*result.sharedTtEntryBytes,localCacheLayout:result.localCacheLayout,privateTtEntryBytes:result.privateTtEntryBytes,privateTtBytesPerWorker:localCacheCapacity*result.privateTtEntryBytes,supportBasisPlanBudgetBytes,supportBasisPlanBytes:result.supportBasisPlanBytes,supportBasisPlanProfiles:result.supportBasisPlanProfiles,workers:4,rootFrontier:false,sharedSampleMask:0,policies:["center","live","center","live"]},
  supportClosurePlan:result.supportClosurePlan,
  supportReflectionPlan:result.supportReflectionPlan,
  supportPlanWorkingBytes:result.supportPlanWorkingBytes,
  wallMs:result.preparedTiming.solveMs,
  totalOperationWallMs:wallMs,
  preparedTiming:result.preparedTiming,
  processCycleBoundary:'entire operation including initialization and cleanup; not solve-only cycles',
  processCycles:(cycles1-cycles0).toString(),
  status:result.status,
  rootWdl:result.rootWdl,
  move:result.move,
  winner:result.winner,
  completedWorkers:result.completedWorkers,
  sharedCacheHits:result.sharedCacheHits,
  sharedCacheStores:result.sharedCacheStores,
  sharedCacheStoreContention:result.sharedCacheStoreContention,
  cleanup:result.cleanup,
  workersExited:result.workersExited,
  errorCode:result.errorCode,
},null,2));

if(result.status!=='EXACT')process.exitCode=2;
else if(result.preparedTiming.solveMs>10000)process.exitCode=3;
