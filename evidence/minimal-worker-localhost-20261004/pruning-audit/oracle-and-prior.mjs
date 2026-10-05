import {writeFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-geometry.mjs';
import {runLazySmpConnect4Rba32} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-lazy-smp-host.mjs';
import * as old from 'file:///C:/r/c4-external-build-final-20261004/runtime/isomax/isomax/index.mjs';
let seed=84721;function rand(n){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)%n;}
function board(W,H){const cells=Array(W*H).fill(-1),heights=Array(W).fill(0);let rank=0;return {cells,heights,get rank(){return rank;},push(c){cells[heights[c]++*W+c]=(rank++)&1;},pop(c){cells[--heights[c]*W+c]=-1;rank--;},terminal(){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=cells[y*W+x];if(p<0)continue;for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){let ok=true;for(let i=1;i<4;i++){const a=x+i*dx,b=y+i*dy;if(a<0||a>=W||b<0||b>=H||cells[b*W+a]!==p){ok=false;break;}}if(ok)return p===0?3:1;}}return rank===W*H?2:0;}};}
const late=[];
for(const [W,H] of [[7,6],[7,5]]){const geometry=prepareConnect4RbaGeometry({columns:W,rows:H});
 for(let trial=0;trial<8;trial++){
  let b,moves;
  for(let attempt=0;attempt<1000;attempt++){b=board(W,H);moves=[];while(b.rank<W*H-7-(trial&1)){const allowed=[];for(let c=0;c<W;c++)if(b.heights[c]<H){b.push(c);const t=b.terminal();b.pop(c);if(!t)allowed.push(c);}if(!allowed.length)break;const c=allowed[rand(allowed.length)];b.push(c);moves.push(c);}if(moves.length===W*H-7-(trial&1))break;}
  if(moves.length!==W*H-7-(trial&1))throw Error('No fixture');
  // Cold solver receives only the live move sequence, never the oracle result.
  const actual=await runLazySmpConnect4Rba32(moves,{geometry,workers:4,workerMode:'minimal',sharedCacheCapacity:16384,localCacheCapacity:16384,timeoutMs:3000});
  let visits=0;const memo=new Map();function solve(){visits++;const terminal=b.terminal();if(terminal)return terminal===2?0:terminal===((b.rank&1)?1:3)?1:-1;const key=b.cells.join(',');if(memo.has(key))return memo.get(key);let best=-2;for(let c=0;c<W;c++)if(b.heights[c]<H){b.push(c);const v=-solve();b.pop(c);if(v>best)best=v;if(best===1)break;}memo.set(key,best);return best;}
  const expected=solve(),bestMoves=[];for(let c=0;c<W;c++)if(b.heights[c]<H){b.push(c);const value=-solve();b.pop(c);if(value===expected)bestMoves.push(c);}
  const expectedAbsolute=expected*((b.rank&1)?-1:1),passed=actual.status==='EXACT'&&actual.rootWdl===expectedAbsolute&&bestMoves.includes(actual.move)&&actual.cleanup&&actual.workersExited===4;
  late.push({geometry:[W,H],sequence:moves.map(c=>c+1).join(''),expectedAbsolute,expectedBestMoves:bestMoves,actual,oracleVisits:visits,passed});if(!passed)throw Error(JSON.stringify(late.at(-1)));
 }
}
const prior=[];const geometry=old.prepareConnect4RbaGeometry({columns:7,rows:6});
for(const seq of ['414142','141412','4141213']){const result=await old.runLazySmpConnect4Rba32([...seq].map(c=>Number(c)-1),{geometry,workers:4,sharedCacheCapacity:16384,localCacheCapacity:16384,timeoutMs:1500});prior.push({sequence:seq,result});}
writeFileSync(new URL('./oracle-and-prior.json',import.meta.url),JSON.stringify({purpose:'Small-cache correctness/pathology controls only, not production timing',late,prior},null,2));
console.log(JSON.stringify({lateCases:late.length,latePass:late.filter(x=>x.passed).length,oracleVisits:late.reduce((n,x)=>n+x.oracleVisits,0),prior:prior.map(x=>({sequence:x.sequence,status:x.result.status,rootWdl:x.result.rootWdl,move:x.result.move,cleanup:x.result.cleanup,workersExited:x.result.workersExited}))},null,2));
