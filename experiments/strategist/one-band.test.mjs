import test from 'node:test';
import assert from 'node:assert/strict';
import {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../../addons/worker-behavior.mjs';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';

test('preauthorized band completes without strategist release and snapshot toggles cannot rearm it',async()=>{
  const worker=await import('./one-band.generated.mjs');
  const reference=await import('./modes.generated.mjs');
  for(const moves of [[],[1],[2],[0,1,0,2],[3,2,3,1]]){
    const g=prepareConnect4RbaGeometry({columns:4,rows:4}),root=connect4RbaFromMoves(moves,{geometry:g});
    const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer),behavior=new BehaviorWorker(0,words,0,memory);
    const expected=reference.solveConnect4RbaAlphaBetaBehavior(root,{state:reference.prepareConnect4RbaAlphaBetaBehavior({geometry:g,behavior}),reflected:root.reflected});
    const state=worker.prepareConnect4RbaAlphaBetaBehavior({geometry:g,behavior});
    let token=0;publishWorkerBehavior32(words,0,522);
    const load=state.behaviorLoad;
    state.behaviorLoad=()=>{token^=256;publishWorkerBehavior32(words,0,522|token);return load();};
    const r=worker.solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
    assert.equal(r.status,'EXACT');assert.equal(r.value,expected.value);assert.equal(r.move,expected.move);
    assert.equal(r.metrics.bandStarted,1);assert.equal(r.metrics.bandCompleted,1);
    assert.equal(state.searchShallow,0);assert.equal(state.bandPending,0);
    assert.equal(r.metrics.modeRegions,1,'descendants cannot start extra SHALLOW regions');
    assert.ok(r.metrics.modePasses<=2,'one shallow band, followed only by DEEP continuation');
    assert.deepEqual(state.words.subarray(0,g.keyWords),root.words);
  }
});

test('one-band capable DEEP preserves traversal and STOP never publishes incomplete work',async()=>{
  const worker=await import('./one-band.generated.mjs'),reference=await import('./modes.generated.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),root=connect4RbaFromMoves([],{geometry:g});
  const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer),behavior=new BehaviorWorker(0,words,0,memory);
  const expected=reference.solveConnect4RbaAlphaBetaBehavior(root,{state:reference.prepareConnect4RbaAlphaBetaBehavior({geometry:g,behavior})});
  let state=worker.prepareConnect4RbaAlphaBetaBehavior({geometry:g,behavior});
  const actual=worker.solveConnect4RbaAlphaBetaBehavior(root,{state});
  for(const k of ['nodes','cofactors','cutoffs','cacheHits'])assert.equal(actual.metrics[k],expected.metrics[k]);
  assert.equal(actual.metrics.bandStarted,0);
  state=worker.prepareConnect4RbaAlphaBetaBehavior({geometry:g,behavior});
  publishWorkerBehavior32(words,0,522);
  const load=state.behaviorLoad;let reads=0;
  state.behaviorLoad=()=>{if(++reads===30)publishWorkerBehavior32(words,0,1);return load();};
  const stopped=worker.solveConnect4RbaAlphaBetaBehavior(root,{state});
  assert.equal(stopped.status,'CANCELLED');assert.equal(stopped.value,null);
});

test('strategist recognizes a completed one-band command even if it missed SHALLOW entirely',async()=>{
  const {createPendingPolicy,advancePendingPolicy}=await import('./pending-policy.mjs');
  const p=createPendingPolicy({oneBand:true});let revision=0;
  const feed=(width,bandCompleted=0,horizonStops=0)=>advancePendingPolicy(p,
    {revision:revision+=2,scope:1,mode:0,width,horizonStops,completedBands:0,bandCompleted});
  assert.equal(feed(5),0);assert.equal(feed(7),0);assert.equal(feed(9),522);
  assert.equal(feed(12),522,'unacknowledged command remains outstanding');
  assert.equal(feed(6,1,10),0,'completion counter acknowledges the entire action');
  assert.equal(feed(7,1,10),0);assert.equal(feed(8,1,10),0);assert.equal(feed(10,1,10),522);
  assert.equal(p.triggers,2);assert.equal(p.releases,1);
});

test('asynchronous strategist can repeat one-band commands with clean shutdown',{timeout:15000},async()=>{
  process.env.JSMINSYS_STRATEGIST_POLICY='modes-pending-band';
  try{
    const {runTrial}=await import('./host.mjs');
    const r=await runTrial({fixture:{columns:7,rows:6,moves:[]},workers:2,policy:'inert',timeoutMs:500,warmups:0,cadenceMs:1});
    assert.equal(r.status,'TIMEOUT');assert.equal(r.cleanup,true);assert.deepEqual(r.errors,[]);
    assert.ok(r.strategist.pendingPolicies.some(p=>p.releases>=2));
    for(const e of r.evaluators){
      const m=e.result.metrics;
      assert.ok(m.bandStarted>=m.bandCompleted&&m.bandStarted-m.bandCompleted<=1);
      assert.equal(m.modeRegions,m.bandStarted,'exactly one local region per admitted command');
      assert.ok(m.modePasses<=2*m.bandStarted,'no repeated SHALLOW bands within a command');
    }
  }finally{delete process.env.JSMINSYS_STRATEGIST_POLICY;}
});
