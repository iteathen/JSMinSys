import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {Worker} from 'node:worker_threads';
import {pathToFileURL} from 'node:url';
import {prepareConnect4RbaGeometry,shareConnect4RbaGeometry32,prepareConnect4RbaCoordinateScratch} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-profile.mjs';
import {connect4RbaCofactorKnownHeight,connect4RbaCanonicalize} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-coordinate.mjs';
import {connect4RbaFromMoves} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-ingress.mjs';
import {createConnect4RbaSharedExactCache32} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-shared-exact-cache.mjs';
const repo='C:/r/jsminsys-cpc-rebuild-20261004';
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
let source=readFileSync(repo+'/addons/rba-connect4-lazy-smp-worker-minimal.mjs','utf8');
source=source.replace(/from '([.][^']+)'/g,(_,p)=>`from '${new URL(p,pathToFileURL(repo+'/addons/rba-connect4-lazy-smp-worker-minimal.mjs')).href}'`);
source=source.replace("import {workerData}","import {workerData,parentPort}");
source=source.replace('let bestMove=-1;',`const diag={nodes:0,cofactors:0,wins:0,draws:0,betaCuts:0,maxWinCuts:0,cacheReturns:0,boundReturns:0,rootColumns:[]};\nlet bestMove=-1;`);
source=source.replace('function negamax(depth,src,bi,n,mover,alpha,beta){','function negamax(depth,src,bi,n,mover,alpha,beta){\n  diag.nodes++;');
source=source.replace('    const term=connect4RbaCofactorKnownHeight(', '    diag.cofactors++; if(depth===0)diag.rootColumns.push(column);\n    const term=connect4RbaCofactorKnownHeight(');
source=source.replace('if(term)value=relativeTerminal(term,mover);','if(term){if(term===2)diag.draws++;else diag.wins++;value=relativeTerminal(term,mover);}');
source=source.replace('if(cached<=3)return relativeTerminal(cached,mover);','if(cached<=3){diag.cacheReturns++;return relativeTerminal(cached,mover);}');
source=source.replace('if(beta<=0){return 0;}','if(beta<=0){diag.boundReturns++;return 0;}').replace('if(alpha>=0){return 0;}','if(alpha>=0){diag.boundReturns++;return 0;}');
source=source.replace('if(best===1||alpha>=beta){break;}','if(best===1||alpha>=beta){if(best===1)diag.maxWinCuts++;if(alpha>=beta)diag.betaCuts++;break;}');
source+='\nparentPort.postMessage({worker:index,relative,diag});\n';
writeFileSync(new URL('./instrumented-worker.mjs',import.meta.url),source);
let seed=123456789;function rand(n){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)%n;}
function physical(W,H){const board=Array(W*H).fill(-1),heights=Array(W).fill(0);let rank=0;return {board,heights,get rank(){return rank;},push(c){const r=heights[c]++;board[r*W+c]=(rank++)&1;},pop(c){board[(--heights[c])*W+c]=-1;rank--;},terminal(){for(let r=0;r<H;r++)for(let c=0;c<W;c++){const p=board[r*W+c];if(p<0)continue;for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){let ok=true;for(let t=1;t<4;t++){const x=c+dx*t,y=r+dy*t;if(x<0||x>=W||y<0||y>=H||board[y*W+x]!==p){ok=false;break;}}if(ok)return p===0?3:1;}}return rank===W*H?2:0;}};}
const reports=[];
for(const [W,H] of [[7,6],[7,5],[4,4]]){
 const g=prepareConnect4RbaGeometry({columns:W,rows:H}),profile=prepareConnect4RbaExecutionProfile(g),scratch=prepareConnect4RbaCoordinateScratch(g);let checks=0,wins=[0,0],draws=0,reflections=0;
 for(let game=0;game<300;game++){
  const b=physical(W,H);let q=connect4RbaFromMoves([],{geometry:g,positionCode:false}),orientation=q.reflected;
  while(!b.terminal()){
   const legal=[];for(let c=0;c<W;c++)if(b.heights[c]<H)legal.push(c);
   const chosen=legal[rand(legal.length)];let selected;
   for(const physicalCol of legal){const c=orientation?W-1-physicalCol:physicalCol,words=new Uint32Array(g.keyWords),basis=new Uint32Array(g.maxBasis);
    const term=connect4RbaCofactorKnownHeight(g,profile,q.words,0,q.basis,0,q.basis.length,c,q.words[c],words,0,basis,0,scratch.seen,scratch.size,0,scratch.map,scratch.inverse);
    b.push(physicalCol);const expected=b.terminal();b.pop(physicalCol);checks++;
    if(term!==expected)throw Error(JSON.stringify({W,H,game,rank:b.rank,physicalCol,term,expected}));
    if(term===3)wins[0]++;if(term===1)wins[1]++;if(term===2)draws++;
    if(physicalCol===chosen){const n=scratch.size[0],childBasis=basis.slice(0,n);const reflected=term?0:connect4RbaCanonicalize(g,profile,words,0,childBasis,0,n,scratch);reflections+=reflected;selected={words,basis:childBasis,reflected};}
   }
   b.push(chosen);q=selected;orientation^=selected.reflected;
  }
 }
 reports.push({geometry:[W,H],games:300,checks,wins,draws,reflections,mismatches:0});
}
async function workerProbe(moves,limitMs=1500){
 const g=prepareConnect4RbaGeometry({columns:7,rows:6}),geometry=shareConnect4RbaGeometry32(g),root=connect4RbaFromMoves(moves,{geometry:g,positionCode:false});
 const b=physical(7,6);moves.forEach(c=>b.push(c));const immediate=[];for(let c=0;c<7;c++)if(b.heights[c]<6){b.push(c);const term=b.terminal();b.pop(c);if(term===(b.rank%2?1:3))immediate.push(c);}
 const control=new Int32Array(new SharedArrayBuffer(20)),resultWords=new Int32Array(new SharedArrayBuffer(64));control[4]=-1;
 const sharedExactCache=createConnect4RbaSharedExactCache32({capacity:16384,keyWords:g.keyWords,geometry:g});
 const workers=[];const timeout=setTimeout(()=>Atomics.store(control,0,1),limitMs);
 const rows=await Promise.all(Array.from({length:4},(_,workerIndex)=>new Promise((resolve,reject)=>{let message;
  const worker=new Worker(new URL('./instrumented-worker.mjs',import.meta.url),{workerData:{workerIndex,geometry,root,rootReflected:root.reflected,control,resultWords,sharedExactCache,localCacheCapacity:16384,sharedSampleMask:0}});workers.push(worker);
  worker.on('message',m=>message=m);worker.on('error',reject);worker.on('exit',code=>code?reject(Error('exit '+code)):resolve({...message,result:Array.from(resultWords.slice(workerIndex*4,workerIndex*4+4))}));
 })));
 clearTimeout(timeout);return {sequence:moves.map(c=>c+1).join(''),rootReflected:root.reflected,immediateWinningColumns:immediate.map(c=>c+1),diagnosticLimitMs:limitMs,rows};
}
const probes=[];for(const moves of [[3,0,3,0,3,1],[0,3,0,3,0,1],[3,0,3,0,1,0,2]])probes.push(await workerProbe(moves));
const result={sha,purpose:'Independent physical-board terminal checks and instrumented four-worker control-flow probes; small caches, no timing promotion',terminalChecks:reports,probes};
writeFileSync(new URL('./result.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
