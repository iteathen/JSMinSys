import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-solver.mjs';
import {
  prepareConnect4CpcScratch,evaluateConnect4Cpc32,connect4CpcTargetOwner32,
  CPC_EXACT,
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
    const b=prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_FOUR_FRONT,boundaryDepth:2,boundaryCapacity:2048,boundaryBudget:2000000,cacheCapacity:65536});
    const ra=solveConnect4RbaAlphaBeta(root,{state:a,reflected:root.reflected});
    const rb=solveConnect4RbaAlphaBeta(root,{state:b,reflected:root.reflected});
    assert.equal(ra.value,oracle.value,JSON.stringify({moves,oracle,ra}));
    assert.equal(rb.value,oracle.value,JSON.stringify({moves,oracle,rb}));
    assert.equal(ra.move,oracle.move,JSON.stringify({moves,oracle,ra}));
    assert.equal(rb.move,oracle.move,JSON.stringify({moves,oracle,rb}));
    assert.equal(ra.metrics.frontCalls,0);
    assert.ok(rb.metrics.frontCalls>0);
  }
});


test('CPC alpha-beta modes agree with independent late standard-7x6 oracle',()=>{
  const columns=7,rows=6,g=prepareConnect4RbaGeometry({columns,rows});
  const fixtures=[
    [6,0,2,1,5,2,1,1,1,0,5,2,5,2,4,1,0,1,4,3,2,6,6,6,6,2,4,4,0,6,0,3,4,5,4],
    [4,2,2,3,0,3,5,6,5,6,5,6,6,3,6,0,6,2,0,2,1,0,0,1,0,1,4,5,5,1,4,4,4,2,2],
  ];
  const memo=new Map();
  for(const moves of fixtures){
    const oracle=exact(columns,rows,moves,memo),root=connect4RbaFromMoves(moves,{geometry:g});
    for(const mode of [RBA_AB_CPC_ONLY,RBA_AB_CPC_FOUR_FRONT]){
      const state=prepareConnect4RbaAlphaBeta({geometry:g,mode,boundaryDepth:2,boundaryCapacity:4096,boundaryBudget:4000000,cacheCapacity:65536});
      const result=solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected});
      assert.equal(result.value,oracle.value,JSON.stringify({moves,mode,oracle,result}));
      assert.equal(result.move,oracle.move,JSON.stringify({moves,mode,oracle,result}));
    }
  }
});
