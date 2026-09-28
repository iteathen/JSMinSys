import {appendFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

const [outArg,aArg,bArg,moves='45461667',blocksArg='4',timeoutArg='30000']=process.argv.slice(2);
if(!outArg||!aArg||!bArg)throw Error('usage: selected-production-ab OUTPUT CONTROL CANDIDATE MOVES BLOCKS TIMEOUT_MS');
const blocks=Number(blocksArg),timeoutMs=Number(timeoutArg);
if(!Number.isInteger(blocks)||blocks<1||blocks>16)throw RangeError('blocks 1..16');
if(!Number.isSafeInteger(timeoutMs)||timeoutMs<=0)throw RangeError('timeoutMs');
const out=resolve(outArg);if(existsSync(out))throw Error('output exists');mkdirSync(out,{recursive:true});
const dirs={A:resolve(aArg),B:resolve(bArg)},
  labels={A:'selected-production',B:'selected-production-zero-bounds'},
  git=(d,...args)=>execFileSync('git',['-C',d,...args],{encoding:'utf8'}).trim(),
  src=Object.fromEntries(Object.entries(dirs).map(([k,d])=>[k,{sha:git(d,'rev-parse','HEAD'),dirty:!!git(d,'status','--porcelain'),path:d}]));
if(src.A.dirty||src.B.dirty)throw Error('dirty source');
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({
  kind:'isomax-phase2-selected-production-ab-v1',moves,blocks,timeoutMs,sequence:'ABBA',sources:src,
  selectedProfile:{workers:7,rootFrontier:true,sharedCacheCapacity:4194304,localCacheCapacity:1048576,sharedSampleMask:0}
},null,2)+'\n');

const rows=[];
for(let block=0;block<blocks;block++)for(const arm of ['A','B','B','A']){
  const d=dirs[arm];
  if(git(d,'status','--porcelain')||git(d,'rev-parse','HEAD')!==src[arm].sha)throw Error('source changed');
  const child=spawnSync(process.execPath,['--experimental-ffi',resolve(d,'tools/run-isomax.mjs'),JSON.stringify({moves,timeoutMs})],{
    cwd:d,encoding:'utf8',timeout:timeoutMs+30000,maxBuffer:4*1024*1024
  });
  appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({block,arm,status:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr})+'\n');
  if(child.status!==0)throw Error(arm+' runner failed');
  const row={...JSON.parse(child.stdout.trim()),block,arm,label:labels[arm]};
  if(!['EXACT','TIMEOUT'].includes(row.status))throw Error(arm+' unexpected status '+row.status);
  if(row.requestedWorkers!==7||row.workersUsed!==7||row.config?.rootFrontier!==true)throw Error('selected profile drift');
  if(row.config?.sharedCacheCapacity!==4194304||row.config?.localCacheCapacity!==1048576||row.config?.sharedSampleMask!==0)throw Error('selected cache profile drift');
  rows.push(row);appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(row)+'\n');
  console.log(JSON.stringify({
    block,arm,status:row.status,cycles:row.solveCycles,wallMs:row.wallMs,cpuMs:row.cpuMs,totalNodes:row.totalNodes,
    rootWdl:row.rootWdl,move:row.move,winner:row.winner,winnerNodes:row.winnerMetrics?.nodes??null,
    sharedHits:row.sharedCacheHits,sharedStores:row.sharedCacheStores,sharedContention:row.sharedCacheStoreContention,
    rss:row.rss,peakRss:row.processPeakRssBytes
  }));
}
const exact=rows.filter(r=>r.status==='EXACT'),results=[...new Set(exact.map(r=>JSON.stringify({rootWdl:r.rootWdl,move:r.move})))];
if(results.length>1)throw Error('exact result drift');
const summary={kind:'isomax-phase2-selected-production-ab-summary-v1',moves,blocks,timeoutMs,samples:rows.length,exactResult:results.length?JSON.parse(results[0]):null,arms:{}};
for(const arm of ['A','B']){
  const a=rows.filter(r=>r.arm===arm),ex=a.filter(r=>r.status==='EXACT'),to=a.filter(r=>r.status==='TIMEOUT'),
    mean=(arr,key)=>arr.length?arr.reduce((s,r)=>s+Number(r[key]??0),0)/arr.length:null,
    meanWinner=(arr,key)=>arr.length?arr.reduce((s,r)=>s+Number(r.winnerMetrics?.[key]??0),0)/arr.length:null;
  summary.arms[arm]={label:labels[arm],exact:ex.length,timeouts:to.length,
    meanCyclesAll:mean(a,'solveCycles'),meanWallAll:mean(a,'wallMs'),meanCpuAll:mean(a,'cpuMs'),meanNodesAll:mean(a,'totalNodes'),
    meanCyclesExact:mean(ex,'solveCycles'),meanWallExact:mean(ex,'wallMs'),meanCpuExact:mean(ex,'cpuMs'),meanNodesExact:mean(ex,'totalNodes'),
    meanWinnerNodes:meanWinner(ex,'nodes'),meanSharedHits:mean(a,'sharedCacheHits'),meanSharedStores:mean(a,'sharedCacheStores'),
    meanSharedContention:mean(a,'sharedCacheStoreContention'),meanRss:mean(a,'rss'),meanPeakRss:mean(a,'processPeakRssBytes')};
}
const allExact=summary.arms.A.exact===rows.filter(r=>r.arm==='A').length&&summary.arms.B.exact===rows.filter(r=>r.arm==='B').length;
if(allExact){
  const t95=[null,null,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131];
  summary.paired={};
  for(const field of ['solveCycles','wallMs','cpuMs','totalNodes','sharedCacheHits','sharedCacheStores']){
    const ratios=[];
    for(let block=0;block<blocks;block++){
      const aa=rows.filter(r=>r.block===block&&r.arm==='A'),bb=rows.filter(r=>r.block===block&&r.arm==='B'),
        mean=x=>x.reduce((s,r)=>s+Number(r[field]),0)/x.length;
      ratios.push(mean(bb)/mean(aa));
    }
    const mean=ratios.reduce((x,y)=>x+y,0)/ratios.length,
      variance=blocks>1?ratios.reduce((s,x)=>s+(x-mean)**2,0)/(blocks-1):0,
      se=blocks>1?Math.sqrt(variance/blocks):0,t=t95[blocks]??null;
    summary.paired[field]={ratios,meanDeltaPct:(mean-1)*100,
      interval95Pct:t===null?null:[(mean-t*se-1)*100,(mean+t*se-1)*100]};
  }
}else{
  summary.censored=true;
  summary.interpretation='At least one arm hit the fixed ceiling; do not report exact A/B speed ratios from censored samples.';
}
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));