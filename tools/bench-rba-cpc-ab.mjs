import {performance} from 'node:perf_hooks';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-solver.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta,RBA_AB_CPC_ONLY,RBA_AB_CPC_FOUR_FRONT} from '../addons/rba-connect4-alphabeta.mjs';

const g=prepareConnect4RbaGeometry({columns:4,rows:4});
const fixtures=[[0,1,0,1],[1,2,1,2,0,3],[0,1,1,3,2],[2,1,2,0,3,1],[0,3,1,3,2,0,2]];
const modes=[['cpc-alpha-beta',RBA_AB_CPC_ONLY],['cpc-four-front-alpha-beta',RBA_AB_CPC_FOUR_FRONT]];
const rows=[];
for(const moves of fixtures){
  const root=connect4RbaFromMoves(moves,{geometry:g});
  for(const [name,mode] of modes){
    const state=prepareConnect4RbaAlphaBeta({geometry:g,mode,boundaryDepth:2,boundaryCapacity:2048,boundaryBudget:2000000,cacheCapacity:65536});
    const start=performance.now(),result=solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected}),elapsedMs=performance.now()-start;
    rows.push({moves:moves.join(''),mode:name,value:result.value,move:result.move,elapsedMs,...result.metrics});
  }
}
console.log(JSON.stringify({kind:'rba-cpc-alpha-beta-ab-v1',rows},null,2));
