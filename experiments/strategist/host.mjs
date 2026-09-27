import {Worker} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';
import {setTimeout as delay} from 'node:timers/promises';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {createConnect4RbaSharedExactCache32} from '../../addons/rba-connect4-shared-exact-cache.mjs';
import {createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../../addons/worker-behavior.mjs';
import {createPendingObservation} from './pending-observation.mjs';

export async function runTrial({fixture,workers=2,policy='inert',cadenceMs=5,holdMs=20,
  timeoutMs=1000,warmups=20,measureCycles=false,localCapacity=4096,sharedCapacity=16384,initialActive=null}={}){
  if(!['host-only','poll-only','inert','fixed','rotate','sparse','adaptive','combined','fixed-sparse'].includes(policy))throw RangeError('policy');
  if(!Number.isInteger(workers)||workers<1||workers>16)throw RangeError('workers');
  if(initialActive!==null&&(!Number.isInteger(initialActive)||initialActive<1||initialActive>workers||
    !['modes-pending-pool-fixed','modes-pending-pool-grow'].includes(process.env.JSMINSYS_STRATEGIST_POLICY)))throw RangeError('standby profile');
  if(!(cadenceMs>=1&&cadenceMs<=1000)||!(timeoutMs>0&&timeoutMs<=5000)||!Number.isInteger(warmups)||warmups<0||warmups>100)throw RangeError('campaign bounds');
  const geometry=prepareConnect4RbaGeometry(fixture),root=connect4RbaFromMoves(fixture.moves,{geometry});
  const cache=createConnect4RbaSharedExactCache32({capacity:sharedCapacity,keyWords:geometry.keyWords});
  const memory=createWorkerBehaviorMemory32(workers),control=new Int32Array(new SharedArrayBuffer(128));
  const pendingObservation=process.env.JSMINSYS_STRATEGIST_POLICY?.startsWith('modes-pending-')?
    createPendingObservation(workers,geometry.columns,geometry.rows):null;
  const threads=[],exits=[],evaluators=[],errors=[];let strategist=null,forced=0,timedOut=false;
  const launch=(file,data)=>{
    const w=new Worker(new URL(file,import.meta.url),{workerData:data,execArgv:process.execArgv.filter(a=>a==='--experimental-ffi')});
    threads.push(w);
    w.on('message',r=>{if(file==='./strategist.mjs')strategist=r;else evaluators.push(r);});
    w.on('error',e=>{errors.push(e.stack);Atomics.store(control,0,2);Atomics.notify(control,0);});
    exits.push(new Promise(resolve=>w.once('exit',code=>{if(code&&!forced)errors.push(`exit ${code}: ${file}`);resolve();})));
  };
  let started=null,finished=null;
  try{
    for(let index=0;index<workers;index++)launch('./evaluator.mjs',{index,geometry,root,cache,memory,control,localCapacity,warmups,measureCycles,pendingObservation,initialActive,pollOnly:policy==='poll-only'||policy==='host-only'});
    if(policy==='host-only')Atomics.store(control,4,1);
    else launch('./strategist.mjs',{workers,columns:geometry.columns,cache,memory,control,policy,cadenceMs,holdMs,measureCycles,pendingObservation,initialActive,
      ...(process.env.JSMINSYS_STRATEGIST_POLICY?.startsWith('modes-width-')?{geometry,root}:{})});
    const preparationDeadline=performance.now()+10000;
    while((Atomics.load(control,1)!==workers||!Atomics.load(control,4))&&!errors.length&&performance.now()<preparationDeadline)await delay(1);
    if(errors.length||Atomics.load(control,1)!==workers||!Atomics.load(control,4))throw Error('campaign preparation failed');
    started=performance.now();Atomics.store(control,0,1);Atomics.notify(control,0);
    while(!Atomics.load(control,2)&&!errors.length&&performance.now()-started<timeoutMs)await delay(1);
    timedOut=!Atomics.load(control,2)&&!errors.length;
    Atomics.store(control,0,2);Atomics.notify(control,0);
    if(policy==='host-only'){
      const words=new Uint32Array(memory.buffer);
      for(let i=0;i<workers;i++)publishWorkerBehavior32(words,i,1);
    }
    const joined=Promise.all(exits).then(()=>true);
    let graceTimer;
    const done=await Promise.race([joined,new Promise(resolve=>{graceTimer=setTimeout(()=>resolve(false),1500);})]);
    clearTimeout(graceTimer);
    if(!done){forced++;await Promise.all(threads.map(w=>w.terminate()));await joined;}
    finished=performance.now();
  }catch(e){
    errors.push(e.stack);Atomics.store(control,0,2);Atomics.notify(control,0);
    forced++;await Promise.all(threads.map(w=>w.terminate()));await Promise.all(exits);
  }
  const winner=Atomics.load(control,2)-1,winning=evaluators.find(r=>r.index===winner);
  if(winning&&winning.ended-started>timeoutMs)timedOut=true;
  const values=evaluators.filter(r=>r.result.status==='EXACT').map(r=>r.result.value);
  if(values.some(v=>v!==values[0]))errors.push('conflicting exact WDL');
  const cycles=measureCycles&&evaluators.length===workers?evaluators.reduce((sum,r)=>sum+BigInt(r.cycles),0n).toString():null;
  const nodes=evaluators.reduce((sum,r)=>sum+r.result.metrics.nodes,0);
  return {status:errors.length||forced?'FAILED':timedOut?'TIMEOUT':winning?'EXACT':'FAILED',
    value:!errors.length&&!forced&&!timedOut&&winning?winning.result.value:null,
    fixture,workers,policy,cadenceMs,holdMs,timeoutMs,warmups,localCapacity,sharedCapacity,initialActive,
    cacheMemory:{keyWords:geometry.keyWords,privateCacheBytesPerWorker:localCapacity*(geometry.keyWords*4+5),
      sharedCacheBytes:cache.sequence.byteLength+cache.value.byteLength+cache.keys.byteLength+cache.stats.byteLength},
    winner,wallMs:started!==null&&finished!==null?finished-started:null,
    solveWallMs:winning?winning.ended-started:null,evaluatorCycles:cycles,nodes,
    cyclesPerNode:cycles&&nodes?Number(cycles)/nodes:null,
    evaluatorStartSkewMs:evaluators.length?Math.max(...evaluators.map(r=>r.started))-Math.min(...evaluators.map(r=>r.started)):null,
    evaluators:evaluators.sort((a,b)=>a.index-b.index),strategist,
    cacheStats:[...cache.stats],errors,forcedTerminations:forced,cleanup:forced===0&&evaluators.length===workers&&(strategist!==null||policy==='host-only')};
}
