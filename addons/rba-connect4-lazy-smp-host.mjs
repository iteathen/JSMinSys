import {performance} from 'node:perf_hooks';
import {createManagedThreadSession32,sharedViewBytes32} from './branch-manager-host.mjs';
import {connect4RbaFromMoves} from './rba-connect4-solver.mjs';
import {shareConnect4RbaGeometry32} from './rba-connect4-geometry.mjs';
import {createConnect4RbaSharedExactCache32} from './rba-connect4-shared-exact-cache.mjs';

const CONTROL_STOP=0,CONTROL_DONE=1,CONTROL_ERROR=2,CONTROL_WAKE=3,CONTROL_WINNER=4,
  CONTROL_WORDS=5,RESULT_STRIDE=4,METRIC_WIDTH=15,
  DIAG_VALUE=0,DIAG_RANK=3,DIAG_DENSITY=46,DIAG_LEGAL=51,DIAG_WIDTH=59,
  HOST_WORKER_DIED=101,HOST_DEADLINE=102,HOST_CANCELLED=103;

export async function runLazySmpConnect4Rba32(moves,{
  geometry,
  workers=2,
  sharedCacheCapacity=65536,
  localCacheCapacity=65536,
  sharedSampleMask=0,
  diagnosticLeverage=false,
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
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0)
    throw new RangeError('invalid Lazy SMP timeout');

  const root=connect4RbaFromMoves(moves,{geometry,positionCode:false}),
    workerGeometry=shareConnect4RbaGeometry32(geometry),
    sharedExactCache=createConnect4RbaSharedExactCache32({
      capacity:sharedCacheCapacity,
      keyWords:geometry.keyWords,
      diagnosticWorkers:diagnosticLeverage?workers:0,
      diagnosticMetaOffset:geometry.metaOffset,
      diagnosticP0Offset:geometry.p0Offset,
      diagnosticCoordWords:geometry.coordWords,
      diagnosticColumns:geometry.columns,
      diagnosticRows:geometry.rows,
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
          sharedExactCache,
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

  let leverageDiagnostics=null;
  if(sharedExactCache.diagnosticStores){
    const stores=sharedExactCache.diagnosticStores,cross=sharedExactCache.diagnosticCrossHits,
      all=new Uint32Array(DIAG_WIDTH),
      storeValue=new Array(3),storeRank=new Array(43),storeDensity=new Array(5),storeLegal=new Array(8),
      allValue=new Array(3),allRank=new Array(43),allDensity=new Array(5),allLegal=new Array(8),
      winnerValue=winner>=0?new Array(3):null,winnerRank=winner>=0?new Array(43):null,
      winnerDensity=winner>=0?new Array(5):null,winnerLegal=winner>=0?new Array(8):null;
    for(let w=0;w<workers;w+=1){
      const base=w*DIAG_WIDTH;
      for(let i=0;i<DIAG_WIDTH;i+=1)all[i]+=cross[base+i];
    }
    for(let i=0;i<3;i+=1){storeValue[i]=stores[DIAG_VALUE+i];allValue[i]=all[DIAG_VALUE+i];}
    for(let i=0;i<43;i+=1){storeRank[i]=stores[DIAG_RANK+i];allRank[i]=all[DIAG_RANK+i];}
    for(let i=0;i<5;i+=1){storeDensity[i]=stores[DIAG_DENSITY+i];allDensity[i]=all[DIAG_DENSITY+i];}
    for(let i=0;i<8;i+=1){storeLegal[i]=stores[DIAG_LEGAL+i];allLegal[i]=all[DIAG_LEGAL+i];}
    if(winner>=0){
      const base=winner*DIAG_WIDTH;
      for(let i=0;i<3;i+=1)winnerValue[i]=cross[base+DIAG_VALUE+i];
      for(let i=0;i<43;i+=1)winnerRank[i]=cross[base+DIAG_RANK+i];
      for(let i=0;i<5;i+=1)winnerDensity[i]=cross[base+DIAG_DENSITY+i];
      for(let i=0;i<8;i+=1)winnerLegal[i]=cross[base+DIAG_LEGAL+i];
    }
    leverageDiagnostics={
      stores:{value:storeValue,rank:storeRank,density:storeDensity,legal:storeLegal},
      crossHitsAll:{value:allValue,rank:allRank,density:allDensity,legal:allLegal},
      crossHitsWinner:winner>=0?{value:winnerValue,rank:winnerRank,density:winnerDensity,legal:winnerLegal}:null,
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
    leverageDiagnostics,
    sharedCacheHits:Atomics.load(sharedExactCache.stats,0),
    sharedCacheStores:Atomics.load(sharedExactCache.stats,1),
    sharedCacheStoreContention:Atomics.load(sharedExactCache.stats,2),
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
    sharedBytes:sharedViewBytes32(sharedExactCache)+sharedViewBytes32(workerGeometry)+
      control.byteLength+resultWords.byteLength+metricBuffer.byteLength,
  };
}
