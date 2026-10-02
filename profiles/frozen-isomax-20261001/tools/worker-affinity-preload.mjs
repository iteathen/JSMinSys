// Optional experiment startup preload. Inherited by file Workers through existing
// execArgv handling. Runs before their module and private solver initialization.
// No mutation of the solver, TT, hot worker source, or generated variants.
import {isMainThread,workerData} from 'node:worker_threads';
if(!isMainThread&&process.env.JMS_WORKER_AFFINITY_FILE){
 const {readFileSync,writeFileSync}=await import('node:fs');
 const {queryWindowsTopology,validateWorkerTargets,bindCurrentThread}=await import('../addons/worker-affinity.mjs');
 const requested=JSON.parse(readFileSync(process.env.JMS_WORKER_AFFINITY_FILE,'utf8'));
 const index=workerData?.workerIndex;
 if(!Number.isInteger(index)||index<0||index>=requested.length)throw Error('worker affinity index missing');
 const targets=validateWorkerTargets(await queryWindowsTopology(),requested,requested.length);
 const actual=await bindCurrentThread(targets[index]);
 if(!process.env.JMS_WORKER_AFFINITY_REPORT)throw Error('worker affinity report path required');
 writeFileSync(process.env.JMS_WORKER_AFFINITY_REPORT+'-'+index+'.json',JSON.stringify({index,target:targets[index],actual,beforeSolverInitialization:true})+'\n',{flag:'wx'});
}
