// Cold Worker entry point: bind before loading application code or TT setup.
import {isMainThread,workerData} from 'node:worker_threads';
import {configureCurrentWorkerAffinity} from './worker-pinning.mjs';
if(!isMainThread&&workerData?.workerAffinityTarget){
 const actual=await configureCurrentWorkerAffinity(workerData.workerAffinityTarget),
  report=workerData.workerAffinityState,index=workerData.workerIndex;
 if(!(report instanceof Int32Array)||!Number.isInteger(index)||index<0||index*3+2>=report.length)throw Error('Invalid worker affinity acknowledgement');
 Atomics.store(report,index*3+1,actual.platform==='darwin'?actual.affinityCode:actual.group);
 Atomics.store(report,index*3+2,actual.cpu);
 Atomics.store(report,index*3,actual.verified?1:actual.affinityTagApplied?3:2);
}
if(!isMainThread){
 if(typeof workerData?.workerModuleUrl!=='string')throw Error('Worker application module is required');
 await import(workerData.workerModuleUrl);
}
