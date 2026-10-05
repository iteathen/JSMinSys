// Optional experiment startup preload. Inherited by file Workers through existing
// execArgv handling. Runs before their module and private solver initialization.
// No mutation of the solver, TT, hot worker source, or generated variants.
import {isMainThread,workerData} from 'node:worker_threads';
if(!isMainThread&&process.env.JMS_WORKER_AFFINITY_FILE){
 const {readFileSync,writeFileSync}=await import('node:fs');
 const {queryWindowsTopology,validateWorkerTargets,validateEfficiencyTarget,bindCurrentThread}=await import('../addons/worker-affinity.mjs');
 const requested=JSON.parse(readFileSync(process.env.JMS_WORKER_AFFINITY_FILE,'utf8'));
 const index=workerData?.workerIndex;
 const maintenance=workerData?.maintenanceRole==='shared-exact-publisher';
 if(!Number.isInteger(index)||index<0||index>=(requested.length+(maintenance?1:0)))throw Error('worker affinity index missing');
 const topology=await queryWindowsTopology(),targets=validateWorkerTargets(topology,requested,requested.length);
 let target=targets[index];
 if(maintenance){
  if(index!==requested.length||!process.env.JMS_MAINTENANCE_AFFINITY_FILE)throw Error('maintenance affinity target missing');
  target=validateEfficiencyTarget(topology,JSON.parse(readFileSync(process.env.JMS_MAINTENANCE_AFFINITY_FILE,'utf8')));
 }
 const actual=await bindCurrentThread(target);
 if(!process.env.JMS_WORKER_AFFINITY_REPORT)throw Error('worker affinity report path required');
 writeFileSync(process.env.JMS_WORKER_AFFINITY_REPORT+'-'+index+'.json',JSON.stringify({index,target,actual,maintenance,beforeSolverInitialization:true})+'\n',{flag:'wx'});
}
