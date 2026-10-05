// COLD optional preparation owner. No solver, position or TT work enters here.
import {Worker} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';
import {filterFileWorkerExecArgv32} from './branch-manager-host.mjs';

export function filterSupportWorkerExecArgv32(args){
  const fileArgs=filterFileWorkerExecArgv32(args),source=fileArgs??args,
    affinityPreload=new URL('../tools/worker-affinity-preload.mjs',import.meta.url).href;
  let filtered;
  for(let i=0;i<source.length;i++){
    if(source[i]==='--import'&&source[i+1]===affinityPreload){
      filtered??=source.slice(0,i);i++;continue;
    }
    if(filtered!==undefined)filtered.push(source[i]);
  }
  // Undefined preserves Node's native inheritance/filtering of process-wide
  // flags. Do not reconstruct all exposed test-runner defaults explicitly.
  return filtered??fileArgs;
}

export async function prepareSupportBasisPlansWorker32(geometry,budgetBytes,withClosures=false,withReflection=false,{target=null,timeoutMs=30000,signal}={}){
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0)throw new RangeError('invalid support-worker timeout');
  if(target!==null&&(!Number.isInteger(target.group)||target.group<0||target.group>65535||!Number.isInteger(target.processor)||target.processor<0||target.processor>63))
    throw new RangeError('invalid support-worker target');
  if(signal?.aborted)throw new Error('support-worker aborted');
  // Preserve runtime/startup arguments, but the four-search-worker preload
  // cannot assign this auxiliary worker a search-worker index or report file.
  const started=performance.now(),worker=new Worker(new URL('./rba-connect4-support-plan-worker.mjs',import.meta.url),{
    execArgv:filterSupportWorkerExecArgv32(process.execArgv),workerData:{geometry,budgetBytes,withClosures,withReflection,target}});
  let timer,result,failure,exited=false;
  function abortSupportPreparation(){failure??=new Error('support-worker aborted');void worker.terminate();}
  function supportPreparationDeadline(){
    const remaining=timeoutMs-(performance.now()-started);
    if(remaining<=0){failure??=new Error('support-worker deadline');void worker.terminate();}
    else timer=setTimeout(supportPreparationDeadline,Math.min(remaining,2147483647));
  }
  try{
    const completion=new Promise((resolve,reject)=>{
      worker.once('message',value=>{result=value;});
      worker.once('error',error=>{failure??=error;});
      worker.once('exit',code=>{
        exited=true;
        if(failure||code!==0||!result)reject(failure??new Error('support-worker exited without complete plan: '+code));
        else{
          if(result.plan)Object.freeze(result.plan);
          result.execution={...result.execution,workerExited:true,exitCode:code,totalPreparationMs:performance.now()-started};
          resolve(result);
        }
      });
    });
    signal?.addEventListener('abort',abortSupportPreparation,{once:true});
    if(signal?.aborted)abortSupportPreparation();
    supportPreparationDeadline();
    return await completion;
  }finally{
    clearTimeout(timer);signal?.removeEventListener('abort',abortSupportPreparation);
    if(!exited)await worker.terminate();
  }
}
