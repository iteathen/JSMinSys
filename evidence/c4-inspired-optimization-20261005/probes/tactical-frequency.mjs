// Frozen outcome-blind structural proxy, not production search frequencies.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from '../../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../../addons/rba-connect4-ingress.mjs';
import {connect4RbaImmediateWinningColumn} from '../../../addons/rba-connect4-coordinate.mjs';
import {prepareConnect4CpcxPairHub32} from '../../../addons/connect4-cpcx-pair-hub.mjs';
import {prepareConnect4CpcWin32} from '../../../addons/connect4-cpc-prepared-win.mjs';
import {evaluateConnect4PreparedCpcResponse32} from '../../../addons/connect4-cpc-prepared-response.mjs';
import {prepareConnect4CpcTargetWin32} from '../../../addons/connect4-cpc-target-win.mjs';
const W=7,H=6,g=prepareConnect4RbaGeometry({columns:W,rows:H}),pair=prepareConnect4CpcxPairHub32(g),
 response=prepareConnect4CpcWin32(g),target=prepareConnect4CpcTargetWin32(g),
 ranks=Array.from({length:42},(_,rank)=>({rank,sampled:0,ownImmediate:0,dualOpponent:0,eligible:0,forced:0,pairWin:0,responseWin:0,responseNonloss:0,targetWin:0,targetWithinNonloss:0}));
let seed=20261005;
const next=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
function win(board,c,r,p){
 for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){
  let n=1;for(const sign of [-1,1])for(let k=1;k<4;k++){
   const x=c+sign*dx*k,y=r+sign*dy*k;
   if(x<0||x>=W||y<0||y>=H||board[y*W+x]!==p)break;n++;
  }
  if(n>=4)return true;
 }
 return false;
}
for(let walk=0;walk<512;walk++){
 const board=new Int8Array(42).fill(-1),height=new Uint32Array(7),moves=[];
 while(moves.length<42){
  const rank=moves.length,mover=rank&1,row=ranks[rank],q=connect4RbaFromMoves(moves,{geometry:g});row.sampled++;
  if(connect4RbaImmediateWinningColumn(g,q.words,0,q.basis,0,q.basis.length,mover)>=0)row.ownImmediate++;
  else{
   const forced=pair.collect(q.words,0,q.basis,0,q.basis.length,mover,0);
   if(forced===-2)row.dualOpponent++;
   else{
    row.eligible++;if(forced>=0)row.forced++;
    const fork=pair.find(q.words,0,q.basis,0,q.basis.length,mover,forced,0),
     result=evaluateConnect4PreparedCpcResponse32(response,q.words,0,q.basis,0,q.basis.length,mover^1),
     targeted=target.evaluate(target,q.words,0,q.basis,0,q.basis.length,mover^1);
    if(fork>=0)row.pairWin++;
    if(result===1)row.responseWin++;
    if(result===2)row.responseNonloss++;
    if(targeted)row.targetWin++;
    if(result===2&&targeted)row.targetWithinNonloss++;
    assert.ok(!(fork>=0&&(result!==0||targeted)),'current WIN incompatible with previous NONLOSS/WIN');
   }
  }
  const legal=[];
  for(let c=0;c<7;c++)if(height[c]<6){
   const r=height[c];board[r*7+c]=mover;if(!win(board,c,r,mover))legal.push(c);board[r*7+c]=-1;
  }
  if(!legal.length)break;
  const c=legal[next()%legal.length];board[height[c]++*7+c]=mover;moves.push(c);
 }
}
const totals={};for(const row of ranks)for(const [key,value] of Object.entries(row))if(key!=='rank')totals[key]=(totals[key]??0)+value;
const out={kind:'C57-frozen-structural-applicability-proxy',runtime:process.version,seed:20261005,finalSeed:seed,walks:512,totals,ranks,
 caveat:'Not production search traffic or W/D/L sampling. No alpha/beta-window frequencies available. No timed-worker counters added; no ordering promoted from this proxy alone.'};
writeFileSync(new URL('../raw/c57-tactical-frequency.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(totals));
