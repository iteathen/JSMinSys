import {workerData as d,parentPort} from 'node:worker_threads';
import {setTimeout as delay} from 'node:timers/promises';
import {performance} from 'node:perf_hooks';
import {publishWorkerBehavior32,WORKER_BEHAVIOR_STRIDE32} from '../../addons/worker-behavior.mjs';
import {encodeControls,encodeFrontier} from './controls.mjs';
import {prepareCycleMeter} from './meter.mjs';
import {STRATEGIES,observeProofCache,advancePolicy,policyFlags} from './policies.mjs';
import {ACTION_POLICIES,advanceActionPolicy,actionPolicyFlags} from './action-policies.mjs';
import {MODE_POLICIES,modePolicyFlags} from './mode-policy.mjs';
import {WIDTH_POLICIES,createWidthPolicy,advanceWidthPolicy} from './width-policy.mjs';
import {prepareWidthObserver,stepWidthObserver} from './width-observer.mjs';
import {preparePendingReaders,pollPendingReader} from './pending-reader.mjs';
import {createPendingPolicy,advancePendingPolicy} from './pending-policy.mjs';
import {createPoolPolicy,advancePoolPolicy} from './pool-policy.mjs';

// Cold experiment selection through inherited environment keeps the existing
// host, evaluator and benchmark interfaces unchanged. Every result names it.
const strategy=process.env.JSMINSYS_STRATEGIST_POLICY??null;
const pendingBand=strategy==='modes-pending-band';
const pendingActive=strategy==='modes-pending-pfif'||pendingBand;
const poolObserved=strategy==='modes-pending-pool-fixed'||strategy==='modes-pending-pool-grow';
const poolStrategy=strategy==='modes-pool-fixed'||poolObserved;
const poolState=poolStrategy?createPoolPolicy(d.workers,d.initialActive):null;
const pendingStrategy=strategy==='modes-pending-off'||strategy==='modes-pending-read'||strategy==='modes-pending-band-read'||pendingActive||poolObserved;
const pendingReaders=pendingStrategy?preparePendingReaders(d.pendingObservation):null;
const pendingPolicies=pendingActive?Array.from({length:d.workers},()=>createPendingPolicy({oneBand:pendingBand,
  trigger:process.env.JSMINSYS_PENDING_TRIGGER??'sustained'})):null;
const widthStrategy=WIDTH_POLICIES.includes(strategy);
const modeStrategy=MODE_POLICIES.includes(strategy)||widthStrategy||pendingStrategy||poolStrategy;
const widthObserver=widthStrategy?prepareWidthObserver(d.geometry,d.root,d.cache):null;
const widthPolicy=widthStrategy?createWidthPolicy({growthPercent:strategy==='modes-width-relative'?25:0}):null;
if(widthStrategy)advanceWidthPolicy(widthPolicy,widthObserver);
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
const gateWords=poolStrategy?new Int32Array(d.memory.buffer):null;
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
  const flags=poolStrategy?(i<poolState.active?(poolObserved?1280:1024):0):pendingStrategy?(strategy!=='modes-pending-off'?256:0):widthStrategy?0:modePolicyFlags(strategy,0,i);
  publishWorkerBehavior32(words,i,flags);last[i]=flags;writes++;
}
Atomics.store(d.control,4,1);
while(Atomics.load(d.control,0)===0)Atomics.wait(d.control,0,0);
const start=meter.read(),started=performance.now();
while(Atomics.load(d.control,0)===1&&!Atomics.load(d.control,2)){
  const now=performance.now(),stores=Atomics.load(d.cache.stats,1),contention=Atomics.load(d.cache.stats,2);
  const hits=actionStrategy?Atomics.load(d.cache.stats,0):0;
  const pendingSamples=pendingStrategy?pendingReaders.map((r,i)=>pollPendingReader(d.pendingObservation,i,r)):null;
  if(poolStrategy&&strategy==='modes-pending-pool-grow')advancePoolPolicy(poolState,pendingSamples);
  if(widthStrategy){stepWidthObserver(widthObserver);advanceWidthPolicy(widthPolicy,widthObserver);}
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
    const acceptedPending=pendingStrategy&&strategy!=='modes-pending-off'&&pendingSamples[i]?.request===(last[i]&256);
    const pendingMode=pendingActive?advancePendingPolicy(pendingPolicies[i],acceptedPending?pendingSamples[i]:null):0;
    const flags=poolStrategy?(i<poolState.active?1024|(poolObserved?((last[i]&1024)?((acceptedPending?(last[i]^256):last[i])&256):256):0):0):
      pendingStrategy?((acceptedPending?(last[i]^256):last[i])&256)|pendingMode:
      widthStrategy?(strategy==='modes-width-observe'?0:widthPolicy.flags):
      modeStrategy?modePolicyFlags(strategy,now-started,i):frontierStrategy?encodeFrontier({stride:frontierStride,target:frontierTarget,recurring,bounded,
      release:strategy==='frontier-full'||(strategy==='frontier-4-release'&&now-started>=32)}):
      actionStrategy?actionPolicyFlags(strategy,i,policyState):strategy?policyFlags(strategy,i,d,policyState):d.policy==='sparse'?encodeControls({shareExponent:4}):
      d.policy==='adaptive'?encodeControls({shareExponent:exponent}):
      d.policy==='rotate'?encodeControls({rotation:phase}):
      d.policy==='combined'?encodeControls({rotation:phase,shareExponent:exponent}):
      d.policy==='fixed'?encodeControls({rotation:1}):
      d.policy==='fixed-sparse'?encodeControls({rotation:1,shareExponent:4}):0;
    if(flags!==last[i]){
      publishWorkerBehavior32(words,i,flags);
      if(poolStrategy&&(flags&1024)&&!(last[i]&1024))Atomics.notify(gateWords,i*WORKER_BEHAVIOR_STRIDE32);
      last[i]=flags;writes++;
    }
  }
  // Eligibility is an observation, not evidence that this policy issued STOP.
  // Keep actual publication separate; this cold trace never runs in evaluators.
  if(trace.length<256)trace.push({ms:now-started,stores,contention,exponent,phase,writes,observation,
    harvestEligible:policyState.harvested,retirementEligible:policyState.retired,
    helperStopPublished:last.subarray(1).some(flags=>flags&1),
    ...(actionStrategy||frontierStrategy||modeStrategy?{hits,reuseSeen:policyState.reuseSeen,flags:[...last]}:{}),
    ...(pendingStrategy?{pendingSamples}:{}),
    ...(widthStrategy?{width:{complete:widthObserver.complete,revision:widthObserver.revision,depth:widthObserver.depth,
      width:widthObserver.width,delta:widthPolicy.delta,capacityRejections:widthObserver.capacityRejections}}:{})});
  previousStores=stores;previousContention=contention;ticks++;
  await delay(d.cadenceMs);
}
const stopAt=performance.now();
for(let i=0;i<d.workers;i++){
  publishWorkerBehavior32(words,i,last[i]|1);writes++;
  if(poolStrategy)Atomics.notify(gateWords,i*WORKER_BEHAVIOR_STRIDE32);
}
if(pendingStrategy)for(let i=0;i<d.workers;i++)pollPendingReader(d.pendingObservation,i,pendingReaders[i]);
const end=meter.read();meter.close();
parentPort.postMessage({strategy:strategy??d.policy,ticks,writes,cycles:start===null?null:(end-start).toString(),
  started,stopAt,wallMs:stopAt-started,trace,
  ...(poolStrategy?{pool:{active:poolState.active,capacity:poolState.capacity,events:poolState.events}}:{}),
  ...(pendingActive?{pendingPolicies:pendingPolicies.map(p=>({triggers:p.triggers,releases:p.releases,
    lastBurstBands:p.lastBurstBands,maxBurstBands:p.maxBurstBands,finalMode:p.flags}))}:{}),
  ...(pendingStrategy?{pending:pendingReaders.map(r=>({samples:r.samples,minWidth:r.samples?r.minWidth:null,
    maxWidth:r.maxWidth,positive:r.positive,negative:r.negative,flat:r.flat,last:r.last}))}:{}),
  ...(widthStrategy?{widthObserver:{width:widthObserver.width,depth:widthObserver.depth,revision:widthObserver.revision,
    expanded:widthObserver.expanded,generated:widthObserver.generated,duplicates:widthObserver.duplicates,
    exactRemoved:widthObserver.exactRemoved,capacityRejections:widthObserver.capacityRejections,
    capacity:widthObserver.capacity,batch:widthObserver.batch,policyChanges:widthPolicy.changes}}:{})});
