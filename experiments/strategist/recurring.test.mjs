import test from 'node:test';
import assert from 'node:assert/strict';
import {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../../addons/worker-behavior.mjs';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../../addons/rba-connect4-alphabeta.mjs';
process.env.JSMINSYS_FLAG_DISPATCH='actions';
const controls=await import('./controls.mjs');

test('recurring flag enables local expansion after a prior local collapse',async()=>{
  const flags=controls.encodeFrontier({stride:2,target:1,recurring:true});
  assert.ok(flags&0x20000000,'worker needs an explicit recurring action');
  const mod=await import('./recurring.generated.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  let localReentries=0,retained=0;
  for(const moves of [[],[1],[1,2],[0,1,0,2],[3,2,3,1]]){
    const root=connect4RbaFromMoves(moves,{geometry:g});
    const expected=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g}),reflected:root.reflected});
    const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
    publishWorkerBehavior32(words,0,flags);
    const state=mod.prepareConnect4RbaAlphaBetaBehavior({geometry:g,cacheCapacity:128,behavior:new BehaviorWorker(0,words,0,memory)});
    const actual=mod.solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
    assert.equal(actual.status,'EXACT');assert.equal(actual.value,expected.value);assert.equal(actual.move,expected.move);
    assert.deepEqual(state.words.subarray(0,g.keyWords),root.words);
    localReentries+=actual.metrics.recurringLocalReentries;
    retained+=actual.metrics.recurringRetainedSkips;
  }
  assert.ok(localReentries>0,'must show branch -> collapse -> deeper branch, not just root restart');
  assert.ok(retained>0,'completed query children survive repeated local passes');
});

test('recurring local queries agree with independent physical minimax and preserve terminal/mirror semantics',async()=>{
  const mod=await import('./recurring.generated.mjs');
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
  let seed=1234;
  for(let sample=0;sample<48;sample++){
    const board=new Int8Array(16).fill(-1),heights=new Uint8Array(4),moves=[];
    while(moves.length<8+sample%6&&!terminal(board,moves.length)){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      let c=seed>>>30;while(heights[c]===4)c=(c+1)&3;
      board[heights[c]++*4+c]=moves.length&1;moves.push(c);
    }
    const expected=exact(board,heights,moves.length);
    for(const mirrored of [false,true]){
      const root=connect4RbaFromMoves(mirrored?moves.map(c=>3-c):moves,{geometry:g});
      const reference=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g}),reflected:root.reflected});
      const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
      publishWorkerBehavior32(words,0,controls.encodeFrontier({stride:1+sample%3,target:1,recurring:true}));
      const state=mod.prepareConnect4RbaAlphaBetaBehavior({geometry:g,cacheCapacity:16,behavior:new BehaviorWorker(0,words,0,memory)});
      const r=mod.solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
      assert.equal(r.status,'EXACT');assert.equal(r.value,expected);assert.equal(r.move,reference.move);
      if(!terminal(board,moves.length)){
        const c=mirrored?3-r.move:r.move;
        assert.ok(c>=0&&c<4&&heights[c]<4);
        board[heights[c]++*4+c]=moves.length&1;
        assert.equal(exact(board,heights,moves.length+1),expected);
        board[--heights[c]*4+c]=-1;
      }
    }
  }
});

test('live recurring disable and STOP leave native continuation and cancellation exact',async()=>{
  const mod=await import('./recurring.generated.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),root=connect4RbaFromMoves([1],{geometry:g});
  const reference=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g}),reflected:root.reflected});
  for(const stop of [false,true]){
    const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
    publishWorkerBehavior32(words,0,controls.encodeFrontier({stride:2,target:1,recurring:true}));
    const state=mod.prepareConnect4RbaAlphaBetaBehavior({geometry:g,behavior:new BehaviorWorker(0,words,0,memory)});
    const load=state.behaviorLoad;
    state.behaviorLoad=()=>{
      if(state.recurringLocalReentries>0)publishWorkerBehavior32(words,0,stop?1:controls.encodeFrontier({release:true}));
      return load();
    };
    const r=mod.solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
    assert.ok(r.metrics.recurringLocalReentries>0);
    assert.equal(r.status,stop?'CANCELLED':'EXACT');
    if(stop)assert.equal(r.value,null);
    else {assert.equal(r.value,reference.value);assert.equal(r.move,reference.move);assert.equal(state.frontierRecurring,0);}
  }
});

test('real recurring worker cleans up an unresolved short deadline',{timeout:15000},async()=>{
  process.env.JSMINSYS_STRATEGIST_POLICY='frontier-2-recurring';
  try{
    const {runTrial}=await import('./host.mjs');
    const r=await runTrial({fixture:{columns:7,rows:6,moves:[]},workers:1,policy:'inert',timeoutMs:30,warmups:0});
    assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);assert.equal(r.cleanup,true);
    assert.equal(r.forcedTerminations,0);
  }finally{delete process.env.JSMINSYS_STRATEGIST_POLICY;}
});
