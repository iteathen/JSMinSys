// COLD runner. Measurements bracket the complete host/worker operation; none
// of the clocks, strings, JSON or process APIs below is called at a search node.
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {prepareConnect4RbaGeometry,runLazySmpConnect4Rba32} from '../addons/index.mjs';
import {processCycleCounter} from './process-cycle-counter.mjs';
import profile from '../profiles/isomax-i5-12600k.json' with {type:'json'};
const input=JSON.parse(process.argv[2]??'{"moves":""}');
assert.ok(Object.keys(input).every(k=>k==='moves'||k==='timeoutMs'),'selected profile accepts only moves and timeoutMs');
assert.equal(typeof input.moves,'string');assert.match(input.moves,/^[1-7]*$/);
const config={...profile.options,moves:input.moves,timeoutMs:input.timeoutMs??30000};
assert.ok(Number.isSafeInteger(config.timeoutMs)&&config.timeoutMs>0);
const meter=await processCycleCounter(),bootstrap=meter.read();
try{
  const geometry=prepareConnect4RbaGeometry({columns:7,rows:6}),moves=Array.from(input.moves,ch=>ch.charCodeAt(0)-49),
    before=meter.read(),start=performance.now(),cpu=process.cpuUsage(),
    result=await runLazySmpConnect4Rba32(moves,{geometry,...config}),
    after=meter.read(),wallMs=performance.now()-start,used=process.cpuUsage(cpu),
    totalNodes=result.nodeCounts.reduce((a,b)=>a+b,0),firstStart=Math.min(...result.workerTiming.map(t=>t[0])),
    lastStart=Math.max(...result.workerTiming.map(t=>t[0])),finish=result.status==='EXACT'?result.workerTiming[result.winner][1]:null;
  console.log(JSON.stringify({selectedProfile:profile.id,execution:profile.execution,config,...result,
    wallMs,cpuMs:(used.user+used.system)/1000,bootstrapCycles:String(bootstrap),setupCycles:String(before-bootstrap),
    solveCycles:String(after-before),totalCycles:String(after),totalNodes,
    nodeCountsExact:result.nodeCounts.every(Number.isSafeInteger)&&Number.isSafeInteger(totalNodes),
    cyclesPerNode:totalNodes?Number(after-before)/totalNodes:null,nodesPerSecond:totalNodes/(wallMs/1000),
    firstStartMs:firstStart-start,startSkewMs:lastStart-firstStart,firstSearchToResultMs:finish===null?null:finish-firstStart,
    afterResultMs:finish===null?null:performance.now()-finish,
    cachePayloadBytes:profile.cachePayloadBytes7x6,rss:process.memoryUsage().rss,processPeakRssBytes:process.resourceUsage().maxRSS*1024}));
}finally{meter.close();}
