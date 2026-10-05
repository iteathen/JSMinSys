// Frozen lean host with explicit cold audit corrections; reproduced by prepare.mjs.
import {prepareLeanExecutionProfile} from './execution-profile.mjs';
import {performance} from 'node:perf_hooks';
import {createManagedThreadSession32,sharedViewBytes32} from '../../addons/branch-manager-host.mjs';
import {validateConnect4CacheCapacity32} from '../../addons/rba-connect4-cache-capacity.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {shareConnect4RbaGeometry32} from '../../addons/rba-connect4-geometry.mjs';
import {createConnect4RbaSharedExactCache32,isCompactProfile8,prepareSharedCacheLayout} from './shared-cache.mjs';
import {createWorkerBehaviorMemory32} from '../../addons/worker-behavior.mjs';

const CONTROL_STOP=0,CONTROL_DONE=1,CONTROL_ERROR=2,CONTROL_WAKE=3,CONTROL_WINNER=4,
  CONTROL_WORDS=5,RESULT_STRIDE=4,
  HOST_WORKER_DIED=101,HOST_DEADLINE=102,HOST_CANCELLED=103;

export async function runLazySmpConnect4Rba32(moves,options={}){
  const app=await prepareLazySmpConnect4Rba32(options);
  return app.solve(moves);
}

// Initialization prepares every shared/private table and worker before resolving.
// A prepared application owns one solve and must be closed if left idle.
export async function prepareLazySmpConnect4Rba32({
  geometry,workers=2,sharedCacheCapacity=65536,localCacheCapacity=65536,
  sharedSampleMask=0,timeoutMs=120000,initializationTimeoutMs=120000,signal,
  cpcFrontierResponse=false,cpcProjectedAdvisory=false,behaviorMemory=null,rootFrontier=false,
}={}){
  const initializationStarted=performance.now();
  if(!geometry)throw new TypeError('prepared Connect4 RBA geometry required');
  if(!Number.isInteger(workers)||workers<2||workers>64)
    throw new RangeError('Lazy SMP requires at least two search workers');
  validateConnect4CacheCapacity32(localCacheCapacity,isCompactProfile8(geometry,geometry.keyWords)?8:geometry.keyWords);
  const sharedLayout=prepareSharedCacheLayout(geometry,geometry.keyWords);
  validateConnect4CacheCapacity32(sharedCacheCapacity,sharedLayout.kind==='compact32'?16:sharedLayout.entryBytes/sharedLayout.heightBytes);
  if(!Number.isInteger(sharedSampleMask)||sharedSampleMask<0||sharedSampleMask>255||
     (sharedSampleMask&(sharedSampleMask+1)))throw new RangeError('invalid Lazy SMP shared sample mask');
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0||!Number.isFinite(initializationTimeoutMs)||initializationTimeoutMs<=0)
    throw new RangeError('invalid Lazy SMP timeout');
  if(rootFrontier)throw RangeError('lean profile is deep only');
  if(sharedSampleMask!==0)throw RangeError('lean profile requires sample mask zero');
  if(cpcFrontierResponse||cpcProjectedAdvisory)throw RangeError('lean profile requires baseline CPC');
  if(behaviorMemory===null)behaviorMemory=createWorkerBehaviorMemory32(workers);
  if(!(behaviorMemory instanceof WebAssembly.Memory)||!(behaviorMemory.buffer instanceof SharedArrayBuffer)||behaviorMemory.buffer.byteLength<workers*128)
    throw new TypeError('prepared shared behavior memory required');
  const executionProfile=prepareLeanExecutionProfile(geometry),
    workerUrl=new URL(executionProfile.worker,import.meta.url),
    workerGeometry=shareConnect4RbaGeometry32(geometry),
    sharedExactCache=createConnect4RbaSharedExactCache32({capacity:sharedCacheCapacity,keyWords:geometry.keyWords,geometry}),
    control=new Int32Array(new SharedArrayBuffer(CONTROL_WORDS*4)),
    resultWords=new Int32Array(new SharedArrayBuffer(workers*RESULT_STRIDE*4)),
    timingBuffer=new SharedArrayBuffer(workers*64),
    session=createManagedThreadSession32({control,stopIndex:CONTROL_STOP,doneIndex:CONTROL_DONE,errorIndex:CONTROL_ERROR,
      wakeIndex:CONTROL_WAKE,workerDiedCode:HOST_WORKER_DIED,deadlineCode:HOST_DEADLINE,cancelledCode:HOST_CANCELLED});
  control[CONTROL_WINNER]=-1;
  sharedExactCache.entries.fill(0);
  let readyWorkers=0,phase='INITIALIZING',searchStarted=false,closePromise,cleanupMs=0;
  const close=()=>{
    if(!closePromise){
      if(phase==='SEARCHING'&&!Atomics.load(control,CONTROL_DONE)&&!Atomics.load(control,CONTROL_STOP))session.fail(HOST_CANCELLED);
      phase='CLOSED';const start=performance.now();
      closePromise=session.close().then(()=>{cleanupMs=performance.now()-start;});
    }
    return closePromise;
  };
  try{
    await new Promise((resolve,reject)=>{
      let timer,settled=false;const listeners=[];
      const finish=error=>{
        if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);
        for(const [worker,onReady,onError,onExit] of listeners){worker.off('message',onReady);worker.off('error',onError);worker.off('exit',onExit);}
        if(error)reject(error);else resolve();
      };
      const abort=()=>{session.fail(HOST_CANCELLED);finish(new Error('worker initialization aborted'));};
      const deadline=()=>{
        const remaining=initializationTimeoutMs-(performance.now()-initializationStarted);
        if(remaining>0){timer=setTimeout(deadline,Math.min(Math.ceil(remaining),2147483647));return;}
        session.fail(HOST_DEADLINE);finish(new Error('worker initialization timed out'));
      };
      if(signal?.aborted){abort();return;}
      signal?.addEventListener('abort',abort,{once:true});
      timer=setTimeout(deadline,Math.min(Math.ceil(initializationTimeoutMs),2147483647));
      try{for(let i=0;i<workers;i+=1){
        const worker=session.spawn(workerUrl,{control,resultWords,timingBuffer,workerIndex:i,workerCount:workers,
          behaviorMemory,geometry:workerGeometry,sharedExactCache,localCacheCapacity,sharedSampleMask,cpcFrontierResponse,cpcProjectedAdvisory});
        const onReady=message=>{
          if(message!=='ISOMAX_READY')return;
          worker.off('message',onReady);readyWorkers+=1;if(readyWorkers===workers)finish();
        },onError=error=>finish(error),onExit=code=>finish(new Error('worker exited before start: '+code));
        listeners.push([worker,onReady,onError,onExit]);worker.on('message',onReady);worker.once('error',onError);worker.once('exit',onExit);
      }}catch(error){finish(error);}
    });
  }catch(error){await close();throw error;}
  phase='READY';const initializationMs=performance.now()-initializationStarted;
  return {
    state:()=>({...session.state(),phase,readyWorkers,searchStarted,initializationMs,cleanupMs}),close,
    async solve(moves){
      if(phase!=='READY')throw new Error('prepared IsoMax application is one-shot and must be ready');
      phase='SEARCHING';searchStarted=true;
      const started=performance.now();let root,solveElapsedMs;
      try{
        if(signal?.aborted)session.fail(HOST_CANCELLED);
        if(!session.state().errorCode){
          root=connect4RbaFromMoves(moves,{geometry,positionCode:false});
          for(const worker of session.threads)worker.postMessage(root);
        }
        const remaining=timeoutMs-(performance.now()-started);
        if(remaining<=0&&!Atomics.load(control,CONTROL_DONE))session.fail(HOST_DEADLINE);
        await session.wait({timeoutMs:Math.max(1,remaining),signal});solveElapsedMs=performance.now()-started;
      }finally{await close();}
      const host=session.state(),winner=Atomics.load(control,CONTROL_WINNER),errorCode=host.errorCode,
        exact=!errorCode&&Atomics.load(control,CONTROL_DONE)===1&&winner>=0;
      return {
        status:exact?'EXACT':errorCode===HOST_DEADLINE?'TIMEOUT':errorCode===HOST_CANCELLED?'INTERRUPTED':'FAILED',
        rootWdl:exact?Atomics.load(resultWords,winner*RESULT_STRIDE)-2:null,
        move:exact?Atomics.load(resultWords,winner*RESULT_STRIDE+2):-1,winner,executionProfile,
        winnerMetrics:null,nodeCounts:null,workerTiming:Array.from({length:workers},(_,i)=>Array.from(new Float64Array(timingBuffer,i*64,2))),
        frontierMetrics:null,sharedCacheHits:null,sharedCacheStores:null,sharedCacheStoreContention:null,sharedSampleMask,
        completedWorkers:Array.from({length:workers},(_,i)=>Atomics.load(resultWords,i*RESULT_STRIDE+3)),
        reflected:root?.reflected??false,elapsedMs:solveElapsedMs+cleanupMs,solveElapsedMs,initializationMs,cleanupMs,readyWorkers,
        errorCode,errors:host.errors,cleanup:host.cleanup,workersExited:host.workersExited,requestedWorkers:workers,workersUsed:workers,
        sharedBytes:sharedExactCache.entries.buffer.byteLength+sharedViewBytes32(workerGeometry)+control.byteLength+resultWords.byteLength+behaviorMemory.buffer.byteLength+timingBuffer.byteLength,
      };
    },
  };
}
