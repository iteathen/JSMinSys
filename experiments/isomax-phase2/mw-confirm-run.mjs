import {appendFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {cpus,platform,release} from 'node:os';
import {resolve} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

const [outArg,aArg,bArg,moves='353335714',blocksArg='8',timeoutArg='90000']=process.argv.slice(2);
if(!outArg||!aArg||!bArg)throw Error('usage: node mw-confirm-run.mjs OUTPUT CONTROL CANDIDATE MOVES BLOCKS TIMEOUT_MS');
const blocks=Number(blocksArg),timeoutMs=Number(timeoutArg);
if(!Number.isInteger(blocks)||blocks<2||blocks>16)throw RangeError('blocks 2..16');
if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1000)throw RangeError('timeout');
const out=resolve(outArg);if(existsSync(out))throw Error('output exists');mkdirSync(out,{recursive:true});
const dirs={A:resolve(aArg),B:resolve(bArg)},labels={A:'stage9+plans',B:'zero-bounds+plans'},
  git=(d,...args)=>execFileSync('git',['-C',d,...args],{encoding:'utf8'}).trim(),
  src=Object.fromEntries(Object.entries(dirs).map(([k,d])=>[k,{sha:git(d,'rev-parse','HEAD'),dirty:!!git(d,'status','--porcelain'),path:d}]));
if(src.A.dirty||src.B.dirty)throw Error('dirty source');
const sequence=['A','B','B','A'];
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({
  kind:'isomax-phase2-selected-seven-worker-v1',moves,blocks,timeoutMs,sequence,labels,sources:src,
  runner:{cpu:cpus()[0]?.model??null,platform:platform(),release:release(),node:process.version,v8:process.versions.v8},
  profile:'selected six-deep/one-wide, workers=7, rootFrontier=true, shared=4194304, local=1048576, full sharing',
  supportPlans:{perWorkerCapacity:262144,workers:7,private:true},
  primary:'whole process solveCycles; search work intentionally may change'
},null,2)+'\n');

const rows=[];
for(let block=0;block<blocks;block++)for(const arm of sequence){
  const d=dirs[arm],now={sha:git(d,'rev-parse','HEAD'),dirty:!!git(d,'status','--porcelain')};
  if(now.dirty||now.sha!==src[arm].sha)throw Error(arm+' source changed');
  const script=resolve(d,'tools/run-isomax.mjs'),input=JSON.stringify({moves,timeoutMs});
  const child=spawnSync(process.execPath,['--experimental-ffi',script,input],{
    cwd:d,encoding:'utf8',timeout:timeoutMs+30000,maxBuffer:4*1024*1024
  });
  appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({
    block,arm,label:labels[arm],status:child.status,signal:child.signal,error:child.error?.message??null,
    stdout:child.stdout,stderr:child.stderr
  })+'\n');
  if(child.status!==0)throw Error(arm+' runner failed');
  const row={...JSON.parse(child.stdout.trim()),block,arm,label:labels[arm]};
  if(row.status!=='EXACT')throw Error(arm+' did not solve exactly: '+row.status);
  if(row.requestedWorkers!==7||row.workersUsed!==7||row.config?.workers!==7||row.config?.rootFrontier!==true)
    throw Error(arm+' selected worker profile drift');
  if(row.errorCode)throw Error(arm+' host error '+row.errorCode);
  rows.push(row);appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(row)+'\n');
  console.log(JSON.stringify({
    block,arm,cycles:row.solveCycles,wallMs:row.wallMs,totalNodes:row.totalNodes,winner:row.winner,
    winnerNodes:row.winnerMetrics?.nodes??null,sharedHits:row.sharedCacheHits,sharedStores:row.sharedCacheStores,
    rss:row.rss,peak:row.processPeakRssBytes
  }));
}
const results=[...new Set(rows.map(r=>JSON.stringify({rootWdl:r.rootWdl,move:r.move,status:r.status})))];
if(results.length!==1)throw Error('A/B exact root result or move drift: '+results.join(','));

const t95=[null,null,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131],
  ratioFields=['solveCycles','wallMs','cpuMs','totalNodes','sharedCacheHits','sharedCacheStores','rss','processPeakRssBytes'],
  stats={};
for(const field of ratioFields){
  const ratios=[];
  for(let block=0;block<blocks;block++){
    const aa=rows.filter(r=>r.block===block&&r.arm==='A'),bb=rows.filter(r=>r.block===block&&r.arm==='B'),
      mean=x=>x.reduce((s,r)=>s+Number(r[field]??0),0)/x.length,
      av=mean(aa),bv=mean(bb);
    if(av>0)ratios.push(bv/av);
  }
  if(ratios.length===blocks){
    const mean=ratios.reduce((x,y)=>x+y,0)/ratios.length,
      variance=ratios.reduce((s,x)=>s+(x-mean)**2,0)/(ratios.length-1),
      se=Math.sqrt(variance/ratios.length),t=t95[blocks];
    stats[field]={blockRatios:ratios,meanDeltaPct:(mean-1)*100,
      interval95Pct:[(mean-t*se-1)*100,(mean+t*se-1)*100]};
  }else stats[field]={blockRatios:ratios,note:'ratio omitted for zero baseline blocks'};
}
const mean=(arm,key)=>{const a=rows.filter(r=>r.arm===arm);return a.reduce((s,r)=>s+Number(r[key]??0),0)/a.length;};
const means={};
for(const arm of ['A','B']){
  const a=rows.filter(r=>r.arm===arm),workerMeans=Array.from({length:7},(_,i)=>a.reduce((s,r)=>s+Number(r.nodeCounts?.[i]??0),0)/a.length);
  means[arm]={
    label:labels[arm],solveCycles:mean(arm,'solveCycles'),wallMs:mean(arm,'wallMs'),cpuMs:mean(arm,'cpuMs'),
    totalNodes:mean(arm,'totalNodes'),sharedCacheHits:mean(arm,'sharedCacheHits'),sharedCacheStores:mean(arm,'sharedCacheStores'),
    sharedCacheStoreContention:mean(arm,'sharedCacheStoreContention'),rss:mean(arm,'rss'),processPeakRssBytes:mean(arm,'processPeakRssBytes'),
    winnerNodes:a.reduce((s,r)=>s+Number(r.winnerMetrics?.nodes??0),0)/a.length,
    winnerCofactors:a.reduce((s,r)=>s+Number(r.winnerMetrics?.cofactors??0),0)/a.length,
    workerNodeMeans:workerMeans,winners:Object.fromEntries([...new Set(a.map(r=>r.winner))].map(w=>[w,a.filter(r=>r.winner===w).length]))
  };
}
const summary={kind:'isomax-phase2-selected-seven-worker-summary-v1',moves,blocks,samples:rows.length,
  exactResult:JSON.parse(results[0]),means,stats,
  sharedMasking:{
    hitDeltaPct:means.A.sharedCacheHits?((means.B.sharedCacheHits/means.A.sharedCacheHits)-1)*100:null,
    storeDeltaPct:means.A.sharedCacheStores?((means.B.sharedCacheStores/means.A.sharedCacheStores)-1)*100:null,
    interpretation:'A fall in shared evidence is acceptable only if whole exact solve cycles/wall improve.'
  },
  interpretation:'Selected seven-worker qualification. Search-work identity is intentionally not required.'
};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
