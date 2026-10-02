// Read-only evidence verification: independent physical board/line construction.
// No game solver or rank-local implementation is imported or invoked.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base=path.resolve(process.argv[2]),dir=path.join(base,'attempt-02-explicit-reclamation');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const game=read(path.join(dir,'game.json')),controls=read(path.join(base,'controls.json'));
const lines=[];for(let y=0;y<6;y++)for(let x=0;x<7;x++)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){
  const line=Array.from({length:4},(_,i)=>[x+i*dx,y+i*dy]);if(line.every(([c,r])=>c>=0&&c<7&&r>=0&&r<6))lines.push(line.map(([c,r])=>r*7+c));
}assert.equal(lines.length,69);
const board=Array(42).fill(-1),heights=Array(7).fill(0);let seq='',totalNodes=0,lastWall=0,terminal=null,affinityChecks=0;
function measure(p){const candidates=[];for(let c=0;c<7;c++)if(heights[c]<6){const cell=7*heights[c]+c,incident=lines.filter(l=>l.includes(cell));candidates.push({column:c+1,A:incident.filter(l=>l.every(i=>board[i]!==1-p)).length,B:incident.filter(l=>l.every(i=>board[i]!==p)).length,H:5-heights[c]});}const maxima=candidates.filter(a=>!candidates.some(b=>b.A>=a.A&&b.B>=a.B&&(b.A>a.A||b.B>a.B)));return {candidates,maxima};}
assert.equal(controls.status,'PASS');assert.equal(controls.controls.length,7);
for(const c of controls.controls){assert.equal(c.passed,true);if(c.sequence==='44444'){assert.equal(c.preSearch.reason,'UNIQUE_MAX_EXHAUSTS_COLUMN');assert.equal(c.searchStarted,true);assert.ok(c.nodeCounts.reduce((a,b)=>a+b,0)>0);}else{assert.equal(c.move,3);assert.equal(c.searchStarted,false);}}
for(const [i,r] of game.trace.entries()){
  assert.equal(terminal,null,'No move allowed after first terminal');assert.equal(r.ply,i+1);assert.equal(r.sequenceBefore,seq);assert.equal(r.player,(i&1)+1);
  const p=i&1,{candidates,maxima}=measure(p),unique=maxima.length===1?maxima[0]:null,cert=unique!==null&&unique.H>0;
  const reason=!unique?'NON_UNIQUE_PARETO_MAX':unique.H===0?'UNIQUE_MAX_EXHAUSTS_COLUMN':'UNIQUE_PARETO_MAX_WITH_COLUMN_HEADROOM';
  assert.equal(r.rankLocalReason,reason);assert.equal(r.rankLocalStatus,cert?'CERTIFIED':'UNRESOLVED');assert.equal(r.uniqueParetoColumn,unique?.column??null);
  assert.deepEqual(r.unresolvedMaximumABH,unique);assert.deepEqual(r.selectedABH,candidates.find(c=>c.column===r.selectedMove));
  assert.equal(r.source,cert?'RANK_LOCAL':'SEARCH');assert.equal(r.searchStarted,!cert);assert.equal(r.raw.move+1,r.selectedMove);
  if(cert){assert.equal(r.selectedMove,unique.column);assert.equal(r.rootWdl,null);assert.equal(r.totalSearchNodes,0);}else{
    assert.equal(r.searchStatus,'EXACT');assert.ok([-1,0,1].includes(r.rootWdl));assert.equal(r.workerNodeCounts.length,4);assert.ok(r.workerNodeCounts.every(n=>Number.isSafeInteger(n)&&n>=0));
    assert.equal(r.totalSearchNodes,r.workerNodeCounts.reduce((a,b)=>a+b,0));assert.equal(r.raw.cleanup,true);assert.equal(r.raw.workersExited,4);
    assert.equal(r.affinity.length,4);for(let w=0;w<4;w++){const a=r.affinity[w];assert.equal(a.actual.processor,2*w);assert.equal(a.actual.group,0);assert.equal(a.actual.mask,String(1n<<BigInt(2*w)));assert.equal(a.beforeSolverInitialization,true);assert.equal(a.target.core,w);affinityChecks++;}
  }
  assert.ok(r.cumulativeWallMs>=lastWall);lastWall=r.cumulativeWallMs;totalNodes+=r.totalSearchNodes;
  const c=r.selectedMove-1;assert.ok(c>=0&&c<7&&heights[c]<6);board[7*heights[c]+c]=p;heights[c]++;seq+=String(c+1);
  if(lines.some(l=>l.every(j=>board[j]===p)))terminal={kind:'WIN',winner:p+1};else if(i===41)terminal={kind:'BOARD_FULL',winner:null};
}
assert.deepEqual(game.terminal,terminal);assert.equal(game.finalSequence,seq);assert.equal(game.totalPlies,game.trace.length);assert.equal(game.totalSearchNodes,totalNodes);
assert.equal(game.rankLocalMoves,game.trace.filter(r=>r.source==='RANK_LOCAL').length);assert.equal(game.searchedMoves,game.trace.filter(r=>r.source==='SEARCH').length);
assert.ok(game.trace.slice(0,5).every(r=>r.source==='RANK_LOCAL'&&r.selectedMove===4&&!r.searchStarted));assert.equal(game.firstSearchPly,6);assert.equal(game.trace[5].sequenceBefore,'44444');
assert.equal(game.totalWallMs,lastWall);assert.equal(game.under60Seconds,game.completed&&game.totalWallMs<60000);assert.equal(game.status,'COMPLETE');assert.equal(game.explicitCollection,true);
assert.deepEqual(game.config,{workers:4,rootFrontier:true,sharedSampleMask:0,sharedCacheCapacity:268435456,localCacheCapacity:16777216,timeoutMs:300000});
assert.equal(game.addonsTree,execFileSync('git',['rev-parse','1f3947d52be4dc35569d898b13951ee6f1b2df28:addons'],{encoding:'utf8'}).trim());
assert.equal(game.addonsTree,execFileSync('git',['rev-parse',game.repositorySha+':addons'],{encoding:'utf8'}).trim());
const jsonl=fs.readFileSync(path.join(dir,'trace.jsonl'),'utf8').trim().split('\n').map(JSON.parse);assert.deepEqual(jsonl,game.trace);
const original=read(path.join(base,'game.json'));assert.equal(original.completed,false);assert.equal(original.error.message,'EINVAL');
const report={status:'PASS',independentWinningLines:lines.length,checkedPlies:game.trace.length,affinityChecks,controls:7,firstTerminal:terminal,sequence:seq,totalNodes,
  totalWallMs:game.totalWallMs,under60Seconds:game.under60Seconds,peakRssBytes:game.peakRssBytes,sourceSha:game.repositorySha,addonsUnchanged:true,
  gameSha256:createHash('sha256').update(fs.readFileSync(path.join(dir,'game.json'))).digest('hex'),
  qualifier:'Single completed attempt with explicit between-search GC included in wall. Baseline without explicit reclamation was incomplete. No independent exact-solver correctness or universal structural-certificate qualification claimed.'};
fs.writeFileSync(path.join(base,'VERIFICATION.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
