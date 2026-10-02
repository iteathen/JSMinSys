// Experimental role selection only; the frozen solver and affinity preload stay unchanged.
import '../../tools/worker-affinity-preload.mjs';
import {isMainThread,workerData} from 'node:worker_threads';

if(!isMainThread){
  const {writeFileSync}=await import('node:fs');
  const {publishWorkerBehavior32,WORKER_BEHAVIOR_STRIDE32}=await import('../../addons/worker-behavior.mjs');
  const {encodeRootFrontier32}=await import('../../addons/worker-root-frontier.mjs');
  const index=workerData?.workerIndex;
  if(!Number.isInteger(index)||index<0||index>=4||workerData.workerCount!==4)
    throw Error('four-deep experiment requires exactly four indexed workers');
  if(!(workerData.behaviorMemory instanceof WebAssembly.Memory))
    throw Error('native root-frontier behavior memory missing');
  const words=new Uint32Array(workerData.behaviorMemory.buffer);
  const before=Atomics.load(words,index*WORKER_BEHAVIOR_STRIDE32);
  const expectedBefore=encodeRootFrontier32({release:index!==0});
  if(before!==expectedBefore)throw Error('unexpected initial worker role');
  const deepFlags=encodeRootFrontier32({release:true});
  if(index===0)publishWorkerBehavior32(words,index,deepFlags);
  const after=Atomics.load(words,index*WORKER_BEHAVIOR_STRIDE32);
  if(after!==deepFlags)throw Error('worker did not enter released deep mode');
  const prefix=process.env.JMS_WORKER_AFFINITY_REPORT;
  if(!prefix)throw Error('missing role evidence path');
  writeFileSync(`${prefix}-${index}-role.json`,JSON.stringify({
    index,role:'DEEP',before,after,changed:index===0,
    beforeSolverInitialization:true,nativeWorkerImplementationUnchanged:true,
  })+'\n',{flag:'wx'});
}
