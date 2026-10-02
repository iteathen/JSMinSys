import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {availableParallelism} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';

const [libraryArg,movesText='353335714',timeoutArg='90000']=process.argv.slice(2),
  library=resolve(libraryArg),timeoutMs=Number(timeoutArg), sharedCacheCapacity=Number(process.argv[5]??4194304), localCacheCapacity=Number(process.argv[6]??1048576);
if(!libraryArg)throw Error('usage: cpc-proof-mask-sample LIBRARY MOVES TIMEOUT');
if(!Number.isSafeInteger(timeoutMs)||timeoutMs<=0)throw new RangeError('timeoutMs');

const api=await import(pathToFileURL(resolve(library,'addons/index.mjs')).href);
const {processCycleCounter}=await import(pathToFileURL(resolve(library,'tools/process-cycle-counter.mjs')).href);
const profile=(await import(pathToFileURL(resolve('profiles/isomax-i5-12600k-memory-selected.json')).href,{with:{type:'json'}})).default;
const config={...profile.options,workers:4,sharedSampleMask:0,timeoutMs,sharedCacheCapacity,localCacheCapacity};
assert.equal(config.rootFrontier,true);
assert.equal(config.workers,4);
assert.equal(config.sharedSampleMask,0);
assert.ok([4194304,67108864,134217728,268435456].includes(config.sharedCacheCapacity));
assert.ok([16384,32768,65536,524288,1048576,2097152,4194304,8388608,16777216,33554432].includes(config.localCacheCapacity));
assert.ok(availableParallelism()>=4);

const structuralLibrary='C:/r/isomax-rank-local-benchmark';
const {evaluateConnect4RankLocalLanding32}=await import(pathToFileURL(resolve(structuralLibrary,'addons/connect4-rank-local-presearch.mjs')).href);
const {readFileSync}=await import('node:fs');
const {createHash}=await import('node:crypto');
const geometry=api.prepareConnect4RbaGeometry({columns:7,rows:6});
const controls=[];
for(const sequence of ['','4','44','444','4444','44444','41']){
  const local=evaluateConnect4RankLocalLanding32(Array.from(sequence,ch=>Number(ch)-1),{geometry});
  const boundary=sequence==='44444';
  assert.equal(local.status,boundary?'UNRESOLVED':'CERTIFIED');
  assert.equal(local.move,boundary?-1:3);
  assert.equal(local.uniqueParetoColumn,3);
  if(boundary){
    assert.equal(local.reason,'UNIQUE_MAX_EXHAUSTS_COLUMN');
    const maximum=local.candidates.find(c=>c.column===3);
    assert.deepEqual([maximum.moverLiveLines,maximum.opponentDeniedLines,maximum.headroom],[6,6,0]);
  }
  controls.push({sequence,local,searchStarted:false});
}
if(process.argv.includes('--controls-only')){
  console.log(JSON.stringify({status:'PASS',controls}));process.exit(0);
}
assert.equal(movesText,'','this experiment starts from an empty board');
const sourceSha=execFileSync('git',['-C',library,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const structuralSourceSha=execFileSync('git',['-C',structuralLibrary,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const structuralModuleSha256=createHash('sha256').update(readFileSync(resolve(structuralLibrary,'addons/connect4-rank-local-presearch.mjs'))).digest('hex');
const sampleSha256=createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');
const meter=await processCycleCounter(),bootstrap=meter.read();
try{
  const moves=[],trace=[];
  let searchCalls=0;
  const before=meter.read(),start=performance.now(),cpu=process.cpuUsage();
  while(true){
    const sequenceBefore=moves.map(c=>c+1).join('');
    const local=evaluateConnect4RankLocalLanding32(moves,{geometry});
    trace.push({ply:moves.length+1,player:(moves.length&1)+1,sequenceBefore,local,searchStarted:false,elapsedMs:performance.now()-start});
    if(local.status!=='CERTIFIED')break;
    assert.ok(Number.isInteger(local.move)&&local.move>=0&&local.move<geometry.columns);
    moves.push(local.move);
    assert.ok(moves.length<=geometry.cellCount);
  }
  const structuralElapsedMs=performance.now()-start;
  const searchRootSequence=moves.map(c=>c+1).join('');
  // These assertions validate the computed result; they never supply moves.
  assert.equal(searchRootSequence,'44444');
  assert.equal(trace.at(-1).local.reason,'UNIQUE_MAX_EXHAUSTS_COLUMN');
  const firstSearchPly=moves.length+1;
  trace.at(-1).searchStarted=true;
  searchCalls+=1;
  const searchStart=performance.now();
  const result=await api.runLazySmpConnect4Rba32(moves,{geometry,...config});
  const searchElapsedMs=performance.now()-searchStart;
  const sequenceAfterSelectedMove=result.status==='EXACT'&&result.move>=0?[...moves,result.move].map(c=>c+1).join(''):null;
  const after=meter.read(),wallMs=performance.now()-start,used=process.cpuUsage(cpu);
  const totalNodes=result.nodeCounts.reduce((a,b)=>a+b,0);
  console.log(JSON.stringify({
    kind:'isomax-structural-once-sample-v1',sourceSha,structuralSourceSha,structuralModuleSha256,sampleSha256,
    fixture:movesText,searchRootSequence,sequenceAfterSelectedMove,firstSearchPly,searchCalls,
    structuralMoves:moves.length,structuralElapsedMs,searchElapsedMs,controls,trace,
    scope:'Empty-board structural prefix followed by one exact root solve; not full self-play. rootWdl applies to searchRootSequence.',
    timingBoundary:'Empty moves array ready through computed structural prefix and complete unchanged solver invocation',
    topology:{workers:4,wideWorker:null,deepWorkers:[0,1,2,3],availableParallelism:availableParallelism()},
    selectedProfile:profile.id,config,...result,wallMs,cpuMs:(used.user+used.system)/1000,
    bootstrapCycles:String(bootstrap),setupCycles:String(before-bootstrap),solveCycles:String(after-before),totalCycles:String(after),
    totalNodes,winnerNodes:result.winner>=0?result.nodeCounts[result.winner]:null,
    nodeCountsExact:result.nodeCounts.every(Number.isSafeInteger)&&Number.isSafeInteger(totalNodes),
    cyclesPerNode:totalNodes?Number(after-before)/totalNodes:null,nodesPerSecond:totalNodes/(wallMs/1000),
    rss:process.memoryUsage().rss,processPeakRssBytes:process.resourceUsage().maxRSS*1024
  }));
}finally{meter.close();}