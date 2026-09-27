// Public native solver, cold process-boundary accounting only. No strategist.
import {performance} from 'node:perf_hooks';
import {freemem} from 'node:os';
import {prepareConnect4RbaGeometry,runLazySmpConnect4Rba32} from '../../addons/index.mjs';
import {processCycleCounter} from '../cpc-factorial/cycle-counter.mjs';
import {validateMemoryArm,memoryBytes} from './memory-config.mjs';
const config=validateMemoryArm(JSON.parse(process.argv[2])),root=process.argv[3];
if(freemem()<4*1024**3)throw Error('less than 4 GiB free RAM');
const meter=await processCycleCounter(),bootstrap=meter.read(),g=prepareConnect4RbaGeometry({columns:7,rows:6});
const moves=[...root].map(Number),before=meter.read(),started=performance.now();
let peakRss=process.memoryUsage().rss,timer;
try{
  // Diagnostics only: separate host event loop, never evaluator recursion.
  if(config.timeoutMs>=30000)timer=setInterval(()=>{
    const rss=process.memoryUsage().rss;peakRss=Math.max(peakRss,rss);
    console.error(JSON.stringify({elapsedMs:performance.now()-started,rss,cycles:String(meter.read())}));
  },1000);
  const result=await runLazySmpConnect4Rba32(moves,{geometry:g,workers:4,sharedSampleMask:7,
    sharedCacheCapacity:config.shared,localCacheCapacity:config.local,timeoutMs:config.timeoutMs,
    cpcFrontierResponse:false,cpcProjectedAdvisory:false});
  const after=meter.read(),wallMs=performance.now()-started;
  if(timer)clearInterval(timer);
  peakRss=Math.max(peakRss,process.memoryUsage().rss);
  const totalNodes=result.benchmarkNodeCounts?.reduce((a,b)=>a+b,0)??null;
  console.log(JSON.stringify({...result,config,root,wallMs,cacheBytes:memoryBytes(config.shared,config.local),
    bootstrapCycles:String(bootstrap),setupCycles:String(before-bootstrap),solveCycles:String(after-before),totalProcessCycles:String(after),
    totalNodes,visitsPerSecond:totalNodes===null?null:totalNodes/(wallMs/1000),
    cyclesPerVisit:totalNodes?Number(after-before)/totalNodes:null,
    sampledPeakRssBytes:config.timeoutMs>=30000?peakRss:null,finalRssBytes:process.memoryUsage().rss,
    measurement:totalNodes===null?'production':'existing-all-worker-node-loader'}));
}finally{if(timer)clearInterval(timer);meter.close();}
