import test from 'node:test';
import assert from 'node:assert/strict';
import {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../../addons/worker-behavior.mjs';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';

test('raw snapshot publication is coherent; only strategist calculates pending width',async()=>{
  const {createPendingObservation,bindPendingObservation,publishPendingObservation,readPendingObservation,measurePendingObservation}=await import('./pending-observation.mjs');
  const memory=createPendingObservation(2,4,4),g={columns:4,cellCount:16};
  const state={g,observeCounts:new Uint32Array(17),modeRootValues:new Int8Array([-2,-2,0,-2]),
    modeResolved:new Uint8Array(68),observeEpoch:1,observeRequest:256,observePending:1,
    searchShallow:0,horizonStops:0,nodes:20,modePasses:9,modeRegions:3,modeRootPasses:2};
  state.observeCounts[0]=3;state.observeCounts[2]=2;state.modeResolved[9]=1;
  bindPendingObservation(state,memory,1);publishPendingObservation(state,2);
  const scratch=new Uint32Array(memory.stride);
  assert.equal(readPendingObservation(memory,0,scratch),0,'worker slots isolated');
  assert.equal(readPendingObservation(memory,1,scratch),1);
  const m=measurePendingObservation(memory,scratch);
  assert.equal(m.width,2);assert.equal(m.depth,2);assert.equal(m.scope,1);assert.equal(m.request,256);
  assert.equal(m.completedBands,7,'six local incomplete bands and one root band completed');
  assert.equal(state.observePending,0);assert.equal(state.observePublications,1);
  assert.throws(()=>bindPendingObservation(state,memory,1),/slot must be fresh/);
  const base=memory.stride;Atomics.store(memory.words,base,3);
  assert.equal(readPendingObservation(memory,1,scratch),0,'in-flight publication rejected');
});

test('strategist compares only snapshots in the same solve, mode and horizon scope',async()=>{
  const {createPendingObservation,bindPendingObservation,publishPendingObservation}=await import('./pending-observation.mjs');
  const {preparePendingReaders,pollPendingReader}=await import('./pending-reader.mjs');
  const memory=createPendingObservation(1,4,4),reader=preparePendingReaders(memory)[0];
  const state={g:{columns:4,cellCount:16},observeCounts:new Uint32Array(17),modeRootValues:new Int8Array([-2,-2,-2,0]),
    modeResolved:new Uint8Array(68),observeEpoch:1,observeRequest:256,observePending:1,
    searchShallow:0,horizonStops:0,nodes:20};
  state.observeCounts[0]=3;bindPendingObservation(state,memory,0);
  const poll=()=>{publishPendingObservation(state,0);return pollPendingReader(memory,0,reader);};
  assert.equal(poll().delta,null);assert.equal(pollPendingReader(memory,0,reader),null);
  state.modeRootValues[2]=0;assert.equal(poll().delta,-1);
  state.modeRootValues[2]=-2;assert.equal(poll().delta,1);
  state.observeEpoch++;assert.equal(poll().delta,null);
  state.searchShallow=1;assert.equal(poll().delta,null);
  state.horizonStops++;assert.equal(poll().delta,null);
  assert.equal(poll().delta,0);
  const version=Atomics.load(memory.words,0);
  state.observeSequence=0xfffffffe;state.observePending=1;publishPendingObservation(state,0);
  assert.equal(Atomics.load(memory.words,0),version,'sequence must not wrap');
  assert.equal(state.observePending,0);
});

test('request-only snapshots preserve traversal and expose live branches',async()=>{
  const base=await import('./modes.generated.mjs'),mod=await import('./observed-modes.generated.mjs');
  const {createPendingObservation,bindPendingObservation,readPendingObservation,measurePendingObservation}=await import('./pending-observation.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  for(const moves of [[],[1],[2],[0,1,0,2]]){
    const root=connect4RbaFromMoves(moves,{geometry:g}),flags=createWorkerBehaviorMemory32(1),words=new Uint32Array(flags.buffer);
    const behavior=new BehaviorWorker(0,words,0,flags);
    const ref=base.solveConnect4RbaAlphaBetaBehavior(root,{state:base.prepareConnect4RbaAlphaBetaBehavior({geometry:g,behavior}),reflected:root.reflected});
    const state=mod.prepareConnect4RbaAlphaBetaBehavior({geometry:g,behavior});
    const memory=createPendingObservation(1,4,4),scratch=new Uint32Array(memory.stride);
    bindPendingObservation(state,memory,0);
    const load=state.behaviorLoad;let request=256,lastVersion=0,samples=0,min=Infinity,max=0;
    publishWorkerBehavior32(words,0,request);
    // Deterministic test-only strategist, executed between completion polls.
    state.behaviorLoad=()=>{
      if(readPendingObservation(memory,0,scratch)&&scratch[0]!==lastVersion){
        lastVersion=scratch[0];const m=measurePendingObservation(memory,scratch);
        assert.ok(m.width>=1);assert.equal(m.mode,0);assert.equal(m.horizonStops,0);
        min=Math.min(min,m.width);max=Math.max(max,m.width);samples++;
        request^=256;publishWorkerBehavior32(words,0,request);
      }
      return load();
    };
    const r=mod.solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
    assert.equal(r.status,'EXACT');assert.equal(r.value,ref.value);assert.equal(r.move,ref.move);
    for(const k of ['nodes','cofactors','cacheHits','cutoffs','cpcExact'])assert.equal(r.metrics[k],ref.metrics[k]);
    assert.ok(samples>10);assert.ok(max>min,'must expose changing live width');
  }
});

test('without requests the observation variant never publishes',async()=>{
  const mod=await import('./observed-modes.generated.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),root=connect4RbaFromMoves([1],{geometry:g});
  const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
  const state=mod.prepareConnect4RbaAlphaBetaBehavior({geometry:g,behavior:new BehaviorWorker(0,words,0,memory)});
  const r=mod.solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
  assert.equal(r.status,'EXACT');assert.equal(r.metrics.observePublications,0);
});

test('asynchronous strategist measures snapshots while two workers remain in DEEP',{timeout:15000},async()=>{
  process.env.JSMINSYS_STRATEGIST_POLICY='modes-pending-read';
  try{
    const {runTrial}=await import('./host.mjs');
    const r=await runTrial({fixture:{columns:7,rows:6,moves:[]},workers:2,policy:'inert',timeoutMs:150,warmups:0,cadenceMs:1});
    assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);assert.equal(r.cleanup,true);
    assert.equal(r.forcedTerminations,0);assert.deepEqual(r.errors,[]);
    assert.ok(r.strategist.pending.every(p=>p.samples>=2&&p.minWidth>=1));
    assert.ok(r.strategist.trace.every(t=>t.flags.every(f=>(f&2)===0)));
    assert.ok(r.evaluators.every(e=>e.result.metrics.observePublications>=2));
  }finally{delete process.env.JSMINSYS_STRATEGIST_POLICY;}
});
