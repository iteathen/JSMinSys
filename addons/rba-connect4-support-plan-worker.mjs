// COLD one-shot geometry compiler. Exits before any search is released.
import {parentPort,workerData,threadId} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';
import {prepareSupportBasisPlans32} from './rba-connect4-support-basis-plan.mjs';
import {queryWindowsTopology,targetForProcessor,bindCurrentThread} from './worker-affinity.mjs';

export async function compilePreparedSupportPlanWorker32({geometry,budgetBytes,withClosures,withReflection,target}){
  let actual=null,selected=null;
  if(target!==null){
    const topology=await queryWindowsTopology(),minimum=Math.min(...topology.cores.map(c=>c.efficiency)),maximum=Math.max(...topology.cores.map(c=>c.efficiency));
    selected=targetForProcessor(topology,target.group,target.processor);
    if(minimum===maximum||selected.efficiency!==minimum)throw new Error('support-worker target is not a verified E-core');
    actual=await bindCurrentThread(selected);
  }
  const started=performance.now(),plan=prepareSupportBasisPlans32(geometry,budgetBytes,withClosures,withReflection);
  return {plan,execution:{target,selected,actual,threadId,compileMs:performance.now()-started}};
}

if(parentPort)parentPort.postMessage(await compilePreparedSupportPlanWorker32(workerData));
