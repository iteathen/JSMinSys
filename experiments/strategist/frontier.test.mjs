import test from 'node:test';
import assert from 'node:assert/strict';
import {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../../addons/worker-behavior.mjs';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../../addons/rba-connect4-alphabeta.mjs';
import {createConnect4RbaSharedExactCache32} from '../../addons/rba-connect4-shared-exact-cache.mjs';
process.env.JSMINSYS_FLAG_DISPATCH='actions';
const controls=await import('./controls.mjs');

test('narrow-frontier action stops bounded passes once one root obligation remains',async()=>{
  const {prepareConnect4RbaAlphaBetaBehavior:prepare,solveConnect4RbaAlphaBetaBehavior:solve}=await import('./frontier.generated.mjs');
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  const root=connect4RbaFromMoves([...'1320461024522311'].map(Number),{geometry:g});
  const expected=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:4096}),reflected:root.reflected});
  const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
  publishWorkerBehavior32(words,0,controls.encodeFrontier({stride:2,target:1}));
  const state=prepare({geometry:g,cacheCapacity:4096,
    sharedExactCache:createConnect4RbaSharedExactCache32({capacity:16384,keyWords:g.keyWords}),
    behavior:new BehaviorWorker(0,words,0,memory)});
  const load=state.behaviorLoad;state.behaviorLoad=()=>state.nodes>=300000?1:load();
  const r=solve(root,{state,reflected:root.reflected});
  assert.equal(r.status,'EXACT','bounded exploration must end when its narrowing objective is met');
  assert.equal(r.value,expected.value);assert.equal(r.move,expected.move);
  assert.equal(r.metrics.frontierAutoReleases,1);assert.equal(state.frontierLimit,g.cellCount);
});

test('target already met releases before exploration; target encodes without extension collision',async()=>{
  const {prepareConnect4RbaAlphaBetaBehavior:prepare,solveConnect4RbaAlphaBetaBehavior:solve}=await import('./frontier.generated.mjs');
  for(const target of [-1,32,1.5])assert.throws(()=>controls.encodeFrontier({target}),RangeError);
  assert.equal(controls.encodeFrontier({target:31})>>>31,0);
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),root=connect4RbaFromMoves([],{geometry:g});
  const expected=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g}),reflected:root.reflected});
  const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
  publishWorkerBehavior32(words,0,controls.encodeFrontier({stride:2,target:4}));
  const state=prepare({geometry:g,behavior:new BehaviorWorker(0,words,0,memory)});
  const r=solve(root,{state,reflected:root.reflected});
  assert.equal(r.status,'EXACT');assert.equal(r.value,expected.value);assert.equal(r.move,expected.move);
  assert.equal(r.metrics.frontierAutoReleases,1);assert.equal(r.metrics.horizonStops,0);
  assert.equal(r.metrics.frontierPasses,1);
});

test('real strategist supplies narrow-frontier action to evaluator',{timeout:15000},async()=>{
  process.env.JSMINSYS_STRATEGIST_POLICY='frontier-2-narrow';
  try{
    const {runTrial}=await import('./host.mjs');
    const r=await runTrial({fixture:{columns:7,rows:6,moves:[...'1320461024522311'].map(Number)},
      workers:1,policy:'inert',timeoutMs:750,warmups:0});
    assert.equal(r.status,'EXACT');assert.equal(r.value,1);assert.equal(r.cleanup,true);
    assert.equal(r.evaluators[0].result.metrics.frontierAutoReleases,1);
    assert.ok(r.strategist.trace.every(t=>((t.flags[0]>>>24)&31)===1));
  }finally{delete process.env.JSMINSYS_STRATEGIST_POLICY;}
});

test('root completion polls STOP after an immediate winning child',async()=>{
  const {prepareConnect4RbaAlphaBetaBehavior:prepare,solveConnect4RbaAlphaBetaBehavior:solve}=await import('./frontier.generated.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),root=connect4RbaFromMoves([0,1,0,1,0,2],{geometry:g});
  const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
  const state=prepare({geometry:g,behavior:new BehaviorWorker(0,words,0,memory)});
  state.behaviorLoad=()=>state.frontierValues[0]===1?1:0;
  const r=solve(root,{state,reflected:root.reflected});
  assert.equal(r.status,'CANCELLED');assert.equal(r.value,null);
});

test('worker supplies bounded frontier, stride change, release and STOP actions',async()=>{
  assert.equal(typeof controls.encodeFrontier,'function','frontier worker actions must exist');
  const {prepareConnect4RbaAlphaBetaBehavior:prepare,solveConnect4RbaAlphaBetaBehavior:solve}=await import('./frontier.generated.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  for(const stride of [1,2,4,8])for(const moves of [[],[1],[1,2],[0,1,0,2],[3,2,3,1]]){
    const root=connect4RbaFromMoves(moves,{geometry:g});
    const expected=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:1024}),reflected:root.reflected});
    const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
    publishWorkerBehavior32(words,0,controls.encodeFrontier({stride}));
    const state=prepare({geometry:g,cacheCapacity:1024,behavior:new BehaviorWorker(0,words,0,memory)});
    const actual=solve(root,{state,reflected:root.reflected});
    assert.equal(actual.status,'EXACT');assert.equal(actual.value,expected.value);
    assert.equal(actual.move,expected.move,'root witness must survive horizon passes');
    assert.ok(actual.metrics.frontierPasses>=1);
    if(stride===1&&moves.length===0){
      assert.ok(actual.metrics.frontierPasses>1);assert.ok(actual.metrics.horizonStops>0);
      assert.ok(actual.metrics.cacheHits>0,'exact cache persists across passes');
    }
  }
});

test('unfinished horizon is never cached as WDL; live release and cancellation are honored',async()=>{
  assert.equal(typeof controls.encodeFrontier,'function');
  const {prepareConnect4RbaAlphaBetaBehavior:prepare,solveConnect4RbaAlphaBetaBehavior:solve}=await import('./frontier.generated.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),root=connect4RbaFromMoves([],{geometry:g});
  const expected=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g}),reflected:root.reflected});
  for(const stop of [false,true]){
    const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
    publishWorkerBehavior32(words,0,controls.encodeFrontier({stride:1}));
    const state=prepare({geometry:g,cacheCapacity:1024,behavior:new BehaviorWorker(0,words,0,memory)});
    const load=state.behaviorLoad;let reads=0;
    state.behaviorLoad=()=>{
      if(++reads===30)publishWorkerBehavior32(words,0,stop?1:controls.encodeFrontier({release:true}));
      return load();
    };
    const result=solve(root,{state,reflected:root.reflected});
    assert.equal(result.status,stop?'CANCELLED':'EXACT');
    if(stop)assert.equal(result.value,null);
    else {assert.equal(result.value,expected.value);assert.equal(result.move,expected.move);assert.equal(state.frontierLimit,g.cellCount);}
    for(let slot=0;slot<state.cache.stamp.length;slot++)if(state.cache.stamp[slot]===state.cache.epoch)
      assert.ok(state.cache.value[slot]>=1&&state.cache.value[slot]<=3);
  }
});

test('live stride changes preserve results; terminal ingress and reflected late roots agree',async()=>{
  const {prepareConnect4RbaAlphaBetaBehavior:prepare,solveConnect4RbaAlphaBetaBehavior:solve}=await import('./frontier.generated.mjs');
  for(const [columns,rows,moves] of [[4,4,[0,1,0,1,0,1,0]],
    [7,6,[4,0,0,0,3,3,0,0,6,2,3,0,2,3,6,3,6,3,4,6,2,2,6,1,2,5,6,4]],
    [7,6,[2,6,6,6,3,3,6,6,0,4,3,6,4,3,0,3,0,3,2,0,4,4,0,5,4,1,0,2]]]){
    const g=prepareConnect4RbaGeometry({columns,rows}),root=connect4RbaFromMoves(moves,{geometry:g});
    const expected=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:128}),reflected:root.reflected});
    const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
    publishWorkerBehavior32(words,0,controls.encodeFrontier({stride:1}));
    const state=prepare({geometry:g,cacheCapacity:128,behavior:new BehaviorWorker(0,words,0,memory)});
    const load=state.behaviorLoad;let reads=0;
    state.behaviorLoad=()=>{if(++reads===30)publishWorkerBehavior32(words,0,controls.encodeFrontier({stride:3}));return load();};
    const r=solve(root,{state,reflected:root.reflected});
    assert.equal(r.status,'EXACT');assert.equal(r.value,expected.value);assert.equal(r.move,expected.move);
    if(reads>30)assert.equal(state.frontierStride,3);
  }
});

test('actual frontier workers obey asynchronous STOP without false exact publication',{timeout:15000},async()=>{
  process.env.JSMINSYS_STRATEGIST_POLICY='frontier-4';
  try{
    const {runTrial}=await import('./host.mjs');
    const r=await runTrial({fixture:{columns:7,rows:6,moves:[]},workers:2,policy:'inert',timeoutMs:30,warmups:0});
    assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);assert.equal(r.cleanup,true);
    assert.equal(r.forcedTerminations,0);
    assert.ok(r.evaluators.every(e=>e.result.status==='CANCELLED'&&e.result.metrics.horizonStops>0));
  }finally{delete process.env.JSMINSYS_STRATEGIST_POLICY;}
});

test('bounded passes agree with independent physical minimax on seeded late 4x4 positions',async()=>{
  const {prepareConnect4RbaAlphaBetaBehavior:prepare,solveConnect4RbaAlphaBetaBehavior:solve}=await import('./frontier.generated.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),lines=[];
  for(let r=0;r<4;r++)for(let c=0;c<4;c++)for(const [dc,dr] of [[1,0],[0,1],[1,1],[1,-1]])
    if(c+3*dc<4&&r+3*dr>=0&&r+3*dr<4)lines.push(Array.from({length:4},(_,i)=>(r+i*dr)*4+c+i*dc));
  const terminal=(board,ply)=>lines.some(l=>l.every(cell=>board[cell]===0))?3:
    lines.some(l=>l.every(cell=>board[cell]===1))?1:ply===16?2:0;
  function exact(board,heights,ply){
    const t=terminal(board,ply);if(t)return t;
    const mover=ply&1;let best=mover?4:0;
    for(let c=0;c<4;c++)if(heights[c]<4){
      const cell=heights[c]++*4+c;board[cell]=mover;
      const v=exact(board,heights,ply+1);board[cell]=-1;heights[c]--;
      best=mover?Math.min(best,v):Math.max(best,v);
    }
    return best;
  }
  let seed=0x1234,checked=0;
  for(let sample=0;sample<32;sample++){
    const board=new Int8Array(16).fill(-1),heights=new Uint8Array(4),moves=[];
    while(moves.length<10+sample%4&&!terminal(board,moves.length)){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      let c=seed>>>30;while(heights[c]===4)c=(c+1)&3;
      board[heights[c]++*4+c]=moves.length&1;moves.push(c);
    }
    const expected=exact(board,heights,moves.length),root=connect4RbaFromMoves(moves,{geometry:g});
    const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
    publishWorkerBehavior32(words,0,controls.encodeFrontier({stride:1+sample%4}));
    const state=prepare({geometry:g,cacheCapacity:16,behavior:new BehaviorWorker(0,words,0,memory)});
    const r=solve(root,{state,reflected:root.reflected});
    assert.equal(r.status,'EXACT');assert.equal(r.value,expected,JSON.stringify(moves));
    if(!terminal(board,moves.length)){
      assert.ok(r.move>=0&&r.move<4&&heights[r.move]<4);
      board[heights[r.move]++*4+r.move]=moves.length&1;
      assert.equal(exact(board,heights,moves.length+1),expected,'optimal physical witness');
    }
    checked++;
  }
  assert.equal(checked,32);
});
