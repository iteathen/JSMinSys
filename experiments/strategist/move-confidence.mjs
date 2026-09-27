// COLD RESEARCH ONLY. Never import into evaluator recursion or behavior readers.
import assert from 'node:assert/strict';
import {prepareConnect4CpcScratch,evaluateConnect4CpcNonterminal32} from '../../addons/cpc-connect4.mjs';
import {prepareConnect4LiveLineEvaluator32,resetConnect4LiveLineState32,advanceConnect4LiveLineState32,evaluateConnect4LiveLineCell32} from '../../addons/connect4-live-line-evaluator.mjs';

export function orderFeatures(g,root){
  const moves=root.moveHistory,live=prepareConnect4LiveLineEvaluator32(g),
    words=new Uint32Array(live.stateWords),heights=new Uint32Array(g.columns);
  resetConnect4LiveLineState32(live,words);
  for(let p=0;p<moves.length;p++){const c=moves[p],cell=heights[c]++*g.columns+c;advanceConnect4LiveLineState32(live,words,0,p&1,cell,words,0);}
  const scratch=prepareConnect4CpcScratch(g),kind=evaluateConnect4CpcNonterminal32(g,root.words,0,root.basis,0,root.basis.length,scratch);
  const raw=[];
  for(const column of g.actionOrder)if(heights[column]<g.rows)raw.push({column,
    score:evaluateConnect4LiveLineCell32(live,words,0,moves.length&1,heights[column]*g.columns+column)});
  raw.sort((a,b)=>b.score-a.score); // Stable root tie order, independently checked against native root output.
  const forced=scratch.forcedColumn[0],mask=scratch.preemptionCount[0]>1?scratch.preemptionMask32[0]:-1;
  const ordered=raw.filter(a=>{const c=root.reflected?g.mirrorColumn[a.column]:a.column;
    return (forced<0||c===forced)&&(mask&(1<<c));});
  assert.ok(ordered.length,'nonterminal root needs an eligible action');
  const top=ordered[0].score,gap=ordered.length>1?top-ordered[1].score:null;
  return {ply:moves.length,raw,ordered,kind,cpcInterval:Array.from(scratch.interval),
    forced:forced>=0,choices:ordered.length,gap,
    topTies:ordered.filter(a=>a.score===top).length,nearTop:ordered.filter(a=>a.score>=top-1).length,
    group:gap===null?'single':gap===0?'tied':gap===1?'near':'clear'};
}
export function labelRanks(f,values){
  assert.ok(f.raw.every(a=>Number.isInteger(values[a.column])&&Math.abs(values[a.column])<=1));
  const best=Math.max(...f.raw.map(a=>values[a.column]));
  const first=f.ordered.findIndex(a=>values[a.column]===best);
  assert.ok(first>=0,'CPC removed all optimal moves');
  return {best,firstCorrect:values[f.ordered[0].column]===best,
    rawFirstCorrect:values[f.raw[0].column]===best,firstOptimalRank:first+1,
    optimalCount:f.ordered.filter(a=>values[a.column]===best).length,
    allEquivalent:f.ordered.every(a=>values[a.column]===best)};
}
export function makeCorpus(g,{plies,perPly,seed}){
  const records=[],seen=new Set();let attempts=0;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
  for(const ply of plies)for(let j=0;j<perPly;){
    assert.ok(++attempts<100000,'corpus rejection limit');
    const board=new Int8Array(g.cellCount).fill(-1),heights=new Uint8Array(g.columns),moves=[];
    let terminal=false;
    while(moves.length<ply&&!terminal){
      const legal=[];for(let c=0;c<g.columns;c++)if(heights[c]<g.rows)legal.push(c);
      if(!legal.length){terminal=true;break;}
      const c=legal[(rand()>>>8)%legal.length],player=moves.length&1;
      board[heights[c]++*g.columns+c]=player;moves.push(c);
      for(let l=0;l<g.lineCount&&!terminal;l++){
        terminal=true;for(let k=0;k<4;k++)if(board[g.lineRow[l*4+k]*g.columns+g.lineColumn[l*4+k]]!==player){terminal=false;break;}
      }
    }
    if(terminal)continue;
    const identity=Array.from(board).join(','),mirror=Array.from(board,(_,i)=>board[Math.floor(i/g.columns)*g.columns+g.columns-1-i%g.columns]).join(',');
    const key=identity<mirror?identity:mirror;if(seen.has(key))continue;seen.add(key);
    records.push({id:`p${ply}-${j}`,split:j%2?'holdout':'discovery',moves});j++;
  }
  return records;
}
