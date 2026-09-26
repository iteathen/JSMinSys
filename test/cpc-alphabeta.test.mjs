import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {
  prepareConnect4CpcScratch,evaluateConnect4Cpc32,evaluateConnect4CpcNonterminal32,connect4CpcTargetOwner32,
  CPC_NONE,CPC_EXACT,CPC_BOUND,CPC_RESTRICT,
} from '../addons/cpc-connect4.mjs';
import {
  prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta,
  RBA_AB_CPC_ONLY,RBA_AB_CPC_FOUR_FRONT,
} from '../addons/rba-connect4-alphabeta.mjs';

function winningLines(columns,rows){
  const out=[];
  for(let r=0;r<rows;r++)for(let c=0;c<columns;c++)for(const [dc,dr] of [[1,0],[0,1],[1,1],[1,-1]])
    if(c+3*dc<columns&&r+3*dr>=0&&r+3*dr<rows)
      out.push(Array.from({length:4},(_,i)=>(r+i*dr)*columns+c+i*dc));
  return out;
}
function physical(columns,rows,moves){
  const lines=winningLines(columns,rows),board=new Int8Array(columns*rows);board.fill(-1);
  const heights=new Uint32Array(columns);let terminal=0;
  for(let ply=0;ply<moves.length;ply++){
    const c=moves[ply],p=ply&1;
    if(terminal||c<0||c>=columns||heights[c]>=rows)throw Error('illegal fixture');
    board[heights[c]++*columns+c]=p;
    if(lines.some(line=>line.every(cell=>board[cell]===p)))terminal=p?1:3;
    else if(ply+1===columns*rows)terminal=2;
  }
  return {board,heights,terminal,lines};
}
function exact(columns,rows,moves,memo=new Map()){
  const p=physical(columns,rows,moves);
  if(p.terminal)return {value:p.terminal,move:-1};
  const key=Array.from(p.board).join(',');
  const hit=memo.get(key);if(hit)return hit;
  const center=(columns-1)/2,order=Array.from({length:columns},(_,c)=>c)
    .sort((a,b)=>Math.abs(a-center)-Math.abs(b-center)||a-b);
  const mover=moves.length&1;let best=mover?4:0,move=-1;
  for(const c of order)if(p.heights[c]<rows){
    const v=exact(columns,rows,[...moves,c],memo).value;
    if(mover?v<best:v>best){best=v;move=c;}
    if(best===(mover?1:3))break;
  }
  const result={value:best,move};memo.set(key,result);return result;
}

function assertOptimalWitness(columns,rows,moves,result,memo){
  assert.ok(result.move>=0&&result.move<columns,JSON.stringify({moves,result}));
  assert.equal(exact(columns,rows,[...moves,result.move],memo).value,result.value,JSON.stringify({moves,result}));
}

test('CPC per-column XOR parity equals literal future-event count on configured geometries',()=>{
  for(const [columns,rows,heightSets] of [
    [4,4,[[0,0,0,0],[1,2,0,3],[4,1,2,0]]],
    [10,10,[[0,0,0,0,0,0,0,0,0,0],[1,2,3,4,5,6,7,8,9,0],[10,9,8,7,6,5,4,3,2,1]]],
  ]){
    const g=prepareConnect4RbaGeometry({columns,rows,specializationBudgetBytes:0});
    for(const heights of heightSets){
      const words=new Uint32Array(g.keyWords);let rank=0;
      for(let c=0;c<columns;c++){words[c]=heights[c];rank+=heights[c];}
      words[g.metaOffset]=rank<<2;
      for(let c=0;c<columns;c++)for(let r=heights[c];r<rows;r++){
        const cell=r*columns+c;let events=0;
        for(let d=0;d<columns;d++)events+=d===c?r-heights[d]+1:rows-heights[d];
        const expected=(rank&1)^((events-1)&1);
        assert.equal(connect4CpcTargetOwner32(g,words,0,cell),expected,`${columns}x${rows} c${c} r${r}`);
      }
    }
  }
});

test('nonterminal CPC path matches checked evaluator after terminal assertion',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  for(const moves of [[3,2,3,2],[4,0,0,0,3,3,0,0,6,2,3,0,2,3,6,3]]) {
    const q=connect4RbaFromMoves(moves,{geometry:g,canonical:false}),
      checked=prepareConnect4CpcScratch(g),known=prepareConnect4CpcScratch(g);
    assert.equal(q.words[g.metaOffset]&3,0);
    const a=evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,checked);
    const b=evaluateConnect4CpcNonterminal32(g,q.words,0,q.basis,0,q.basis.length,known);
    assert.equal(a,b);
    assert.deepEqual([...checked.interval],[...known.interval]);
    assert.equal(checked.forcedColumn[0],known.forcedColumn[0]);
    assert.equal(checked.preemptionMask32[0],known.preemptionMask32[0]);
    assert.equal(checked.preemptionCount[0],known.preemptionCount[0]);
  }
});

test('projected CPC advisory collection is semantically inert and opt-in',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  const moves=[4,0,0,0,3,3,0,0,6,2,3,0,2,3,6,3,6,3,4,6,2,2,6,1,2,5,6,4];
  const off=prepareConnect4CpcScratch(g),on=prepareConnect4CpcScratch(g,{projectedAdvisory:true});
  let sawProjected=0;
  for(let rank=16;rank<=moves.length;rank+=1){
    const q=connect4RbaFromMoves(moves.slice(0,rank),{geometry:g,canonical:false});
    const offKind=evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,off);
    const offInterval=[...off.interval],offMask=off.preemptionMask32[0],offCount=off.preemptionCount[0];
    const onKind=evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,on);
    assert.equal(onKind,offKind);
    assert.deepEqual([...on.interval],offInterval);
    assert.equal(on.preemptionMask32[0],offMask);
    assert.equal(on.preemptionCount[0],offCount);
    assert.equal(off.projectedForks[0]+off.projectedForks[1],0);
    if(on.projectedForks[0]+on.projectedForks[1])sawProjected=1;
  }
  assert.equal(sawProjected,1);
});

test('CPC pooled-frontier response extends all-even pairing without counting omitted frontiers',()=>{
  const columns=4,rows=4,g=prepareConnect4RbaGeometry({columns,rows});

  // Two odd-remainder columns form an even frontier pool. Every surviving P0
  // requirement is covered by a true upper-response cell, so P0 gets an exact
  // no-win upper bound even though the old all-even guard would reject this q.
  const positive=[0,1,0,0],q=connect4RbaFromMoves(positive,{geometry:g,canonical:false}),s=prepareConnect4CpcScratch(g,{frontierResponse:true});
  let odd=0;for(let c=0;c<columns;c+=1)odd+=(rows-q.words[c])&1;
  assert.equal(odd,2);
  assert.equal(evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,s),CPC_BOUND);
  assert.deepEqual([...s.interval],[1,2]);
  assert.equal(exact(columns,rows,positive).value,2);

  // Fixing the two frontier cells as a synchronized response pair adds an
  // exact pair blocker beyond pooled vertical-response coverage.
  const paired=[0,2,0,0],pq=connect4RbaFromMoves(paired,{geometry:g,canonical:false}),ps=prepareConnect4CpcScratch(g,{frontierResponse:true});
  odd=0;for(let c=0;c<columns;c+=1)odd+=(rows-pq.words[c])&1;
  assert.equal(odd,2);
  assert.equal(evaluateConnect4Cpc32(g,pq.words,0,pq.basis,0,pq.basis.length,ps),CPC_BOUND);
  assert.deepEqual([...ps.interval],[1,2]);
  assert.equal(exact(columns,rows,paired).value,2);

  // Omitted frontier parity alone is still not enough: if a residual contains
  // only one endpoint of each fixed pair and no true upper-response cell, the
  // certificate must remain conservative.
  const negative=[0,0,0,2,2,2],nq=connect4RbaFromMoves(negative,{geometry:g,canonical:false}),ns=prepareConnect4CpcScratch(g,{frontierResponse:true});
  odd=0;for(let c=0;c<columns;c+=1)odd+=(rows-nq.words[c])&1;
  assert.equal(odd,2);
  assert.equal(evaluateConnect4Cpc32(g,nq.words,0,nq.basis,0,nq.basis.length,ns),CPC_NONE);
  assert.deepEqual([...ns.interval],[1,3]);
});

test('CPC closes a forced block that lifts another opponent terminal singleton',()=>{
  const columns=4,rows=4,g=prepareConnect4RbaGeometry({columns,rows});
  // P1 to move after 001001113. P0 has one playable singleton in column 2.
  // P1 must occupy that cell, but doing so raises column 2 by one and exposes
  // a second P0 singleton immediately above it. No P1 immediate terminal exists.
  const moves=[0,0,1,0,0,1,1,1,3];
  const q=connect4RbaFromMoves(moves,{geometry:g,canonical:false}),s=prepareConnect4CpcScratch(g);
  assert.equal(exact(columns,rows,moves).value,3);
  assert.equal(evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,s),CPC_EXACT);
  assert.deepEqual([...s.interval],[3,3]);
});

test('CPC closes when every legal move lifts an opponent terminal singleton',()=>{
  const columns=4,rows=4,g=prepareConnect4RbaGeometry({columns,rows});
  // P0 to move after 000011121222. There is no currently playable P1
  // singleton, but every legal P0 move exposes one on P1's next turn.
  const moves=[0,0,0,0,1,1,1,2,1,2,2,2];
  const q=connect4RbaFromMoves(moves,{geometry:g,canonical:false}),s=prepareConnect4CpcScratch(g);
  assert.equal(exact(columns,rows,moves).value,1);
  assert.equal(evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,s),CPC_EXACT);
  assert.deepEqual([...s.interval],[1,1]);
});

test('CPC recognizes exact fork loss after enabling move',()=>{
  const g=prepareConnect4RbaGeometry({columns:5,rows:4});
  // 0-based: P0 1, P1 1, P0 2, P1 1, P0 3.
  // P1 to move; P0 has distinct playable bottom singleton targets at columns 0 and 4.
  const q=connect4RbaFromMoves([1,1,2,1,3],{geometry:g,canonical:false});
  const s=prepareConnect4CpcScratch(g);
  assert.equal(evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,s),CPC_EXACT);
  assert.deepEqual([...s.interval],[3,3]);
});

test('CPC first-win ordering lets current immediate terminal supersede opponent fork',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  const q=connect4RbaFromMoves([0,1,1,3,2,3,2,3,2],{geometry:g,canonical:false});
  const s=prepareConnect4CpcScratch(g);
  const kind=evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,s);
  assert.equal(kind,CPC_EXACT);
  // P1 is to move and has an immediate win; that terminal happens before P0's two threats matter.
  assert.deepEqual([...s.interval],[1,1]);
});

test('CPC alpha-beta uses live winning-line contribution for move ordering',()=>{
  const columns=4,rows=4,g=prepareConnect4RbaGeometry({columns,rows}),moves=[],
    root=connect4RbaFromMoves(moves,{geometry:g}),
    state=prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_ONLY,cacheCapacity:65536}),
    result=solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected});
  assert.equal(result.value,2);
  // Empty 4x4: edge landing cells contribute to 3 live winning lines versus
  // 2 for the two center cells. Static center-out would return column 1.
  assert.equal(result.move,0);
});

test('CPC-only and CPC+Four-Front alpha-beta agree with independent exact oracle',()=>{
  const columns=4,rows=4,g=prepareConnect4RbaGeometry({columns,rows});
  const fixtures=[
    [0,1,0,1],
    [1,2,1,2,0,3],
    [0,1,1,3,2],
    [2,1,2,0,3,1],
    [0,3,1,3,2,0,2],
  ];
  const memo=new Map();
  for(const moves of fixtures){
    const oracle=exact(columns,rows,moves,memo);
    const root=connect4RbaFromMoves(moves,{geometry:g});
    const a=prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_ONLY,cacheCapacity:65536});
    const x=prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_ONLY,cpcFrontierResponse:true,cacheCapacity:65536});
    const b=prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_FOUR_FRONT,boundaryDepth:2,boundaryCapacity:2048,boundaryBudget:2000000,cacheCapacity:65536});
    const ra=solveConnect4RbaAlphaBeta(root,{state:a,reflected:root.reflected});
    const rx=solveConnect4RbaAlphaBeta(root,{state:x,reflected:root.reflected});
    const rb=solveConnect4RbaAlphaBeta(root,{state:b,reflected:root.reflected});
    assert.equal(ra.value,oracle.value,JSON.stringify({moves,oracle,ra}));
    assert.equal(rx.value,oracle.value,JSON.stringify({moves,oracle,rx}));
    assert.equal(rb.value,oracle.value,JSON.stringify({moves,oracle,rb}));
    assertOptimalWitness(columns,rows,moves,ra,memo);
    assertOptimalWitness(columns,rows,moves,rx,memo);
    assertOptimalWitness(columns,rows,moves,rb,memo);
    assert.equal(ra.metrics.frontCalls,0);assert.equal(rx.metrics.frontCalls,0);
    assert.ok(rb.metrics.frontCalls>0);
  }
});


test('CPC alpha-beta modes agree with independent late standard-7x6 oracle',()=>{
  const columns=7,rows=6,g=prepareConnect4RbaGeometry({columns,rows});
  const fixtures=[
    [4,0,0,0,3,3,0,0,6,2,3,0,2,3,6,3,6,3,4,6,2,2,6,1,2,5,6,4],
    [2,0,5,3,6,3,5,2,3,3,3,5,0,5,0,0,1,6,1,4,3,4,2,6,6,0,6,4],
    [6,0,2,1,5,2,1,1,1,0,5,2,5,2,4,1,0,1,4,3,2,6,6,6,6,2,4,4,0,6,0,3,4,5,4],
    [1,3,2,0,4,6,1,0,2,4,5,2,2,3,1,1,1,5,1,3,2,4,6,0,4,4,6,2,0,4,3,3],
    [4,2,2,3,0,3,5,6,5,6,5,6,6,3,6,0,6,2,0,2,1,0,0,1,0,1,4,5,5,1,4,4,4,2,2],
  ];
  const memo=new Map();
  for(const moves of fixtures){
    const oracle=exact(columns,rows,moves,memo),root=connect4RbaFromMoves(moves,{geometry:g});
    for(const [mode,cpcFrontierResponse] of [
      [RBA_AB_CPC_ONLY,false],
      [RBA_AB_CPC_ONLY,true],
      [RBA_AB_CPC_FOUR_FRONT,false],
    ]){
      const state=prepareConnect4RbaAlphaBeta({geometry:g,mode,cpcFrontierResponse,boundaryDepth:2,boundaryCapacity:4096,boundaryBudget:4000000,cacheCapacity:65536});
      const result=solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected});
      assert.equal(result.value,oracle.value,JSON.stringify({moves,mode,cpcFrontierResponse,oracle,result}));
      assertOptimalWitness(columns,rows,moves,result,memo);
    }
  }
});


test('multi-action preemption count implies <=32-column mask support',()=>{
  const g=prepareConnect4RbaGeometry({columns:33,rows:4,specializationBudgetBytes:0}),
    q=connect4RbaFromMoves([16],{geometry:g,canonical:false}),
    s=prepareConnect4CpcScratch(g);
  evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,s);
  assert.equal(s.forkTargets32,null);
  assert.ok(s.preemptionCount[0]<=1);
});

test('CPC fork precursor restricts current defense without recursion',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  // d1, b1, f1: e1 is an attacker enabler; c1/g1 are the two future singleton endpoints.
  const q=connect4RbaFromMoves([3,1,5],{geometry:g,canonical:false}),s=prepareConnect4CpcScratch(g);
  assert.equal(evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,s),CPC_RESTRICT);
  assert.equal(s.precursorCount[0],1);assert.equal(s.preemptionCount[0],3);
  const expected=((1<<2)|(1<<4)|(1<<6))>>>0;
  assert.equal(s.preemptionMask32[0],expected);assert.equal(s.forcedColumn[0],-1);
});

test('CPC intersects alternative fork-precursor preemption sets',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  // d1, a1, e1: c1 and f1 are alternative attacker enablers. Exact current defenses intersect at c1/f1.
  const q=connect4RbaFromMoves([3,0,4],{geometry:g,canonical:false}),s=prepareConnect4CpcScratch(g);
  assert.equal(evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,s),CPC_RESTRICT);
  assert.equal(s.precursorCount[0],2);assert.equal(s.preemptionCount[0],2);
  const expected=((1<<2)|(1<<5))>>>0;
  assert.equal(s.preemptionMask32[0],expected);assert.equal(s.forcedColumn[0],-1);
});
