import {performance} from 'node:perf_hooks';
import {createManagedThreadSession32,sharedViewBytes32} from './branch-manager-host.mjs';
import {connect4RbaFromMoves} from './rba-connect4-solver.mjs';
import {shareConnect4RbaGeometry32} from './rba-connect4-geometry.mjs';
import {createConnect4RbaSharedExactCache32} from './rba-connect4-shared-exact-cache.mjs';

const CONTROL_STOP=0,CONTROL_DONE=1,CONTROL_ERROR=2,CONTROL_WAKE=3,CONTROL_WINNER=4,
  CONTROL_WORDS=5,RESULT_STRIDE=4,METRIC_WIDTH=15,
  HOST_WORKER_DIED=101,HOST_DEADLINE=102,HOST_CANCELLED=103;

export async function runLazySmpConnect4Rba32(moves,{
  geometry,
  workers=2,
  sharedCacheCapacity=65536,
  sharedExactCache=null,
  localCacheCapacity=65536,
  sharedSampleMask=0,
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
  if(sharedExactCache!==null&&
     (sharedExactCache.keyWords!==geometry.keyWords||!Number.isInteger(sharedExactCache.mask)))
    throw new RangeError('invalid persistent Lazy SMP shared cache');
  if(!Number.isInteger(localCacheCapacity)||localCacheCapacity<1||
     (localCacheCapacity&(localCacheCapacity-1)))
    throw new RangeError('invalid Lazy SMP local cache capacity');
  if(!Number.isInteger(sharedSampleMask)||sharedSampleMask<0||sharedSampleMask>255||
     (sharedSampleMask&(sharedSampleMask+1)))
    throw new RangeError('invalid Lazy SMP shared sample mask');
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0)
    throw new RangeError('invalid Lazy SMP timeout');

  const root=connect4RbaFromMoves(moves,{geometry,positionCode:false}),
    workerGeometry=shareConnect4RbaGeometry32(geometry),
    sharedCache=sharedExactCache??createConnect4RbaSharedExactCache32({
      capacity:sharedCacheCapacity,
      keyWords:geometry.keyWords,
    }),
    control=new Int32Array(new SharedArrayBuffer(CONTROL_WORDS*Int32Array.BYTES_PER_ELEMENT)),
    resultWords=new Int32Array(new SharedArrayBuffer(workers*RESULT_STRIDE*Int32Array.BYTES_PER_ELEMENT)),
    metricBuffer=new SharedArrayBuffer(workers*METRIC_WIDTH*Float64Array.BYTES_PER_ELEMENT),
    metrics=new Float64Array(metricBuffer),
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
  try{
    for(let i=0;i<workers;i+=1)
      session.spawn(
        new URL('./rba-connect4-lazy-smp-worker.mjs',import.meta.url),
        {
          control,
          resultWords,
          metricBuffer,
          workerIndex:i,
          geometry:workerGeometry,
          root,
          rootReflected:root.reflected,
          sharedExactCache:sharedCache,
          localCacheCapacity,
          sharedSampleMask,
          cpcFrontierResponse,
          cpcProjectedAdvisory,
        },
      );
    await session.wait({timeoutMs,signal});
  }finally{
    await session.close();
  }

  const elapsedMs=performance.now()-started,
    host=session.state(),
    winner=Atomics.load(control,CONTROL_WINNER),
    errorCode=host.errorCode,
    exact=!errorCode&&Atomics.load(control,CONTROL_DONE)===1&&winner>=0,
    completedWorkers=new Array(workers);
  for(let i=0;i<workers;i+=1)completedWorkers[i]=Atomics.load(resultWords,i*RESULT_STRIDE+3);

  let winnerMetrics=null;
  if(exact){
    const base=winner*METRIC_WIDTH;
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
  }

  return {
    status:exact?'EXACT':
      errorCode===HOST_DEADLINE?'TIMEOUT':
      errorCode===HOST_CANCELLED?'INTERRUPTED':'FAILED',
    rootWdl:exact?Atomics.load(resultWords,winner*RESULT_STRIDE)-2:null,
    move:exact?Atomics.load(resultWords,winner*RESULT_STRIDE+2):-1,
    winner,
    winnerMetrics,
    sharedCacheHits:Atomics.load(sharedCache.stats,0),
    sharedCacheStores:Atomics.load(sharedCache.stats,1),
    sharedCacheStoreContention:Atomics.load(sharedCache.stats,2),
    sharedSampleMask,
    completedWorkers,
    reflected:root.reflected,
    elapsedMs,
    errorCode,
    errors:host.errors,
    cleanup:host.cleanup,
    workersExited:host.workersExited,
    requestedWorkers:workers,
    workersUsed:workers,
    sharedBytes:sharedViewBytes32(sharedCache)+sharedViewBytes32(workerGeometry)+
      control.byteLength+resultWords.byteLength+metricBuffer.byteLength,
  };
}
