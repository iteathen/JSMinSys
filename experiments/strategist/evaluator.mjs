import {workerData as d,parentPort} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {BehaviorWorker,WORKER_BEHAVIOR_STRIDE32} from '../../addons/worker-behavior.mjs';
import {prepareCycleMeter} from './meter.mjs';

// Cold selection only. The PFIF worker owns the additional horizon actions;
// the ordinary worker keeps its original recursive path and cost.
const frontier=process.env.JSMINSYS_STRATEGIST_POLICY?.startsWith('frontier-');
const recurring=process.env.JSMINSYS_STRATEGIST_POLICY?.includes('recurring');
const modes=process.env.JSMINSYS_STRATEGIST_POLICY?.startsWith('modes-');
const pending=process.env.JSMINSYS_STRATEGIST_POLICY?.startsWith('modes-pending-');
const oneBand=process.env.JSMINSYS_STRATEGIST_POLICY?.startsWith('modes-pending-band');
const module=await import(d.bare?'../../addons/rba-connect4-alphabeta.mjs':d.pollOnly?'../../addons/rba-connect4-alphabeta-behavior.mjs':
  oneBand?'./one-band.generated.mjs':pending?'./observed-modes.generated.mjs':modes?'./modes.generated.mjs':recurring?'./recurring.generated.mjs':frontier?'./frontier.generated.mjs':'./search.generated.mjs');
const prepare=d.bare?module.prepareConnect4RbaAlphaBeta:module.prepareConnect4RbaAlphaBetaBehavior,
  solve=d.bare?module.solveConnect4RbaAlphaBeta:module.solveConnect4RbaAlphaBetaBehavior;
const behavior=d.bare?undefined:new BehaviorWorker(d.index,new Uint32Array(d.memory.buffer),d.index,d.memory);
const warmGeometry=prepareConnect4RbaGeometry({columns:4,rows:4});
const warmRoot=connect4RbaFromMoves([],{geometry:warmGeometry});
const warmState=prepare({geometry:warmGeometry,behavior,cacheCapacity:4096});
for(let i=0;i<d.warmups;i++)solve(warmRoot,{state:warmState});
const state=prepare({geometry:d.geometry,behavior,cacheCapacity:d.localCapacity,
  sharedExactCache:d.cache,orderOffset:d.index%d.geometry.columns});
if(pending){
  const {bindPendingObservation}=await import('./pending-observation.mjs');
  bindPendingObservation(state,d.pendingObservation,d.index);
}
const options={state,reflected:d.root.reflected},meter=await prepareCycleMeter(d.measureCycles);
const gateWords=d.initialActive!==null?new Int32Array(d.memory.buffer):null,gateBase=d.index*WORKER_BEHAVIOR_STRIDE32;
Atomics.add(d.control,1,1);Atomics.notify(d.control,1);
while(Atomics.load(d.control,0)===0)Atomics.wait(d.control,0,0);
const start=meter.read(),started=performance.now();
let activated=true;
if(gateWords){
  // Before search only. Expected-value wait prevents lost activation/STOP wakes.
  // No parking or activation check is added to recursive execution.
  let flags=Atomics.load(gateWords,gateBase);
  while(!(flags&1025)){Atomics.wait(gateWords,gateBase,flags);flags=Atomics.load(gateWords,gateBase);}
  activated=(flags&1)===0;
}
const searchStarted=activated?performance.now():null;
const result=activated?solve(d.root,options):{status:'NOT_STARTED',value:null,move:-1,metrics:{nodes:0}};
const ended=performance.now(),end=meter.read();
// Cold result adaptation only: the ordinary synchronous solver returns an
// exact value directly and has no cancellation/status protocol.
if(d.bare){
  if(!Number.isInteger(result.value)||result.value<1||result.value>3)throw Error('invalid bare result');
  result.status='EXACT';
}
if(result.status==='EXACT')Atomics.compareExchange(d.control,2,0,d.index+1);
Atomics.add(d.control,3,1);
meter.close();
parentPort.postMessage({index:d.index,result,activated,searchStarted,changes:state.campaignChanges??0,
  cycles:start===null?null:(end-start).toString(),started,ended,wallMs:ended-started});
