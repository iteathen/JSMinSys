import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,runLazySmpConnect4Rba32} from '../../../isomax/index.mjs';
import {connect4RbaFromMoves} from '../../../isomax/runtime/addons/rba-connect4-ingress.mjs';
import * as standardCpc from '../../../isomax/runtime/experiments/isomax-lean/cpc.mjs';
import * as generalCpc from '../../../isomax/runtime/experiments/isomax-lean/cpc-general.mjs';
import * as wideCpc from '../../../isomax/runtime/experiments/isomax-lean/cpc-wide.mjs';

// Independent physical-board oracle: no RBA, CPC, RLC, or solver dependency.
function physical(columns,rows,moves){
  const board=new Int8Array(columns*rows).fill(-1),heights=new Uint32Array(columns);
  const win=(c,r,p)=>{
    for(const [dc,dr] of [[1,0],[0,1],[1,1],[1,-1]]){
      let n=1;
      for(const sign of [-1,1]) for(let i=1;i<4;i++) {
        const x=c+dc*i*sign,y=r+dr*i*sign;
        if(x<0||x>=columns||y<0||y>=rows||board[y*columns+x]!==p)break;
        n++;
      }
      if(n>=4)return true;
    }
    return false;
  };
  for(let ply=0;ply<moves.length;ply++){
    const c=moves[ply],r=heights[c]++;
    assert.ok(r<rows);board[r*columns+c]=ply&1;
    assert.ok(!win(c,r,ply&1),'fixture must remain nonterminal');
  }
  const memo=new Map();
  function visit(ply){
    if(ply===board.length)return 0;
    const key=board.join(',');if(memo.has(key))return memo.get(key);
    let best=-2;
    for(let c=0;c<columns;c++)if(heights[c]<rows){
      const r=heights[c]++;board[r*columns+c]=ply&1;
      const value=win(c,r,ply&1)?1:-visit(ply+1);
      board[r*columns+c]=-1;heights[c]--;
      best=Math.max(best,value);if(best===1)break;
    }
    memo.set(key,best);return best;
  }
  const relative=visit(moves.length),values=new Map();
  for(let c=0;c<columns;c++)if(heights[c]<rows){
    const r=heights[c]++;board[r*columns+c]=moves.length&1;
    values.set(c,win(c,r,moves.length&1)?1:-visit(moves.length+1));
    board[r*columns+c]=-1;heights[c]--;
  }
  return {wdl:(moves.length&1)?-relative:relative,relative,values};
}

let seed=0x5eae213;
const random=()=>seed=(Math.imul(seed,1664525)+1013904223)>>>0;
// Avoid invoking the oracle while generating large unfinished positions.
function legalNonterminal(columns,rows,moves){
  const board=new Int8Array(columns*rows).fill(-1),h=new Uint32Array(columns);
  for(let ply=0;ply<moves.length;ply++){
    const c=moves[ply],r=h[c]++;board[r*columns+c]=ply&1;
    for(const [dc,dr] of [[1,0],[0,1],[1,1],[1,-1]]){
      let n=1;
      for(const sign of [-1,1])for(let i=1;i<4;i++){
        const x=c+dc*i*sign,y=r+dr*i*sign;
        if(x<0||x>=columns||y<0||y>=rows||board[y*columns+x]!== (ply&1))break;
        n++;
      }
      if(n>=4)return false;
    }
  }
  return true;
}
function lateFixture(){
  for(let attempt=0;attempt<1000;attempt++){
    const moves=[];
    for(let ply=0;ply<36;ply++){
      const candidates=[];
      for(let c=0;c<7;c++)if(moves.filter(x=>x===c).length<6&&legalNonterminal(7,6,[...moves,c]))candidates.push(c);
      if(!candidates.length)break;
      moves.push(candidates[random()%candidates.length]);
    }
    if(moves.length===36)return moves;
  }
  throw Error('no bounded standard fixture generated');
}
const fixtures=[
  [7,6,lateFixture()],
  [4,4,[1,2,0,2,3,2,3,1,0,3]],
  [33,1,[8,3,22,19,15,24,1,10,20,28,27,7,32,25,18,23,17,16,21,2,12,6,11,9,31,5,29]],
];
let checks=0;
for(const [columns,rows,history] of fixtures)for(const mirror of [false,true]){
  const moves=history.map(c=>mirror?columns-1-c:c);
  for(const budget of [0,2097152]){
    const geometry=prepareConnect4RbaGeometry({columns,rows,specializationBudgetBytes:budget}),root=connect4RbaFromMoves(moves,{geometry});
    const cpc=columns>32?wideCpc:columns===7&&rows===6?standardCpc:generalCpc,scratch=cpc.prepareConnect4CpcScratch(geometry);
    cpc.evaluateConnect4CpcNonterminal32(geometry,root.words,0,root.basis,0,root.basis.length,scratch);

    const result=await runLazySmpConnect4Rba32(moves,{geometry,workers:2,sharedCacheCapacity:1,localCacheCapacity:1,timeoutMs:10000});
    const expected=physical(columns,rows,moves);
    assert.ok(expected.wdl>=scratch.interval[0]-2&&expected.wdl<=scratch.interval[1]-2,'CPC interval excludes physical value');
    assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,expected.wdl);
    assert.equal(result.cleanup,true);
    assert.equal(expected.values.get(result.move),expected.relative,'root move is suboptimal');
    checks++;
    console.log(JSON.stringify({columns,rows,mirror,budget,status:'PASS',solver:result.executionProfile.solver,remaining:columns*rows-moves.length}));
  }
}
console.log(JSON.stringify({checks,mismatches:0,scope:'twelve bounded six-cell physical-oracle comparisons, no full root solves or formula holdouts'}));
