import test from 'node:test';
import assert from 'node:assert/strict';
import {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../../addons/worker-behavior.mjs';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../../addons/rba-connect4-alphabeta.mjs';
import {createConnect4RbaSharedExactCache32} from '../../addons/rba-connect4-shared-exact-cache.mjs';
const previous=process.env.JSMINSYS_FLAG_DISPATCH;
process.env.JSMINSYS_FLAG_DISPATCH='actions';
const controls=await import('./controls.mjs');
if(previous===undefined)delete process.env.JSMINSYS_FLAG_DISPATCH;
else process.env.JSMINSYS_FLAG_DISPATCH=previous;

test('action flags select prepared settings and restore defaults without TT mutation',()=>{
  assert.equal(typeof controls.completeActions32,'function');
  const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer),shared={sentinel:1};
  const state=controls.prepareSearchBehavior32({g:{columns:4},actionOrder:Uint32Array.from([1,2,0,3]),
    cache:{shared,sharedSampleBits:0},cpc:{frontierResponse:0}},new BehaviorWorker(0,words,0,memory));
  const flags=controls.encodeActions({privateOnly:true,frontierProof:true,reverse:true});
  publishWorkerBehavior32(words,0,flags);controls.completeActions32(state,2);
  assert.equal(state.cache.shared,null);assert.equal(state.cpc.frontierResponse,1);
  assert.deepEqual([...state.actionOrder],[3,0,2,1]);assert.equal(state.campaignChanges,1);
  controls.completeActions32(state,2);assert.equal(state.campaignChanges,1);
  publishWorkerBehavior32(words,0,0);controls.completeActions32(state,2);
  assert.equal(state.cache.shared,shared);assert.equal(state.cpc.frontierResponse,0);
  assert.deepEqual([...state.actionOrder],[1,2,0,3]);assert.deepEqual(shared,{sentinel:1});
  publishWorkerBehavior32(words,0,flags,3,5,7);
  controls.completeActions32(state,2);
  assert.equal(state.cache.shared,null);assert.equal(state.cpc.frontierResponse,1);
  const changes=state.campaignChanges;
  Atomics.add(words,4,1);
  assert.equal(controls.completeActions32(state,2),2);
  assert.equal(state.campaignChanges,changes,'inconsistent extension snapshot deferred');
  Atomics.add(words,4,1);
  publishWorkerBehavior32(words,0,flags|1);
  assert.equal(controls.completeActions32(state,2),3);assert.equal(controls.completeActions32(state,2),3);
});

test('live action changes preserve exact WDL, including toggled CPC proof and shared access',async()=>{
  assert.equal(typeof controls.encodeActions,'function');
  const {prepareConnect4RbaAlphaBetaBehavior:prepare,solveConnect4RbaAlphaBetaBehavior:solve}=await import('./search.generated.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  for(const moves of [[],[1],[1,2],[0,1,0,2],[3,2,3,1]]){
    const root=connect4RbaFromMoves(moves,{geometry:g});
    const expected=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:1024}),reflected:root.reflected});
    const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
    const shared=createConnect4RbaSharedExactCache32({capacity:1024,keyWords:g.keyWords});
    const state=prepare({geometry:g,cacheCapacity:1024,sharedExactCache:shared,behavior:new BehaviorWorker(0,words,0,memory)});
    const load=state.behaviorLoad;let reads=0;
    state.behaviorLoad=()=>{
      if(++reads%17===0)publishWorkerBehavior32(words,0,controls.encodeActions({
        privateOnly:!!(reads&1),frontierProof:!!(reads&2),reverse:!!(reads&4),rotation:reads%4}));
      return load();
    };
    const actual=solve(root,{state,reflected:root.reflected});
    assert.equal(actual.status,'EXACT');assert.equal(actual.value,expected.value);
    assert.equal(actual.move,expected.move,'stable root witness');
    assert.ok(state.campaignChanges>1);
  }
});

test('live action strategy observes STOP and cleans up an unresolved deadline',{timeout:10000},async()=>{
  const savedDispatch=process.env.JSMINSYS_FLAG_DISPATCH,savedPolicy=process.env.JSMINSYS_STRATEGIST_POLICY;
  process.env.JSMINSYS_FLAG_DISPATCH='actions';process.env.JSMINSYS_STRATEGIST_POLICY='action-proof';
  try{
    const {runTrial}=await import('./host.mjs');
    const r=await runTrial({fixture:{columns:7,rows:6,moves:[]},workers:2,policy:'inert',timeoutMs:10,warmups:0});
    assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);assert.equal(r.cleanup,true);
    assert.equal(r.forcedTerminations,0);assert.equal(r.solveWallMs,null);
    assert.ok(r.evaluators.every(e=>e.result.status==='CANCELLED'));
  }finally{
    if(savedDispatch===undefined)delete process.env.JSMINSYS_FLAG_DISPATCH;else process.env.JSMINSYS_FLAG_DISPATCH=savedDispatch;
    if(savedPolicy===undefined)delete process.env.JSMINSYS_STRATEGIST_POLICY;else process.env.JSMINSYS_STRATEGIST_POLICY=savedPolicy;
  }
});
