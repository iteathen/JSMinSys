import {performance} from 'node:perf_hooks';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-solver.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta,RBA_AB_CPC_ONLY,RBA_AB_CPC_FOUR_FRONT} from '../addons/rba-connect4-alphabeta.mjs';

const cases=[
  {columns:4,rows:4,fixtures:[[0,1,0,1],[1,2,1,2,0,3],[0,1,1,3,2],[2,1,2,0,3,1],[0,3,1,3,2,0,2]]},
  {columns:7,rows:6,fixtures:[
    [6,0,2,1,5,2,1,1,1,0,5,2,5,2,4,1,0,1,4,3,2,6,6,6,6,2,4,4,0,6,0,3,4,5,4],
    [4,2,2,3,0,3,5,6,5,6,5,6,6,3,6,0,6,2,0,2,1,0,0,1,0,1,4,5,5,1,4,4,4,2,2],
    [1,3,2,0,4,6,1,0,2,4,5,2,2,3,1,1,1,5,1,3,2,4,6,0,4,4,6,2,0,4,3,3,6,3,5],
  ]},
];
const modes=[['cpc-alpha-beta',RBA_AB_CPC_ONLY],['cpc-four-front-alpha-beta',RBA_AB_CPC_FOUR_FRONT]];
const rows=[];
for(const group of cases){
  const g=prepareConnect4RbaGeometry({columns:group.columns,rows:group.rows});
  for(const moves of group.fixtures){
    const root=connect4RbaFromMoves(moves,{geometry:g});
    for(const [name,mode] of modes){
      const state=prepareConnect4RbaAlphaBeta({geometry:g,mode,boundaryDepth:2,boundaryCapacity:4096,boundaryBudget:4000000,cacheCapacity:65536});
      const start=performance.now(),result=solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected}),elapsedMs=performance.now()-start;
      rows.push({geometry:`${group.columns}x${group.rows}`,moves:moves.join(''),mode:name,value:result.value,move:result.move,elapsedMs,...result.metrics});
    }
  }
}
console.log(JSON.stringify({kind:'rba-cpc-alpha-beta-ab-v2',rows},null,2));
