import {performance} from 'node:perf_hooks';
import {createManagedThreadSession32,sharedViewBytes32} from './branch-manager-host.mjs';
import {connect4RbaFromMoves} from './rba-connect4-solver.mjs';
import {shareConnect4RbaGeometry32} from './rba-connect4-geometry.mjs';
import {createConnect4RbaSharedExactCache32} from './rba-connect4-shared-exact-cache.mjs';

const CONTROL_STOP=0,CONTROL_DONE=1,CONTROL_ERROR=2,CONTROL_WAKE=3,CONTROL_WINNER=4,
  CONTROL_WORDS=5,RESULT_STRIDE=4,METRIC_WIDTH=15,TIMING_WIDTH=6,
  HOST_WORKER_DIED=101,HOST_DEADLINE=102,HOST_CANCELLED=103;

export async function runLazySmpConnect4Rba32(moves,{
  geometry,
  workers=2,
  sharedCacheCapacity=65536,
  localCacheCapacity=65536,
  sharedSampleMask=0,
  diagnosticSampleMask=-1,
  timeoutMs=120000,
  signal,
  cpcFrontierResponse=false,
  cpcProjectedAdvisory=false,
}={}){
  if(!geometry)throw new TypeError('prepared Connect4 RBA geometry required');
  if(!Number.isInteger(workers)||workers<2||workers>64)
    throw new RangeError('Lazy SMP requires at least two search workers');
  if(!Number.isInteger(sharedCacheCapacity)||sharedCacheCapacity<1||
     (sharedCacheCapacity&(sharedCacheCapacity-1)))
    throw new RangeError('invalid Lazy SMP shared cache capacity');
  if(!Number.isInteger(localCacheCapacity)||localCacheCapacity<1||
     (localCacheCapacity&(localCacheCapacity-1)))
    throw new RangeError('invalid Lazy SMP local cache capacity');
  if(!Number.isInteger(sharedSampleMask)||sharedSampleMask<0||sharedSampleMask>255||
     (sharedSampleMask&(sharedSampleMask+1)))
    throw new RangeError('invalid Lazy SMP shared sample mask');
  if(!Number.isInteger(diagnosticSampleMask)||diagnosticSampleMask < -1||
     diagnosticSampleMask>255||
     (diagnosticSampleMask>=0&&(diagnosticSampleMask&(diagnosticSampleMask+1))))
    throw new RangeError('invalid Lazy SMP diagnostic sample mask');
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0)
    throw new RangeError('invalid Lazy SMP timeout');

  const root=connect4RbaFromMoves(moves,{geometry,positionCode:false}),
    workerGeometry=shareConnect4RbaGeometry32(geometry),
    sharedExactCache=createConnect4RbaSharedExactCache32({
      capacity:sharedCacheCapacity,
      keyWords:geometry.keyWords,
      diagnosticSampleMask,
      diagnosticMetaOffset:geometry.metaOffset,
      diagnosticRankCount:geometry.cellCount+1,
    }),
    control=new Int32Array(new SharedArrayBuffer(CONTROL_WORDS*Int32Array.BYTES_PER_ELEMENT)),
    resultWords=new Int32Array(new SharedArrayBuffer(workers*RESULT_STRIDE*Int32Array.BYTES_PER_ELEMENT)),
    metricBuffer=new SharedArrayBuffer(workers*METRIC_WIDTH*Float64Array.BYTES_PER_ELEMENT),
    metrics=new Float64Array(metricBuffer),
    timingBuffer=new SharedArrayBuffer(workers*TIMING_WIDTH*Float64Array.BYTES_PER_ELEMENT),
    timings=new Float64Array(timingBuffer),
    session=createManagedThreadSession32({
      control,
      stopIndex:CONTROL_STOP,
      doneIndex:CONTROL_DONE,
      errorIndex:CONTROL_ERROR,
      wakeIndex:CONTROL_WAKE,
      workerDiedCode:HOST_WORKER_DIED,
      deadlineCode:HOST_DEADLINE,
      cancelledCode:HOST_CANCELLED,
    });
  control[CONTROL_WINNER]=-1;

  const started=performance.now();
  let waitReturnedAt=0,closeCompletedAt=0;
  try{
    for(let i=0;i<workers;i+=1)
      session.spawn(
        new URL('./rba-connect4-lazy-smp-worker.mjs',import.meta.url),
        {
          control,
          resultWords,
          metricBuffer,
          timingBuffer,
          workerIndex:i,
          geometry:workerGeometry,
          root,
          rootReflected:root.reflected,
          sharedExactCache,
          localCacheCapacity,
          sharedSampleMask,
          cpcFrontierResponse,
          cpcProjectedAdvisory,
        },
      );
    await session.wait({timeoutMs,signal});
    waitReturnedAt=performance.timeOrigin+performance.now();
  }finally{
    await session.close();
    closeCompletedAt=performance.timeOrigin+performance.now();
  }

  const elapsedMs=performance.now()-started,
    host=session.state(),
    winner=Atomics.load(control,CONTROL_WINNER),
    errorCode=host.errorCode,
    exact=!errorCode&&Atomics.load(control,CONTROL_DONE)===1&&winner>=0,
    completedWorkers=new Array(workers);
  let completedCount=0;
  for(let i=0;i<workers;i+=1){
    const completed=Atomics.load(resultWords,i*RESULT_STRIDE+3);
    completedWorkers[i]=completed;
    completedCount+=completed?1:0;
  }

  let winnerMetrics=null,winnerTiming=null;
  if(exact){
    const base=winner*METRIC_WIDTH,timingBase=winner*TIMING_WIDTH;
    winnerMetrics={
      nodes:metrics[base],
      cutoffs:metrics[base+1],
      cacheHits:metrics[base+2],
      cpcExact:metrics[base+3],
      cpcBounds:metrics[base+4],
      cpcRestrictions:metrics[base+5],
      cpcForced:metrics[base+6],
      cpcPrecursors:metrics[base+7],
      cpcProjectedForks:metrics[base+8],
      frontCalls:metrics[base+9],
      frontExact:metrics[base+10],
      frontFailures:metrics[base+11],
      frontSteps:metrics[base+12],
      frontActionExact:metrics[base+13],
      cofactors:metrics[base+14],
    };
    winnerTiming={
      solveMs:timings[timingBase+1]-timings[timingBase],
      solveToPublishMs:timings[timingBase+2]-timings[timingBase+1],
      publishToCasMs:timings[timingBase+3]-timings[timingBase+2],
      casToSignalMs:timings[timingBase+4]-timings[timingBase+3],
      signalToHostObserveMs:waitReturnedAt-timings[timingBase+4],
      hostObserveToCleanupMs:closeCompletedAt-waitReturnedAt,
    };
  }

  return {
    status:exact?'EXACT':
      errorCode===HOST_DEADLINE?'TIMEOUT':
      errorCode===HOST_CANCELLED?'INTERRUPTED':'FAILED',
    rootWdl:exact?Atomics.load(resultWords,winner*RESULT_STRIDE)-2:null,
    move:exact?Atomics.load(resultWords,winner*RESULT_STRIDE+2):-1,
    winner,
    winnerMetrics,
    winnerTiming,
    sharedCacheHits:Atomics.load(sharedExactCache.stats,0),
    sharedCacheStores:Atomics.load(sharedExactCache.stats,1),
    sharedCacheStoreContention:Atomics.load(sharedExactCache.stats,2),
    diagnosticEligibleHits:Atomics.load(sharedExactCache.stats,3),
    diagnosticExcludedHits:Atomics.load(sharedExactCache.stats,4),
    diagnosticEligibleStores:Atomics.load(sharedExactCache.stats,5),
    diagnosticExcludedStores:Atomics.load(sharedExactCache.stats,6),
    diagnosticSameKeyReplacements:Atomics.load(sharedExactCache.stats,7),
    diagnosticCollisionReplacements:Atomics.load(sharedExactCache.stats,8),
    diagnosticSampleMask,
    diagnosticRankHits:sharedExactCache.diagnosticRankHits?Array.from(sharedExactCache.diagnosticRankHits):null,
    sharedSampleMask,
    completedWorkers,
    completedCount,
    reflected:root.reflected,
    elapsedMs,
    errorCode,
    errors:host.errors,
    cleanup:host.cleanup,
    workersExited:host.workersExited,
    requestedWorkers:workers,
    workersUsed:workers,
    sharedBytes:sharedViewBytes32(sharedExactCache)+sharedViewBytes32(workerGeometry)+
      control.byteLength+resultWords.byteLength+metricBuffer.byteLength+timingBuffer.byteLength,
  };
}
