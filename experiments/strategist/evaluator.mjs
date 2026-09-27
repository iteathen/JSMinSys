import {workerData as d,parentPort} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {BehaviorWorker} from '../../addons/worker-behavior.mjs';
import {prepareCycleMeter} from './meter.mjs';

// Cold selection only. The PFIF worker owns the additional horizon actions;
// the ordinary worker keeps its original recursive path and cost.
const frontier=process.env.JSMINSYS_STRATEGIST_POLICY?.startsWith('frontier-');
const recurring=process.env.JSMINSYS_STRATEGIST_POLICY?.includes('recurring');
const modes=process.env.JSMINSYS_STRATEGIST_POLICY?.startsWith('modes-');
const module=await import(d.pollOnly?'../../addons/rba-connect4-alphabeta-behavior.mjs':
  modes?'./modes.generated.mjs':recurring?'./recurring.generated.mjs':frontier?'./frontier.generated.mjs':'./search.generated.mjs');
const prepare=module.prepareConnect4RbaAlphaBetaBehavior,solve=module.solveConnect4RbaAlphaBetaBehavior;
const behavior=new BehaviorWorker(d.index,new Uint32Array(d.memory.buffer),d.index,d.memory);
const warmGeometry=prepareConnect4RbaGeometry({columns:4,rows:4});
const warmRoot=connect4RbaFromMoves([],{geometry:warmGeometry});
const warmState=prepare({geometry:warmGeometry,behavior,cacheCapacity:4096});
for(let i=0;i<d.warmups;i++)solve(warmRoot,{state:warmState});
const state=prepare({geometry:d.geometry,behavior,cacheCapacity:d.localCapacity,
  sharedExactCache:d.cache,orderOffset:d.index%d.geometry.columns});
const options={state,reflected:d.root.reflected},meter=await prepareCycleMeter(d.measureCycles);
Atomics.add(d.control,1,1);Atomics.notify(d.control,1);
while(Atomics.load(d.control,0)===0)Atomics.wait(d.control,0,0);
const start=meter.read(),started=performance.now();
const result=solve(d.root,options);
const ended=performance.now(),end=meter.read();
if(result.status==='EXACT')Atomics.compareExchange(d.control,2,0,d.index+1);
Atomics.add(d.control,3,1);
meter.close();
parentPort.postMessage({index:d.index,result,changes:state.campaignChanges??0,
  cycles:start===null?null:(end-start).toString(),started,ended,wallMs:ended-started});
