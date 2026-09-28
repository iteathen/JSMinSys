import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {availableParallelism} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [libraryArg,movesText='353335714',timeoutArg='90000']=process.argv.slice(2),
  library=resolve(libraryArg),timeoutMs=Number(timeoutArg);
if(!Number.isSafeInteger(timeoutMs)||timeoutMs<=0)throw new RangeError('timeoutMs');
const api=await import(pathToFileURL(resolve(library,'addons/index.mjs')).href);
const {processCycleCounter}=await import(pathToFileURL(resolve(library,'tools/process-cycle-counter.mjs')).href);
const profile=(await import(pathToFileURL(resolve(library,'profiles/isomax-i5-12600k.json')).href,{with:{type:'json'}})).default;
const config={...profile.options,workers:4,timeoutMs};
assert.equal(config.rootFrontier,true);assert.equal(config.workers,4);
const meter=await processCycleCounter(),bootstrap=meter.read();
try{
  const geometry=api.prepareConnect4RbaGeometry({columns:7,rows:6}),
    moves=Array.from(movesText,ch=>ch.charCodeAt(0)-49),
    before=meter.read(),start=performance.now(),cpu=process.cpuUsage(),
    result=await api.runLazySmpConnect4Rba32(moves,{geometry,...config}),
    after=meter.read(),wallMs=performance.now()-start,used=process.cpuUsage(cpu),
    totalNodes=result.nodeCounts.reduce((a,b)=>a+b,0),
    firstStart=Math.min(...result.workerTiming.map(t=>t[0])),
    lastStart=Math.max(...result.workerTiming.map(t=>t[0])),
    finish=result.status==='EXACT'?result.workerTiming[result.winner][1]:null;
  console.log(JSON.stringify({
    kind:'isomax-phase2-scaled4-sample-v1',
    sourceSha:(await import('node:child_process')).execFileSync('git',['-C',library,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),
    fixture:movesText,
    topology:{workers:4,wideWorker:0,deepWorkers:[1,2,3],availableParallelism:availableParallelism()},
    selectedProfile:profile.id,config,...result,
    wallMs,cpuMs:(used.user+used.system)/1000,
    bootstrapCycles:String(bootstrap),setupCycles:String(before-bootstrap),solveCycles:String(after-before),
    totalCycles:String(after),totalNodes,nodeCountsExact:result.nodeCounts.every(Number.isSafeInteger)&&Number.isSafeInteger(totalNodes),
    cyclesPerNode:totalNodes?Number(after-before)/totalNodes:null,
    nodesPerSecond:totalNodes/(wallMs/1000),
    firstStartMs:firstStart-start,startSkewMs:lastStart-firstStart,
    firstSearchToResultMs:finish===null?null:finish-firstStart,
    rss:process.memoryUsage().rss,processPeakRssBytes:process.resourceUsage().maxRSS*1024
  }));
}finally{meter.close();}
