import {appendFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
import {availableParallelism,platform,arch,release} from 'node:os';

const BASELINE_SHA='81c9475e94607cff9e777776157b82b3466c385b';
const CANDIDATE_SHA='698a1b583d652d88650f0ab85808b52a9ed7236b';
const [outArg,baselineArg,candidateArg,moves='353335714',blocksArg='8',timeoutArg='90000']=process.argv.slice(2);
if(!outArg||!baselineArg||!candidateArg)
  throw Error('usage: lazy-live-order-ab OUTPUT BASELINE CANDIDATE MOVES BLOCKS TIMEOUT');
const blocks=Number(blocksArg),timeoutMs=Number(timeoutArg);
if(!Number.isInteger(blocks)||blocks<1||blocks>8)throw RangeError('blocks 1..8');
if(!Number.isSafeInteger(timeoutMs)||timeoutMs<=0)throw RangeError('timeoutMs');
if(availableParallelism()!==4)throw Error('expected availableParallelism=4, got '+availableParallelism());

const out=resolve(outArg),baseline=resolve(baselineArg),candidate=resolve(candidateArg);
if(existsSync(out))throw Error('output exists');
mkdirSync(out,{recursive:true});
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim(),
  sources={
    A:{label:'compact-private-81c947',path:baseline,sha:git(baseline,'rev-parse','HEAD'),dirty:!!git(baseline,'status','--porcelain')},
    B:{label:'lazy-live-order-698a',path:candidate,sha:git(candidate,'rev-parse','HEAD'),dirty:!!git(candidate,'status','--porcelain')},
  };
if(sources.A.dirty||sources.B.dirty)throw Error('dirty source worktree');
if(sources.A.sha!==BASELINE_SHA)throw Error('baseline SHA drift: '+sources.A.sha);
if(sources.B.sha!==CANDIDATE_SHA)throw Error('candidate SHA drift: '+sources.B.sha);

const orders=['AB','BA'],
  sample=resolve(dirname(fileURLToPath(import.meta.url)),'lazy-live-order-source-sample.mjs');
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({
  kind:'isomax-phase2-lazy-live-order-source-ab-v1',moves,blocks,timeoutMs,orders,sources,
  environment:{node:process.version,platform:platform(),arch:arch(),release:release(),availableParallelism:availableParallelism()},
  topology:{workers:4,wideWorker:0,deepWorkers:[1,2,3],rootFrontier:true,sharedSampleMask:0,
    sharedCacheCapacity:4194304,localCacheCapacity:1048576,requiredAvailableParallelism:4}
},null,2)+'\n');

const rows=[];
for(let block=0;block<blocks;block++){
  const order=orders[block%orders.length];
  for(const arm of order){
    const spec=sources[arm],
      cur={sha:git(spec.path,'rev-parse','HEAD'),dirty:!!git(spec.path,'status','--porcelain')};
    if(cur.dirty||cur.sha!==spec.sha)throw Error(arm+' source changed');
    const child=spawnSync(process.execPath,['--experimental-ffi',sample,spec.path,moves,String(timeoutMs)],{
      encoding:'utf8',timeout:timeoutMs+30000,maxBuffer:4*1024*1024
    });
    appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({
      block,order,arm,label:spec.label,sourceSha:spec.sha,status:child.status,signal:child.signal,
      error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr
    })+'\n');
    if(child.status!==0)throw Error(arm+' sample failed');
    const row={...JSON.parse(child.stdout.trim()),block,order,arm,label:spec.label};
    if(row.sourceSha!==spec.sha)throw Error(arm+' source mismatch');
    if(row.config?.workers!==4||row.config?.rootFrontier!==true||row.config?.sharedSampleMask!==0)
      throw Error('config drift');
    if(row.config?.sharedCacheCapacity!==4194304||row.config?.localCacheCapacity!==1048576)
      throw Error('cache capacity drift');
    if(row.topology?.workers!==4||row.topology?.wideWorker!==0||
       JSON.stringify(row.topology?.deepWorkers)!==JSON.stringify([1,2,3]))
      throw Error('topology drift');
    if(row.topology?.availableParallelism!==4)throw Error('availableParallelism drift');
    rows.push(row);
    appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(row)+'\n');
    console.log(JSON.stringify({block,order,arm,status:row.status,cycles:row.solveCycles,wallMs:row.wallMs,
      totalNodes:row.totalNodes,winnerNodes:row.winnerNodes,sharedHits:row.sharedCacheHits,
      sharedStores:row.sharedCacheStores,contention:row.sharedCacheStoreContention,sharedBytes:row.sharedBytes}));
  }
}

const exact=rows.filter(r=>r.status==='EXACT'),
  resultSet=[...new Set(exact.map(r=>JSON.stringify({rootWdl:r.rootWdl,move:r.move})))];
if(resultSet.length>1)throw Error('exact result drift');
const t95=[null,null,12.706,4.303,3.182,2.776,2.571,2.447,2.365],
  summary={kind:'isomax-phase2-compact-private-source-ab-summary-v1',moves,blocks,timeoutMs,samples:rows.length,
    exactResult:resultSet.length?JSON.parse(resultSet[0]):null,arms:{},paired:{}},
  mean=(arr,key)=>arr.length?arr.reduce((s,r)=>s+Number(r[key]??0),0)/arr.length:null;
for(const arm of ['A','B']){
  const a=rows.filter(r=>r.arm===arm),ex=a.filter(r=>r.status==='EXACT'),workerCount=a[0]?.nodeCounts?.length??0;
  summary.arms[arm]={label:sources[arm].label,sha:sources[arm].sha,exact:ex.length,timeouts:a.length-ex.length,
    meanCycles:mean(a,'solveCycles'),meanWall:mean(a,'wallMs'),meanCpu:mean(a,'cpuMs'),
    meanNodes:mean(a,'totalNodes'),meanWinnerNodes:mean(a,'winnerNodes'),
    meanPerWorkerNodes:Array.from({length:workerCount},(_,i)=>a.reduce((s,r)=>s+Number(r.nodeCounts?.[i]??0),0)/a.length),
    meanSharedHits:mean(a,'sharedCacheHits'),meanSharedStores:mean(a,'sharedCacheStores'),
    meanContention:mean(a,'sharedCacheStoreContention'),meanCyclesPerNode:mean(a,'cyclesPerNode'),
    meanSharedBytes:mean(a,'sharedBytes'),meanRss:mean(a,'rss'),meanPeakRss:mean(a,'processPeakRssBytes'),
    winners:[...new Set(a.map(r=>r.winner))],parallelism:[...new Set(a.map(r=>r.topology.availableParallelism))]};
}
const allExact=rows.every(r=>r.status==='EXACT');
for(const field of ['solveCycles','wallMs','cpuMs','totalNodes','winnerNodes','sharedCacheHits','sharedCacheStores',
  'sharedCacheStoreContention','cyclesPerNode','sharedBytes','rss','processPeakRssBytes']){
  const ratios=[];
  for(let b=0;b<blocks;b++){
    const aa=rows.find(r=>r.block===b&&r.arm==='A'),bb=rows.find(r=>r.block===b&&r.arm==='B');
    const av=Number(aa[field]),bv=Number(bb[field]);
    ratios.push(av===0?(bv===0?1:null):bv/av);
  }
  const finite=ratios.filter(x=>x!==null&&Number.isFinite(x)),
    m=finite.length?finite.reduce((x,y)=>x+y,0)/finite.length:null,
    v=finite.length>1?finite.reduce((s,x)=>s+(x-m)**2,0)/(finite.length-1):0,
    se=finite.length>1?Math.sqrt(v/finite.length):0,t=t95[finite.length]??null;
  summary.paired[field]={ratios,meanDeltaPct:m===null?null:(m-1)*100,
    interval95Pct:m===null||t===null?null:[(m-t*se-1)*100,(m+t*se-1)*100],
    exactSolveRatioAdmissible:allExact};
}
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
