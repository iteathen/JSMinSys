import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {cpus,freemem,totalmem,release} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {evaluateConnect4RankLocalLanding32} from '../../addons/connect4-rank-local-presearch.mjs';
import {processCycleCounter} from '../../tools/process-cycle-counter.mjs';
const library=resolve(process.argv[2]),arm=process.argv[3];
const {runLazySmpConnect4Rba32}=await import(pathToFileURL(resolve(library,'experiments/isomax-lean/host.mjs')).href);
const sourceSha=execFileSync('git',['-C',library,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
let features=[];try{features=JSON.parse(readFileSync(resolve(library,'experiments/isomax-lean/features.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const g=prepareConnect4RbaGeometry({columns:7,rows:6}),controls=[];
for(const sequence of ['','4','44','444','4444','44444','41']){
  const local=evaluateConnect4RankLocalLanding32([...sequence].map(c=>Number(c)-1),{geometry:g});
  const boundary=sequence==='44444';
  assert.equal(local.status,boundary?'UNRESOLVED':'CERTIFIED');
  assert.equal(local.move,boundary?-1:3);assert.equal(local.uniqueParetoColumn,3);
  if(boundary){
    assert.equal(local.reason,'UNIQUE_MAX_EXHAUSTS_COLUMN');
    const m=local.candidates.find(c=>c.column===3);
    assert.deepEqual([m.moverLiveLines,m.opponentDeniedLines,m.headroom],[6,6,0]);
  }
  controls.push({sequence,local,searchStarted:false});
}
const config={workers:4,sharedCacheCapacity:134217728,localCacheCapacity:16777216,
  sharedSampleMask:0,rootFrontier:false,timeoutMs:300000};
// Cold measurement metadata from the actual arm's allocator, outside timing.
const tt=await import(pathToFileURL(resolve(library,'experiments/isomax-lean/shared-cache.mjs')).href);
const oneEntry=tt.createConnect4RbaSharedExactCache32({capacity:1,keyWords:g.keyWords,geometry:g});
const sharedEntryBytes=oneEntry.entries.buffer.byteLength;
const environment={node:process.version,v8:process.versions.v8,cpu:cpus()[0].model,
  os:release(),ramBytes:totalmem(),freeRamBytes:freemem()};
const meter=await processCycleCounter(),moves=[],trace=[];
try{
  const cycles=meter.read(),cpu=process.cpuUsage(),start=performance.now();
  while(true){
    const local=evaluateConnect4RankLocalLanding32(moves,{geometry:g});
    trace.push({ply:moves.length+1,sequenceBefore:moves.map(c=>c+1).join(''),local,searchStarted:false});
    if(local.status!=='CERTIFIED')break;
    moves.push(local.move);
  }
  const structuralMs=performance.now()-start,searchRootSequence=moves.map(c=>c+1).join('');
  assert.equal(searchRootSequence,'44444');
  trace.at(-1).searchStarted=true;
  const result=await runLazySmpConnect4Rba32(moves,{geometry:g,...config});
  const wallMs=performance.now()-start,solveCycles=String(meter.read()-cycles),used=process.cpuUsage(cpu);
  console.log(JSON.stringify({sourceSha,library,features,arm,config,sharedEntryBytes,
    sharedTableBytes:sharedEntryBytes*config.sharedCacheCapacity,environment,controls,trace,structuralMs,
    searchRootSequence,structuralMoves:moves.length,firstSearchPly:moves.length+1,searchCalls:1,
    topology:{workers:4,wide:null,deep:[0,1,2,3]},...result,wallMs,solveCycles,
    cpuMs:(used.user+used.system)/1000,peakRssBytes:process.resourceUsage().maxRSS*1024,
    under60Seconds:result.status==='EXACT'&&wallMs<60000,
    scope:'Computed empty-board prefix followed by one exact root solve; not full self-play'}));
}finally{meter.close();}
