#!/usr/bin/env node
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {runIsoMaxConnect4Move32} from '../addons/rba-connect4-move-selector.mjs';

const WORKERS=Number(process.env.C4_WORKERS||4);
const SEARCH_TIMEOUT_MS=Number(process.env.C4_SEARCH_TIMEOUT_MS||120000);
const g=prepareConnect4RbaGeometry({columns:7,rows:6});
const board=new Int8Array(g.cellCount);board.fill(-1);
const heights=new Uint32Array(g.columns);
const moves=[];

function firstWinAfter(column,player){
  const row=heights[column]-1;
  for(let line=0;line<g.lineCount;line+=1){
    const base=line*4;
    let contains=false,owned=true;
    for(let i=0;i<4;i+=1){
      const c=g.lineColumn[base+i],r=g.lineRow[base+i];
      if(c===column&&r===row)contains=true;
      if(board[r*g.columns+c]!==player)owned=false;
    }
    if(contains&&owned)return true;
  }
  return false;
}

function apply(column,player){
  assert(Number.isInteger(column)&&column>=0&&column<g.columns,'invalid returned move');
  const row=heights[column];
  assert(row<g.rows,'returned move is in a full column');
  board[row*g.columns+column]=player;
  heights[column]=row+1;
  moves.push(column);
  return firstWinAfter(column,player);
}

const started=performance.now(),trace=[];
let terminal={kind:'BOARD_FULL',winner:null};

for(let ply=1;ply<=g.cellCount;ply+=1){
  const before=moves.slice(),t0=performance.now();
  const result=await runIsoMaxConnect4Move32(before,{
    geometry:g,
    workers:WORKERS,
    sharedCacheCapacity:1<<20,
    localCacheCapacity:1<<20,
    timeoutMs:SEARCH_TIMEOUT_MS,
    rootFrontier:true,
  });
  const elapsedMs=performance.now()-t0;
  assert.ok(result.status==='RANK_LOCAL_MOVE'||result.status==='EXACT',JSON.stringify(result));
  assert.ok(result.move>=0&&result.move<g.columns,JSON.stringify(result));
  const player=(ply-1)&1,won=apply(result.move,player);
  trace.push({
    ply,
    player:player+1,
    sequenceBefore:before.map(c=>c+1).join(''),
    move:result.move+1,
    source:result.source,
    status:result.status,
    rootWdl:result.rootWdl,
    elapsedMs,
    localReason:result.preSearch?.reason??null,
    searchNodes:result.winnerMetrics?.nodes??null,
    workersUsed:result.workersUsed,
  });
  if(won){
    terminal={kind:'WIN',winner:player+1};
    break;
  }
  if(moves.length===g.cellCount)break;
}

const totalMs=performance.now()-started;
const local=trace.filter(x=>x.source==='RANK_LOCAL');
const searched=trace.filter(x=>x.source==='SEARCH');
const output={
  schema:'jsminsys.connect4.rank_local_presearch.full_game_benchmark.v1',
  jsMinSysHead:process.env.GITHUB_SHA??null,
  workers:WORKERS,
  searchTimeoutMs:SEARCH_TIMEOUT_MS,
  totalMs,
  under60Seconds:totalMs<60000,
  plies:trace.length,
  terminal,
  sequence:moves.map(c=>c+1).join(''),
  localMoves:local.length,
  searchedMoves:searched.length,
  firstSearchPly:searched.length?searched[0].ply:null,
  aggregateSearchNodes:searched.reduce((sum,row)=>sum+(row.searchNodes??0),0),
  trace,
};
console.log(JSON.stringify(output,null,2));
if(!output.under60Seconds)process.exitCode=2;
