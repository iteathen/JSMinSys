import {performance} from 'node:perf_hooks';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareConnect4CpcScratch,evaluateConnect4Cpc32} from '../addons/cpc-connect4.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta,RBA_AB_CPC_ONLY,RBA_AB_CPC_FOUR_FRONT} from '../addons/rba-connect4-alphabeta.mjs';

const cases=[
  {columns:4,rows:4,fixtures:[[0,1,0,1],[1,2,1,2,0,3],[0,1,1,3,2],[2,1,2,0,3,1],[0,3,1,3,2,0,2]]},
  {columns:7,rows:6,fixtures:[
    [4,0,0,0,3,3,0,0,6,2,3,0,2,3,6,3,6,3,4,6,2,2,6,1,2,5,6,4],
    [2,0,5,3,6,3,5,2,3,3,3,5,0,5,0,0,1,6,1,4,3,4,2,6,6,0,6,4],
    [6,0,2,1,5,2,1,1,1,0,5,2,5,2,4,1,0,1,4,3,2,6,6,6,6,2,4,4,0,6,0,3,4,5,4],
    [1,3,2,0,4,6,1,0,2,4,5,2,2,3,1,1,1,5,1,3,2,4,6,0,4,4,6,2,0,4,3,3],
    [4,2,2,3,0,3,5,6,5,6,5,6,6,3,6,0,6,2,0,2,1,0,0,1,0,1,4,5,5,1,4,4,4,2,2],
    [1,3,2,0,4,6,1,0,2,4,5,2,2,3,1,1,1,5,1,3,2,4,6,0,4,4,6,2,0,4,3,3,6,3,5],
  ]},
];
const frontierResponseScan=[];
{
  const group=cases.find(x=>x.columns===7&&x.rows===6),g=prepareConnect4RbaGeometry({columns:7,rows:6});
  const on=prepareConnect4CpcScratch(g,{frontierResponse:true}),off=prepareConnect4CpcScratch(g,{frontierResponse:false});
  for(const moves of group.fixtures)for(let rank=16;rank<=moves.length;rank+=1){
    const prefix=moves.slice(0,rank),q=connect4RbaFromMoves(prefix,{geometry:g,canonical:false});
    const onKind=evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,on),onLo=on.interval[0],onHi=on.interval[1];
    const offKind=evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,off),offLo=off.interval[0],offHi=off.interval[1];
    if(onLo!==offLo||onHi!==offHi||onKind!==offKind)
      frontierResponseScan.push({rank,moves:prefix.join(''),onKind,on:[onLo,onHi],offKind,off:[offLo,offHi]});
  }
}
const modes=[
  ['cpc-alpha-beta',RBA_AB_CPC_ONLY,false],
  ['cpc-frontier-response-alpha-beta',RBA_AB_CPC_ONLY,true],
  ['cpc-four-front-alpha-beta',RBA_AB_CPC_FOUR_FRONT,false],
];
const WARMUP=3,REPEATS=9;
const rows=[];
for(const group of cases){
  const g=prepareConnect4RbaGeometry({columns:group.columns,rows:group.rows});
  for(const moves of group.fixtures){
    const root=connect4RbaFromMoves(moves,{geometry:g});
    for(const [name,mode,cpcFrontierResponse] of modes){
      const state=prepareConnect4RbaAlphaBeta({geometry:g,mode,boundaryDepth:2,boundaryCapacity:4096,boundaryBudget:4000000,cacheCapacity:65536,cpcFrontierResponse});
      const start=performance.now(),result=solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected}),elapsedMs=performance.now()-start;
      for(let i=0;i<WARMUP;i+=1)solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected});
      const samples=new Float64Array(REPEATS);
      for(let i=0;i<REPEATS;i+=1){
        const t=performance.now();solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected});samples[i]=performance.now()-t;
      }
      samples.sort();const warmMedianMs=samples[REPEATS>>>1],warmMinMs=samples[0];
      rows.push({geometry:`${group.columns}x${group.rows}`,moves:moves.join(''),mode:name,value:result.value,move:result.move,elapsedMs,warmMedianMs,warmMinMs,...result.metrics});
    }
  }
}
console.log(JSON.stringify({kind:'rba-cpc-alpha-beta-ab-v3',warmup:WARMUP,repeats:REPEATS,frontierResponseScan,rows},null,2));
