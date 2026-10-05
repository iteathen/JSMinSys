import {performance} from 'node:perf_hooks';
import {createManagedThreadSession32,sharedViewBytes32} from './branch-manager-host.mjs';
import {connect4RbaFromMoves} from './rba-connect4-ingress.mjs';
import {shareConnect4RbaGeometry32} from './rba-connect4-geometry.mjs';
import {createConnect4RbaSharedExactCache32,isCompactProfile8} from './rba-connect4-shared-exact-cache.mjs';
import {validateConnect4CacheCapacity32} from './rba-connect4-cache-capacity.mjs';
import {createWorkerBehaviorMemory32,publishWorkerBehavior32} from './worker-behavior.mjs';
import {encodeRootFrontier32} from './worker-root-frontier.mjs';
import {prepareLazySmpConnect4Rba32} from './rba-connect4-prepared-session-host.mjs';
export {prepareLazySmpConnect4Rba32} from './rba-connect4-prepared-session-host.mjs';

export const RBA_LAZY_SMP_WORKER_LEGACY='legacy';
export const RBA_LAZY_SMP_WORKER_MINIMAL='minimal';

const CONTROL_STOP=0,CONTROL_DONE=1,CONTROL_ERROR=2,CONTROL_WAKE=3,CONTROL_WINNER=4,
  CONTROL_WORDS=5,RESULT_STRIDE=4,METRIC_WIDTH=15,
  HOST_WORKER_DIED=101,HOST_DEADLINE=102,HOST_CANCELLED=103;

export async function runLazySmpConnect4Rba32(moves,{
  geometry,
  workers=2,
  sharedCacheCapacity=65536,
  localCacheCapacity=65536,
  sharedSampleMask=0,
  timeoutMs=120000,
  signal,
  cpcFrontierResponse=false,
  cpcProjectedAdvisory=false,
  behaviorMemory=null,
  rootFrontier=false,
  workerMode=RBA_LAZY_SMP_WORKER_LEGACY,
  preparedEmptyTiming=false,
  sharedCacheLayout='auto',
  sharedProofBounds=false,
  supportBasisPlanBudgetBytes=0,
  supportClosurePlan=false,supportReflectionPlan=false,
  supportPlanWorkerTarget=null,
}={}){
  const initializationStarted=performance.now();
  if(preparedEmptyTiming&&(workerMode!==RBA_LAZY_SMP_WORKER_MINIMAL||moves.length!==0))
    throw new TypeError('prepared timing requires an empty minimal solve');
  if(!geometry)throw new TypeError('prepared Connect4 RBA geometry required');
  if(!Number.isInteger(workers)||workers<2||workers>64)
    throw new RangeError('Lazy SMP requires at least two search workers');
  const cacheKeyWords=isCompactProfile8(geometry,geometry.keyWords)?8:geometry.keyWords;
  validateConnect4CacheCapacity32(sharedCacheCapacity,cacheKeyWords);
  validateConnect4CacheCapacity32(localCacheCapacity,cacheKeyWords);
  if(!Number.isInteger(sharedSampleMask)||sharedSampleMask<0||sharedSampleMask>255||
     (sharedSampleMask&(sharedSampleMask+1)))
    throw new RangeError('invalid Lazy SMP shared sample mask');
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0)
    throw new RangeError('invalid Lazy SMP timeout');
  if(typeof rootFrontier!=='boolean')throw new TypeError('rootFrontier must be boolean');
  if(workerMode!==RBA_LAZY_SMP_WORKER_LEGACY&&workerMode!==RBA_LAZY_SMP_WORKER_MINIMAL)
    throw new RangeError('invalid Lazy SMP worker mode');
  if(typeof sharedProofBounds!=='boolean'||(sharedProofBounds&&workerMode!==RBA_LAZY_SMP_WORKER_MINIMAL))
    throw new TypeError('shared proof bounds require a homogeneous minimal pool');
  if(!Number.isSafeInteger(supportBasisPlanBudgetBytes)||supportBasisPlanBudgetBytes<0||(supportBasisPlanBudgetBytes&&workerMode!==RBA_LAZY_SMP_WORKER_MINIMAL))
    throw new TypeError('support plans require minimal workers and a nonnegative budget');
  if(typeof supportClosurePlan!=='boolean'||(supportClosurePlan&&workerMode!==RBA_LAZY_SMP_WORKER_MINIMAL))throw new TypeError('support closures require minimal workers');
  if(typeof supportReflectionPlan!=='boolean'||(supportReflectionPlan&&!supportClosurePlan))throw new TypeError('reflection requires support closures');
  if(supportPlanWorkerTarget!==null&&workerMode!==RBA_LAZY_SMP_WORKER_MINIMAL)throw new TypeError('support-worker requires minimal prepared application');
  if(workerMode===RBA_LAZY_SMP_WORKER_MINIMAL&&
     (rootFrontier||behaviorMemory!==null||cpcFrontierResponse||cpcProjectedAdvisory))
    throw new TypeError('minimal Lazy SMP worker does not support legacy behavior/CPC options');
  if(workerMode===RBA_LAZY_SMP_WORKER_MINIMAL){
    const prepared=await prepareLazySmpConnect4Rba32({geometry,workers,sharedCacheCapacity,
      localCacheCapacity,sharedSampleMask,timeoutMs,signal,workerMode,sharedCacheLayout,sharedProofBounds,supportBasisPlanBudgetBytes,supportClosurePlan,supportReflectionPlan,supportPlanWorkerTarget});
    try{return await prepared.solve(moves);}finally{await prepared.close();}
  }
  if(sharedCacheLayout==='auto')sharedCacheLayout='split40';
  if(sharedCacheLayout!=='split40')throw new TypeError('native shared TT requires minimal workers');
  if(rootFrontier){
    if(behaviorMemory!==null)throw new TypeError('rootFrontier owns initial behavior memory');
    behaviorMemory=createWorkerBehaviorMemory32(workers);
    const words=new Uint32Array(behaviorMemory.buffer);
    for(let i=0;i<workers;i+=1)publishWorkerBehavior32(words,i,encodeRootFrontier32({release:i!==0}));
  }
  if(behaviorMemory!==null&&(!(behaviorMemory instanceof WebAssembly.Memory)||
     !(behaviorMemory.buffer instanceof SharedArrayBuffer)||behaviorMemory.buffer.byteLength<workers*128))
    throw new TypeError('prepared shared behavior memory required');

  const readyGate=preparedEmptyTiming?new Int32Array(new SharedArrayBuffer(12)):null,
    root=preparedEmptyTiming?{
      words:new Uint32Array(new SharedArrayBuffer(geometry.keyWords*4)),
      basis:new Uint32Array(new SharedArrayBuffer(geometry.maxBasis*4)),
      reflected:0,moveHistory:[],
    }:connect4RbaFromMoves(moves,{geometry,positionCode:false}),
    workerGeometry=shareConnect4RbaGeometry32(geometry),
    sharedExactCache=createConnect4RbaSharedExactCache32({
      capacity:sharedCacheCapacity,
      keyWords:geometry.keyWords,
      geometry,
    }),
    control=new Int32Array(new SharedArrayBuffer(CONTROL_WORDS*Int32Array.BYTES_PER_ELEMENT)),
    resultWords=new Int32Array(new SharedArrayBuffer(workers*RESULT_STRIDE*Int32Array.BYTES_PER_ELEMENT)),
    metricBuffer=workerMode===RBA_LAZY_SMP_WORKER_MINIMAL?null:
      new SharedArrayBuffer(workers*METRIC_WIDTH*Float64Array.BYTES_PER_ELEMENT),
    metrics=metricBuffer===null?null:new Float64Array(metricBuffer),
    nodeCounterBuffer=rootFrontier?new SharedArrayBuffer(workers*64):null,
    timingBuffer=rootFrontier?new SharedArrayBuffer(workers*64):null,
    frontierMetricBuffer=rootFrontier?new SharedArrayBuffer(workers*32):null,
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

  // Initialize actual backing pages with empty data; no search/proof warm-up.
  if(readyGate){sharedExactCache.sequence.fill(0);sharedExactCache.value.fill(0);sharedExactCache.keys.fill(0);}

  const started=performance.now();
  let searchStarted=null,searchFinished=null,cleanupStarted=null;
  try{
    for(let i=0;i<workers;i+=1)
      session.spawn(
        new URL(rootFrontier?'./rba-connect4-lazy-smp-worker-frontier.mjs':behaviorMemory!==null?'./rba-connect4-lazy-smp-worker-behavior.mjs':
          workerMode===RBA_LAZY_SMP_WORKER_MINIMAL?((i&1)===0?'./rba-connect4-lazy-smp-worker-minimal-center.mjs':'./rba-connect4-lazy-smp-worker-minimal.mjs'):'./rba-connect4-lazy-smp-worker.mjs',import.meta.url),
        {
          control,
          resultWords,
          metricBuffer,
          nodeCounterBuffer,
          timingBuffer,
          frontierMetricBuffer,
          workerIndex:i,
          workerCount:workers,
          behaviorMemory,
          geometry:workerGeometry,
          root,
          rootReflected:root.reflected,
          sharedExactCache,
          localCacheCapacity,
          sharedSampleMask,
          cpcFrontierResponse,
          cpcProjectedAdvisory,
          readyGate,
        },
      );
    if(readyGate){
      while(Atomics.load(readyGate,0)!==workers){
        if(Atomics.load(control,CONTROL_ERROR)||signal?.aborted||performance.now()-started>30000)
          throw new Error('prepared worker initialization failed or timed out');
        await new Promise(resolve=>setTimeout(resolve,5));
      }
      searchStarted=performance.now();
      const actualRoot=connect4RbaFromMoves(moves,{geometry,positionCode:false});
      if(actualRoot.reflected)throw new Error('empty root unexpectedly reflected');
      root.words.set(actualRoot.words);root.basis.set(actualRoot.basis);
      Atomics.store(readyGate,2,actualRoot.basis.length);
      Atomics.store(readyGate,1,1);Atomics.notify(readyGate,1);
    }
    await session.wait({timeoutMs,signal});
    searchFinished=performance.now();
  }finally{
    cleanupStarted=performance.now();
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
  if(exact&&metrics!==null){
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
    nodeCounts:rootFrontier?Array.from({length:workers},(_,i)=>new Float64Array(nodeCounterBuffer,i*64,1)[0]):null,
    workerTiming:rootFrontier?Array.from({length:workers},(_,i)=>Array.from(new Float64Array(timingBuffer,i*64,2))):null,
    frontierMetrics:rootFrontier?Array.from({length:workers},(_,i)=>Array.from(new Float64Array(frontierMetricBuffer,i*32,4))):null,
    sharedCacheHits:workerMode===RBA_LAZY_SMP_WORKER_MINIMAL?null:Atomics.load(sharedExactCache.stats,0),
    sharedCacheStores:workerMode===RBA_LAZY_SMP_WORKER_MINIMAL?null:Atomics.load(sharedExactCache.stats,1),
    sharedCacheStoreContention:workerMode===RBA_LAZY_SMP_WORKER_MINIMAL?null:Atomics.load(sharedExactCache.stats,2),
    sharedSampleMask,
    workerMode,
    completedWorkers,
    reflected:root.reflected,
    elapsedMs,
    preparedTiming:readyGate?{
      readyWorkers:Atomics.load(readyGate,0),rootConstructedAfterReady:true,
      initializationMs:searchStarted-initializationStarted,
      solveMs:searchFinished-searchStarted,cleanupMs:performance.now()-cleanupStarted,
      boundary:'all workers ready and empty TT pages initialized -> empty root construction -> exact result observed; cleanup separate',
    }:null,
    errorCode,
    errors:host.errors,
    cleanup:host.cleanup,
    workersExited:host.workersExited,
    requestedWorkers:workers,
    workersUsed:workers,
    sharedBytes:sharedViewBytes32(sharedExactCache)+sharedViewBytes32(workerGeometry)+
      control.byteLength+resultWords.byteLength+(metricBuffer===null?0:metricBuffer.byteLength)+(behaviorMemory===null?0:behaviorMemory.buffer.byteLength)+
      (rootFrontier?nodeCounterBuffer.byteLength+timingBuffer.byteLength+frontierMetricBuffer.byteLength:0),
  };
}
