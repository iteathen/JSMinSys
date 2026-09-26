// Validation probe only: existing recursive solver and flag handlers, unchanged
// production host/evaluator. One reader identity, clocks outside every solve.
import {Worker} from 'node:worker_threads';
import {once} from 'node:events';
import {performance} from 'node:perf_hooks';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
import {prepareCycleMeter} from './meter.mjs';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../../addons/worker-behavior.mjs';
import {prepareConnect4RbaAlphaBetaBehavior as prepare,solveConnect4RbaAlphaBetaBehavior as solve} from './search.generated.mjs';
import {createConnect4RbaSharedExactCache32} from '../../addons/rba-connect4-shared-exact-cache.mjs';
import {encodeControls} from './controls.mjs';

const meter=await prepareCycleMeter(true),memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
const behavior=new BehaviorWorker(0,words,0,memory);
const fixtures=[{columns:4,rows:4,moves:[],repeats:100},
  {columns:7,rows:6,moves:[2,0,5,3,6,3,5,2,3,3,3,5,0,5,0,0,1,6],repeats:50}];
const rows=[];
for(const fixture of fixtures){
  const g=prepareConnect4RbaGeometry(fixture),root=connect4RbaFromMoves(fixture.moves,{geometry:g});
  const state=prepare({geometry:g,behavior,cacheCapacity:4096}),options={state,reflected:root.reflected};
  publishWorkerBehavior32(words,0,0);
  const expected=solve(root,options);
  assert.equal(expected.value,fixture.columns===4?2:1);
  for(let i=0;i<100;i++)solve(root,options);
  for(const scenario of ['zero','set','changing']){
    publishWorkerBehavior32(words,0,scenario==='set'?encodeControls({shareExponent:4}):0);
    for(let i=0;i<20;i++)solve(root,options);
    let strategist=null,reply=null,exited=null;
    const control=new Int32Array(new SharedArrayBuffer(128));
    if(scenario==='changing'){
      strategist=new Worker(new URL('./strategist.mjs',import.meta.url),{
        env:{...process.env,JSMINSYS_STRATEGIST_POLICY:'dispatch-pulse'},
        workerData:{workers:1,columns:g.columns,cache:createConnect4RbaSharedExactCache32({capacity:8,keyWords:g.keyWords}),memory,control,policy:'inert',cadenceMs:5,holdMs:20,measureCycles:false},
      });
      reply=once(strategist,'message');exited=once(strategist,'exit');
      const deadline=performance.now()+5000;
      while(!Atomics.load(control,4)&&performance.now()<deadline)await delay(1);
      if(!Atomics.load(control,4)){await strategist.terminate();throw Error('probe strategist readiness');}
      Atomics.store(control,0,1);Atomics.notify(control,0);
    }
    state.campaignChanges=0;
    let nodes=0,checksum=0;
    const start=meter.read(),started=performance.now();
    for(let i=0;i<fixture.repeats;i++){
      const r=solve(root,options);nodes+=r.metrics.nodes;checksum+=r.value+r.move;
    }
    const ended=performance.now(),end=meter.read();
    assert.equal(nodes,fixture.repeats*expected.metrics.nodes);
    assert.equal(checksum,fixture.repeats*(expected.value+expected.move));
    let strategyReport=null;
    if(strategist){Atomics.store(control,0,2);Atomics.notify(control,0);strategyReport=(await reply)[0];await exited;}
    rows.push({fixture,scenario,dispatch:process.env.JSMINSYS_FLAG_DISPATCH??'integer',cycles:(end-start).toString(),nodes,
      cyclesPerNode:Number(end-start)/nodes,wallMs:ended-started,changes:state.campaignChanges,strategyReport});
  }
}
meter.close();
console.log(JSON.stringify({type:'dispatch-probe',dispatch:process.env.JSMINSYS_FLAG_DISPATCH??'integer',rows}));
