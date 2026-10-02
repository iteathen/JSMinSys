// Measurement-only adapter. No solver, CPC, RBA, ordering, TT or worker changes.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {evaluateConnect4RankLocalLanding32} from '../addons/connect4-rank-local-presearch.mjs';
import {runIsoMaxConnect4Move32} from '../addons/rba-connect4-move-selector.mjs';
import {queryWindowsTopology,validateWorkerTargets} from '../addons/worker-affinity.mjs';
import {processCycleCounter} from './process-cycle-counter.mjs';

const [mode,outArg]=process.argv.slice(2);
assert.ok(['controls','game'].includes(mode));assert.ok(outArg);
const out=path.resolve(outArg);fs.mkdirSync(out,{recursive:true});
const resultPath=path.join(out,mode+'.json');assert.ok(!fs.existsSync(resultPath),'Preserve previous attempts; use a new output directory');
const config={workers:4,rootFrontier:true,sharedSampleMask:0,sharedCacheCapacity:268435456,localCacheCapacity:16777216,timeoutMs:300000};
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const addonsTree=execFileSync('git',['rev-parse','HEAD:addons'],{encoding:'utf8'}).trim();
assert.equal(execFileSync('git',['diff','HEAD','--','addons'],{encoding:'utf8'}),'','Measured addons must match SHA');
const targetsFile=path.resolve('evidence/isomax-memory-affinity-20260928/targets.json');
process.env.JMS_WORKER_AFFINITY_FILE=targetsFile;
const requested=JSON.parse(fs.readFileSync(targetsFile,'utf8'));
const topology=await queryWindowsTopology(),targets=validateWorkerTargets(topology,requested,4);
assert.deepEqual(targets.map(t=>t.processor),[0,2,4,6]);
assert.equal(process.version,'v27.0.0-nightly20260928b59840b593');
assert.ok(process.versions.v8.startsWith('14.6.202.34'));
assert.ok(os.cpus()[0].model.includes('i5-12600K'));
const preload=path.resolve('tools/worker-affinity-preload.mjs');
assert.ok(process.execArgv.some(x=>x.includes('worker-affinity-preload.mjs')),'Historical affinity preload must be inherited');
const metadata={repositorySha:sha,addonsTree,config,node:process.version,v8:process.versions.v8,nodeExecutable:process.execPath,
  cpu:os.cpus()[0].model,totalMemoryBytes:os.totalmem(),freeMemoryBeforeBytes:os.freemem(),platform:process.platform,arch:process.arch,
  topology:{workers:4,wideWorker:0,deepWorkers:[1,2,3],rootFrontier:true,targets},
  affinityPreloadSha256:createHash('sha256').update(fs.readFileSync(preload)).digest('hex'),targetsFile,
  environmentDeviation:'No runtime/cache/affinity substitution. Background applications are running; available RAM recorded, no applications stopped.',
  measurement:'Primary wall includes every selector call, allocation, worker startup/cleanup, moves, terminal detection and between-ply trace I/O. No TT reused outside the unchanged selector. No forced GC.'};
const g=prepareConnect4RbaGeometry({columns:7,rows:6});
const cols=s=>Array.from(s,c=>Number(c)-1),sequence=m=>m.map(c=>c+1).join('');
const save=j=>fs.writeFileSync(resultPath,JSON.stringify(j,null,2)+'\n');
function affinity(prefix){return targets.map((t,i)=>{const r=JSON.parse(fs.readFileSync(prefix+'-'+i+'.json','utf8'));assert.equal(r.actual.group,t.group);assert.equal(r.actual.processor,t.processor);assert.equal(r.actual.mask,String(1n<<BigInt(t.processor)));assert.equal(r.beforeSolverInitialization,true);return r;});}
function measurement(local,column){const c=local.candidates.find(c=>c.column===column);return c?{column:c.column+1,A:c.moverLiveLines,B:c.opponentDeniedLines,H:c.headroom}:null;}

if(mode==='controls'){
  const rows=[];
  for(const text of ['','4','44','444','4444','41']){
    const r=await runIsoMaxConnect4Move32(cols(text),{geometry:g,...config});
    assert.equal(r.status,'RANK_LOCAL_MOVE');assert.equal(r.move,3);assert.equal(r.searchStarted,false);assert.equal(r.workersUsed,0);
    rows.push({sequence:text,passed:true,...r});
  }
  const local=evaluateConnect4RankLocalLanding32(cols('44444'),{geometry:g});
  assert.equal(local.status,'UNRESOLVED');assert.equal(local.reason,'UNIQUE_MAX_EXHAUSTS_COLUMN');assert.equal(local.uniqueParetoColumn,3);
  assert.deepEqual(measurement(local,3),{column:4,A:6,B:6,H:0});
  const prefix=path.join(out,'control-affinity');process.env.JMS_WORKER_AFFINITY_REPORT=prefix;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
  let r;try{r=await runIsoMaxConnect4Move32(cols('44444'),{geometry:g,...config,signal:controller.signal});}finally{clearTimeout(timer);}
  fs.writeFileSync(path.join(out,'control-search-raw.json'),JSON.stringify(r,null,2)+'\n');
  assert.equal(r.source,'SEARCH');assert.equal(r.searchStarted,true);assert.equal(r.workersUsed,4);
  assert.ok(['EXACT','INTERRUPTED'].includes(r.status),JSON.stringify(r));
  assert.ok(r.nodeCounts.reduce((a,b)=>a+b,0)>0,'Search must do actual work');assert.ok(r.workerTiming.every(t=>t[0]>0));assert.equal(r.cleanup,true);
  rows.push({sequence:'44444',passed:true,affinity:affinity(prefix),...r});
  save({status:'PASS',...metadata,controls:rows,controlSearch:'Actual configured search, intentionally cancelled after6s; excluded from game measurement; separate process and no retained search data.'});
  console.log(JSON.stringify({status:'PASS',controls:7,searchActuallyStarted:true,nodeCounts:r.nodeCounts}));
}else{
  const controls=JSON.parse(fs.readFileSync(path.join(out,'controls.json'),'utf8'));
  assert.equal(controls.status,'PASS');assert.equal(controls.addonsTree,addonsTree);assert.deepEqual(controls.config,config);
  const board=new Int8Array(42).fill(-1),heights=new Uint8Array(7),moves=[],trace=[];
  function apply(column,player){assert.ok(Number.isInteger(column)&&column>=0&&column<7&&heights[column]<6);const row=heights[column]++;board[row*7+column]=player;moves.push(column);
    for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){let count=1;for(const sign of [-1,1]){for(let k=1;k<4;k++){const x=column+sign*k*dx,y=row+sign*k*dy;if(x<0||x>=7||y<0||y>=6||board[y*7+x]!==player)break;count++;}}if(count>=4)return true;}return false;}
  const meter=await processCycleCounter();const cpuStart=process.cpuUsage(),cyclesStart=meter.read(),start=performance.now();
  let terminal={kind:'INCOMPLETE',winner:null},error=null,totalWallMs=0;
  const startedUtc=new Date().toISOString();
  function snapshot(status){return {schema:'isomax.rank-local.localhost.full-game.v1',status,...metadata,startedUtc,controlsPassed:true,trace,
    finalSequence:sequence(moves),terminal,totalPlies:moves.length,rankLocalMoves:trace.filter(r=>r.source==='RANK_LOCAL'&&r.selectedMove!==null).length,
    searchedMoves:trace.filter(r=>r.source==='SEARCH'&&r.selectedMove!==null).length,firstSearchPly:trace.find(r=>r.source==='SEARCH')?.ply??null,
    firstFiveComputedWithoutSearch:trace.length>=5&&trace.slice(0,5).every(r=>r.source==='RANK_LOCAL'&&r.searchStarted===false),
    totalSearchNodes:trace.reduce((n,r)=>n+r.totalSearchNodes,0),totalWallMs,completed:terminal.kind==='WIN'||terminal.kind==='BOARD_FULL',
    under60Seconds:(terminal.kind==='WIN'||terminal.kind==='BOARD_FULL')&&totalWallMs<60000,peakRssBytes:process.resourceUsage().maxRSS*1024,error};}
  try{
    for(let ply=1;ply<=42;ply++){
      const before=sequence(moves),prefix=path.join(out,'ply-'+String(ply).padStart(2,'0')+'-affinity');process.env.JMS_WORKER_AFFINITY_REPORT=prefix;
      fs.appendFileSync(path.join(out,'events.jsonl'),JSON.stringify({event:'SELECTOR_BEGIN',ply,sequence:before,cumulativeWallMs:performance.now()-start})+'\n');
      console.log('SELECTOR_BEGIN '+ply+' '+before);
      const callStart=performance.now(),r=await runIsoMaxConnect4Move32(moves.slice(),{geometry:g,...config}),selectorElapsedMs=performance.now()-callStart;
      const valid=r.status==='EXACT'||r.status==='RANK_LOCAL_MOVE',player=(ply-1)&1;
      const won=valid?apply(r.move,player):false;
      if(won)terminal={kind:'WIN',winner:player+1};else if(moves.length===42)terminal={kind:'BOARD_FULL',winner:null};else if(!valid)terminal={kind:'INCOMPLETE',winner:null,searchStatus:r.status};
      totalWallMs=performance.now()-start;
      const row={ply,player:player+1,sequenceBefore:before,selectedMove:valid?r.move+1:null,source:r.source,searchStarted:r.searchStarted,
        rankLocalStatus:r.preSearch.status,rankLocalReason:r.preSearch.reason,uniqueParetoColumn:r.preSearch.uniqueParetoColumn<0?null:r.preSearch.uniqueParetoColumn+1,
        selectedABH:valid?measurement(r.preSearch,r.move):null,unresolvedMaximumABH:measurement(r.preSearch,r.preSearch.uniqueParetoColumn),
        searchStatus:r.source==='SEARCH'?r.status:'NOT_STARTED',rootWdl:r.rootWdl,winnerWorker:r.winner,
        workerNodeCounts:r.nodeCounts??[],totalSearchNodes:(r.nodeCounts??[]).reduce((a,b)=>a+b,0),searchElapsedMs:r.source==='SEARCH'?r.elapsedMs:0,
        selectorElapsedMs,cumulativeWallMs:totalWallMs,affinity:r.source==='SEARCH'?affinity(prefix):[],raw:r};
      trace.push(row);fs.appendFileSync(path.join(out,'trace.jsonl'),JSON.stringify(row)+'\n');save(snapshot(valid?'RUNNING':'INCOMPLETE'));
      console.log(JSON.stringify({ply,move:row.selectedMove,source:row.source,status:r.status,wallMs:totalWallMs,nodes:row.totalSearchNodes}));
      if(!valid||won||moves.length===42)break;
    }
  }catch(e){error={message:e.message,stack:e.stack};terminal={kind:'INCOMPLETE',winner:null};totalWallMs=performance.now()-start;}
  const used=process.cpuUsage(cpuStart),cycles=meter.read()-cyclesStart;meter.close();
  const result={...snapshot(terminal.kind==='INCOMPLETE'?'INCOMPLETE':'COMPLETE'),cpuMs:(used.user+used.system)/1000,processCycles:String(cycles)};save(result);
  console.log(JSON.stringify({status:result.status,sequence:result.finalSequence,terminal,totalWallMs,under60Seconds:result.under60Seconds,totalSearchNodes:result.totalSearchNodes,peakRssBytes:result.peakRssBytes}));
  if(!result.completed)process.exitCode=2;
}
