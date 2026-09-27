import {performance} from 'node:perf_hooks';
import {prepareConnect4RbaGeometry,runLazySmpConnect4Rba32} from '../../addons/index.mjs';
import {processCycleCounter} from '../cpc-factorial/cycle-counter.mjs';
import lockedProfile from './locked-profile.json' with {type:'json'};
// Cold, hardware-scoped campaign defaults. Explicit comparison arms override
// these values; the portable library and recursive execution remain unchanged.
const c={...lockedProfile.options,...JSON.parse(process.argv[2])},
  meter=await processCycleCounter(),bootstrap=meter.read();
let peakRss=process.memoryUsage().rss;
const rssTimer=setInterval(()=>{peakRss=Math.max(peakRss,process.memoryUsage().rss);},1000);
rssTimer.unref();
try{
  const geometry=prepareConnect4RbaGeometry({columns:c.columns??7,rows:c.rows??6}),
    moves=Array.from(c.moves,ch=>ch.charCodeAt(0)-49),before=meter.read(),start=performance.now(),cpu=process.cpuUsage();
  const r=await runLazySmpConnect4Rba32(moves,{geometry,workers:c.workers,sharedCacheCapacity:c.sharedCacheCapacity,
    localCacheCapacity:c.localCacheCapacity,sharedSampleMask:c.sharedSampleMask??7,timeoutMs:c.timeoutMs??30000});
  const after=meter.read(),wallMs=performance.now()-start,used=process.cpuUsage(cpu),
    totalNodes=r.benchmarkNodeCounts.reduce((a,b)=>a+b,0),starts=r.workerTiming.map(x=>x[0]),
    firstStart=Math.min(...starts),lastStart=Math.max(...starts),
    finish=r.status==='EXACT'?r.workerTiming[r.winner][1]:null;
  console.log(JSON.stringify({...r,config:c,wallMs,cpuMs:(used.user+used.system)/1000,
    bootstrapCycles:String(bootstrap),setupCycles:String(before-bootstrap),solveCycles:String(after-before),totalCycles:String(after),
    totalNodes,cyclesPerNode:Number(after-before)/totalNodes,nodesPerSecond:totalNodes/(wallMs/1000),
    firstStartMs:firstStart-start,startSkewMs:lastStart-firstStart,
    firstSearchToResultMs:finish===null?null:finish-firstStart,
    winnerSearchMs:finish===null?null:finish-r.workerTiming[r.winner][0],
    afterResultMs:finish===null?null:performance.now()-finish,
    cachePayloadBytes:c.sharedCacheCapacity*(geometry.keyWords*4+8)+12+
      c.workers*c.localCacheCapacity*(geometry.keyWords*4+5),
    observedPeakRss:Math.max(peakRss,process.memoryUsage().rss),rss:process.memoryUsage().rss}));
}finally{clearInterval(rssTimer);meter.close();}
