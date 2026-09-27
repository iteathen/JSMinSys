import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../../addons/worker-behavior.mjs';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../../addons/rba-connect4-alphabeta.mjs';

test('mode worker contains execution only, without local probe selection or rearming',async()=>{
  const {encodeSearchMode,completeModeNode32}=await import('./mode-controls.mjs');
  const source=readFileSync(new URL('./modes.generated.mjs',import.meta.url),'utf8');
  for(const forbidden of ['releaseNarrowFrontier','frontierTarget','recurringBounded','recurringRearms','lineage','frontierPending'])
    assert.equal(source.includes(forbidden),false,forbidden);
  // CPC-only mode specializations must not inherit unavailable front machinery.
  for(const file of ['modes','observed-modes','one-band']){
    const generated=readFileSync(new URL(`./${file}.generated.mjs`,import.meta.url),'utf8');
    for(const dead of ['RBA_AB_CPC_FOUR_FRONT_BEHAVIOR','boundaryDepth','boundaryCapacity','boundaryBudget',
      'actionLo','actionHi','actionKnown','frontCalls','frontExact','frontFailures','frontSteps','frontActionExact',
      'connect4RbaTerminal','connect4RbaRank'])assert.equal(generated.includes(dead),false,`${file}: ${dead}`);
  }
  assert.equal(encodeSearchMode({shallow:false}),0);
  assert.throws(()=>encodeSearchMode({stride:0}));
  let loads=0;
  const state={behaviorLoad:()=>{loads++;return 0;},campaignLast:0};
  assert.equal(completeModeNode32(state,2),2);assert.equal(loads,1);
});

test('strategist mode changes during native recursion preserve value, witness and restoration',async()=>{
  const {encodeSearchMode}=await import('./mode-controls.mjs');
  const mod=await import('./modes.generated.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  for(const moves of [[],[1],[1,2],[0,1,0,2],[3,2,3,1]])for(const startShallow of [false,true]){
    const root=connect4RbaFromMoves(moves,{geometry:g});
    const ref=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g}),reflected:root.reflected});
    const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
    publishWorkerBehavior32(words,0,encodeSearchMode({shallow:startShallow}));
    const state=mod.prepareConnect4RbaAlphaBetaBehavior({geometry:g,cacheCapacity:128,behavior:new BehaviorWorker(0,words,0,memory)});
    const load=state.behaviorLoad;let reads=0;
    // Test publisher only: deterministic live writes, never production telemetry.
    state.behaviorLoad=()=>{
      reads++;
      if(reads===100||reads===300||reads===500)
        publishWorkerBehavior32(words,0,encodeSearchMode({shallow:reads===300?startShallow:!startShallow}));
      return load();
    };
    const result=mod.solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
    assert.equal(result.status,'EXACT');assert.equal(result.value,ref.value);assert.equal(result.move,ref.move);
    assert.deepEqual(state.words.subarray(0,g.keyWords),root.words);
    assert.ok(state.campaignChanges>=3);
    assert.ok(result.metrics.horizonStops>0,'SHALLOW must execute bounded work, including root bands');
  }
});

test('mode STOP cannot publish incomplete work as WDL',async()=>{
  const {encodeSearchMode}=await import('./mode-controls.mjs');
  const mod=await import('./modes.generated.mjs'),g=prepareConnect4RbaGeometry({columns:4,rows:4});
  const root=connect4RbaFromMoves([],{geometry:g});
  for(const shallow of [false,true]){
    const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
    publishWorkerBehavior32(words,0,encodeSearchMode({shallow}));
    const state=mod.prepareConnect4RbaAlphaBetaBehavior({geometry:g,behavior:new BehaviorWorker(0,words,0,memory)});
    const load=state.behaviorLoad;let reads=0;
    state.behaviorLoad=()=>{if(++reads===300)publishWorkerBehavior32(words,0,1);return load();};
    const result=mod.solveConnect4RbaAlphaBetaBehavior(root,{state});
    assert.equal(result.status,'CANCELLED');assert.equal(result.value,null);
  }
});

test('mode policy is strategist-owned and delayed updates coalesce safely',async()=>{
  const {modePolicyFlags}=await import('./mode-policy.mjs');
  assert.notEqual(modePolicyFlags('modes-switch-check',0),0);
  assert.equal(modePolicyFlags('modes-switch-check',6),0);
  assert.notEqual(modePolicyFlags('modes-switch-check',11),0);
  assert.equal(modePolicyFlags('modes-switch-check',16),0);
  assert.equal(modePolicyFlags('modes-switch-check',200),0);
});

test('real asynchronous strategist switches modes and stops evaluators cleanly',{timeout:15000},async()=>{
  process.env.JSMINSYS_STRATEGIST_POLICY='modes-switch-check';
  try{
    const {runTrial}=await import('./host.mjs');
    const r=await runTrial({fixture:{columns:7,rows:6,moves:[]},workers:2,policy:'inert',timeoutMs:150,warmups:0,cadenceMs:1});
    assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);assert.equal(r.cleanup,true);
    assert.equal(r.forcedTerminations,0);assert.deepEqual(r.errors,[]);
    assert.ok(r.strategist.writes>4);
    assert.ok(r.evaluators.every(e=>e.changes>=2));
    assert.ok(r.evaluators.every(e=>e.result.metrics.horizonStops>0));
    assert.ok(r.strategist.trace.some(t=>t.flags.every(f=>(f&2)===0)));
  }finally{delete process.env.JSMINSYS_STRATEGIST_POLICY;}
});
