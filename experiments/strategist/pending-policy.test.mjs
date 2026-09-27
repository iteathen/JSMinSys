import test from 'node:test';
import assert from 'node:assert/strict';

test('width policy requires sustained growth, waits for band progress, then rearms from fresh DEEP observations',async()=>{
  const {createPendingPolicy,advancePendingPolicy}=await import('./pending-policy.mjs');
  const p=createPendingPolicy();let revision=0;
  const feed=(width,mode=0,completedBands=0,horizonStops=0,scope=1)=>advancePendingPolicy(p,
    {revision:revision+=2,scope,width,mode,completedBands,horizonStops});
  assert.equal(feed(5),0);assert.equal(feed(7),0);
  assert.equal(feed(6),0,'contraction breaks the positive run');
  assert.equal(feed(8),0);assert.equal(feed(10),10,'two successive increases request stride-2 SHALLOW');
  assert.equal(advancePendingPolicy(p,null),10,'no delivery is not an acknowledgement');
  assert.equal(feed(12),10,'stale DEEP sample cannot close a SHALLOW intervention');
  assert.equal(feed(20,1,0,4),10,'horizon stops alone are not completed bands');
  assert.equal(feed(21,1,3,20),0,'completed band observed: strategist requests DEEP');
  assert.equal(p.lastBurstBands,3,'asynchronous overshoot remains visible');
  assert.equal(feed(22,1,4,30),0,'stale SHALLOW sample cannot rearm');
  assert.equal(feed(6,0,4,30),0);assert.equal(feed(9,0,4,30),0);
  assert.equal(feed(11,0,4,30),10,'new expansion can trigger again');
  assert.equal(p.triggers,2);assert.equal(p.releases,1);
  assert.equal(feed(12,0,0,0,2),0,'new solve resets the active command');
});

test('duplicate, regressed and discontinuous samples cannot manufacture sustained expansion',async()=>{
  const {createPendingPolicy,advancePendingPolicy}=await import('./pending-policy.mjs');
  const p=createPendingPolicy();
  const s={revision:2,scope:1,width:5,mode:0,completedBands:0,horizonStops:0};
  assert.equal(advancePendingPolicy(p,s),0);
  assert.equal(advancePendingPolicy(p,{...s,revision:4,width:7}),0);
  assert.equal(advancePendingPolicy(p,{...s,revision:4,width:9}),0);
  assert.equal(advancePendingPolicy(p,{...s,revision:2,width:20}),0);
  assert.equal(advancePendingPolicy(p,{...s,revision:6,width:10,horizonStops:1}),0);
  assert.equal(advancePendingPolicy(p,{...s,revision:8,width:12,horizonStops:1}),0);
  assert.equal(advancePendingPolicy(p,{...s,revision:10,width:14,horizonStops:1}),10);
});

test('live width policy drives existing worker modes without changing exact values or root restoration',async()=>{
  const {createPendingPolicy,advancePendingPolicy}=await import('./pending-policy.mjs');
  const {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32}=await import('../../addons/worker-behavior.mjs');
  const {prepareConnect4RbaGeometry}=await import('../../addons/rba-connect4-geometry.mjs');
  const {connect4RbaFromMoves}=await import('../../addons/rba-connect4-ingress.mjs');
  const ref=await import('../../addons/rba-connect4-alphabeta.mjs');
  const worker=await import('./observed-modes.generated.mjs');
  const {createPendingObservation,bindPendingObservation}=await import('./pending-observation.mjs');
  const {preparePendingReaders,pollPendingReader}=await import('./pending-reader.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  let totalTriggers=0,totalReleases=0;
  for(const moves of [[],[1],[2],[0,1,0,2],[3,2,3,1]]){
    const root=connect4RbaFromMoves(moves,{geometry:g});
    const expected=ref.solveConnect4RbaAlphaBeta(root,{state:ref.prepareConnect4RbaAlphaBeta({geometry:g}),reflected:root.reflected});
    const controls=createWorkerBehaviorMemory32(1),words=new Uint32Array(controls.buffer);
    const state=worker.prepareConnect4RbaAlphaBetaBehavior({geometry:g,cacheCapacity:128,behavior:new BehaviorWorker(0,words,0,controls)});
    const memory=createPendingObservation(1,4,4),reader=preparePendingReaders(memory)[0],p=createPendingPolicy();
    bindPendingObservation(state,memory,0);
    let token=256;publishWorkerBehavior32(words,0,token);
    const load=state.behaviorLoad;
    // Test-only deterministic delivery: real raw snapshots feed the real policy.
    state.behaviorLoad=()=>{
      const sample=pollPendingReader(memory,0,reader);
      if(sample){token^=256;publishWorkerBehavior32(words,0,token|advancePendingPolicy(p,sample));}
      return load();
    };
    const r=worker.solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
    assert.equal(r.status,'EXACT');assert.equal(r.value,expected.value);assert.equal(r.move,expected.move);
    assert.deepEqual(state.words.subarray(0,g.keyWords),root.words);
    totalTriggers+=p.triggers;totalReleases+=p.releases;
  }
  assert.ok(totalTriggers>1);assert.ok(totalReleases>1,'must return to DEEP and rearm');
});

test('asynchronous width strategist delivers both modes and stops cleanly',{timeout:15000},async()=>{
  process.env.JSMINSYS_STRATEGIST_POLICY='modes-pending-pfif';
  try{
    const {runTrial}=await import('./host.mjs');
    const r=await runTrial({fixture:{columns:7,rows:6,moves:[]},workers:2,policy:'inert',timeoutMs:500,warmups:0,cadenceMs:1});
    assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);assert.deepEqual(r.errors,[]);
    assert.equal(r.cleanup,true);assert.equal(r.forcedTerminations,0);
    assert.ok(r.strategist.pendingPolicies.some(p=>p.triggers>0&&p.releases>0));
    assert.ok(r.strategist.trace.some(t=>t.flags.some(f=>f&2)));
    assert.ok(r.evaluators.some(e=>e.result.metrics.horizonStops>0));
  }finally{delete process.env.JSMINSYS_STRATEGIST_POLICY;}
});
