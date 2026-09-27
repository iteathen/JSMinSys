import {workerData as d,parentPort} from 'node:worker_threads';
import {setTimeout as delay} from 'node:timers/promises';
import {performance} from 'node:perf_hooks';
import {publishWorkerBehavior32} from '../../addons/worker-behavior.mjs';
import {encodeControls,encodeFrontier} from './controls.mjs';
import {prepareCycleMeter} from './meter.mjs';
import {STRATEGIES,observeProofCache,advancePolicy,policyFlags} from './policies.mjs';
import {ACTION_POLICIES,advanceActionPolicy,actionPolicyFlags} from './action-policies.mjs';
import {MODE_POLICIES,modePolicyFlags} from './mode-policy.mjs';

// Cold experiment selection through inherited environment keeps the existing
// host, evaluator and benchmark interfaces unchanged. Every result names it.
const strategy=process.env.JSMINSYS_STRATEGIST_POLICY??null;
const modeStrategy=MODE_POLICIES.includes(strategy);
const frontierStrategy=['frontier-2','frontier-4','frontier-8','frontier-4-release','frontier-full',
  'frontier-2-narrow','frontier-4-narrow','frontier-8-narrow',
  'frontier-2-recurring','frontier-4-recurring','frontier-recurring-off',
  'frontier-2-recurring-bounded','frontier-4-recurring-bounded'].includes(strategy);
const recurring=frontierStrategy&&strategy.includes('recurring')&&strategy!=='frontier-recurring-off';
const bounded=frontierStrategy&&strategy.endsWith('-bounded');
const frontierStride=strategy==='frontier-2'||strategy==='frontier-2-narrow'||
  strategy==='frontier-2-recurring'||strategy==='frontier-2-recurring-bounded'||strategy==='frontier-recurring-off'?2:
  strategy==='frontier-8'||strategy==='frontier-8-narrow'?8:4;
const frontierTarget=frontierStrategy&&(strategy.endsWith('-narrow')||strategy.includes('recurring'))?d.workers:0;
const actionStrategy=ACTION_POLICIES.includes(strategy);
if(strategy!==null&&!STRATEGIES.includes(strategy)&&!actionStrategy&&!frontierStrategy&&!modeStrategy)throw RangeError('strategist policy');
if((actionStrategy||frontierStrategy)&&process.env.JSMINSYS_FLAG_DISPATCH!=='actions')throw RangeError('action strategy needs actions handler');
const observeProofs=['harvest','wide-harvest','seed-retire','wide-seed'].includes(strategy);
const cellCount=Number(process.env.JSMINSYS_STRATEGIST_CELLS);
if(observeProofs&&(!Number.isInteger(cellCount)||cellCount<d.columns||cellCount%d.columns))throw RangeError('strategist cell count');
const policyState={harvested:false,retired:false,tick:0,reuseSeen:false};

const words=new Uint32Array(d.memory.buffer),last=new Uint32Array(d.workers),meter=await prepareCycleMeter(d.measureCycles);
let ticks=0,writes=0,previousStores=0,previousContention=0,exponent=0,phase=0,lastChange=-Infinity;
const trace=[];
// Publish the initial bounded action before opening the search barrier. A
// scheduler race must not silently turn a PFIF trial into an ordinary solve.
// Warmups must finish first; these words control the measured solve only.
if(frontierStrategy||modeStrategy)while(Atomics.load(d.control,1)<d.workers&&Atomics.load(d.control,0)===0)await delay(1);
if(frontierStrategy)for(let i=0;i<d.workers;i++){
  const flags=encodeFrontier({stride:frontierStride,target:frontierTarget,recurring,bounded,release:strategy==='frontier-full'});
  publishWorkerBehavior32(words,i,flags);last[i]=flags;writes++;
}
if(modeStrategy)for(let i=0;i<d.workers;i++){
  const flags=modePolicyFlags(strategy,0);
  publishWorkerBehavior32(words,i,flags);last[i]=flags;writes++;
}
Atomics.store(d.control,4,1);
while(Atomics.load(d.control,0)===0)Atomics.wait(d.control,0,0);
const start=meter.read(),started=performance.now();
while(Atomics.load(d.control,0)===1&&!Atomics.load(d.control,2)){
  const now=performance.now(),stores=Atomics.load(d.cache.stats,1),contention=Atomics.load(d.cache.stats,2);
  const hits=actionStrategy?Atomics.load(d.cache.stats,0):0;
  if(actionStrategy)advanceActionPolicy(policyState,{hits});
  const observation=observeProofs?observeProofCache(d.cache,d.columns,cellCount):null;
  if(observation)advancePolicy(policyState,{stores,useful:observation.useful});
  policyState.tick=ticks;
  // Counter ratios are a coarse pressure signal, NOT duplicate-work estimates.
  if(d.policy==='adaptive'||d.policy==='combined'){
    const ds=stores-previousStores,dc=contention-previousContention;
    if(now-lastChange>=d.holdMs&&ds>=32){
      const next=dc*64>ds?4:0;
      if(next!==exponent){exponent=next;lastChange=now;}
    }
  }
  if(d.policy==='rotate'||d.policy==='combined')phase=ticks%d.columns;
  for(let i=0;i<d.workers;i++){
    const flags=modeStrategy?modePolicyFlags(strategy,now-started):frontierStrategy?encodeFrontier({stride:frontierStride,target:frontierTarget,recurring,bounded,
      release:strategy==='frontier-full'||(strategy==='frontier-4-release'&&now-started>=32)}):
      actionStrategy?actionPolicyFlags(strategy,i,policyState):strategy?policyFlags(strategy,i,d,policyState):d.policy==='sparse'?encodeControls({shareExponent:4}):
      d.policy==='adaptive'?encodeControls({shareExponent:exponent}):
      d.policy==='rotate'?encodeControls({rotation:phase}):
      d.policy==='combined'?encodeControls({rotation:phase,shareExponent:exponent}):
      d.policy==='fixed'?encodeControls({rotation:1}):
      d.policy==='fixed-sparse'?encodeControls({rotation:1,shareExponent:4}):0;
    if(flags!==last[i]){publishWorkerBehavior32(words,i,flags);last[i]=flags;writes++;}
  }
  // Eligibility is an observation, not evidence that this policy issued STOP.
  // Keep actual publication separate; this cold trace never runs in evaluators.
  if(trace.length<256)trace.push({ms:now-started,stores,contention,exponent,phase,writes,observation,
    harvestEligible:policyState.harvested,retirementEligible:policyState.retired,
    helperStopPublished:last.subarray(1).some(flags=>flags&1),
    ...(actionStrategy||frontierStrategy||modeStrategy?{hits,reuseSeen:policyState.reuseSeen,flags:[...last]}:{})});
  previousStores=stores;previousContention=contention;ticks++;
  await delay(d.cadenceMs);
}
const stopAt=performance.now();
for(let i=0;i<d.workers;i++){publishWorkerBehavior32(words,i,last[i]|1);writes++;}
const end=meter.read();meter.close();
parentPort.postMessage({strategy:strategy??d.policy,ticks,writes,cycles:start===null?null:(end-start).toString(),
  started,stopAt,wallMs:stopAt-started,trace});
