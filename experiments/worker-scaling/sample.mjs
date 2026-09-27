import {performance} from 'node:perf_hooks';
import {prepareConnect4RbaGeometry,runLazySmpConnect4Rba32} from '../../addons/index.mjs';
import {processCycleCounter} from '../cpc-factorial/cycle-counter.mjs';
const c=JSON.parse(process.argv[2]),meter=await processCycleCounter(),bootstrap=meter.read();
try{
  const geometry=prepareConnect4RbaGeometry({columns:c.columns??7,rows:c.rows??6}),
    moves=Array.from(c.moves,ch=>ch.charCodeAt(0)-49),before=meter.read(),start=performance.now(),cpu=process.cpuUsage();
  const r=await runLazySmpConnect4Rba32(moves,{geometry,workers:c.workers,sharedCacheCapacity:1048576,
    localCacheCapacity:1048576,sharedSampleMask:c.sharedSampleMask??7,timeoutMs:c.timeoutMs??30000});
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
    rss:process.memoryUsage().rss}));
}finally{meter.close();}
