import {appendFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';

const [outArg,aArg,bArg,cArg,moves='353335714',blocksArg='6',timeoutArg='90000']=process.argv.slice(2);
if(!outArg||!aArg||!bArg||!cArg)throw Error('usage: scaled4-shared-hash OUTPUT A B C MOVES BLOCKS TIMEOUT');
const blocks=Number(blocksArg),timeoutMs=Number(timeoutArg);
if(!Number.isInteger(blocks)||blocks<1||blocks>12)throw RangeError('blocks 1..12');
if(!Number.isSafeInteger(timeoutMs)||timeoutMs<=0)throw RangeError('timeoutMs');
const out=resolve(outArg);if(existsSync(out))throw Error('output exists');mkdirSync(out,{recursive:true});
const dirs={A:resolve(aArg),B:resolve(bArg),C:resolve(cArg)},
  labels={A:'noncutoff-fallback',B:'fallback-known-hash',C:'all-hot-known-hash'},
  sample=resolve(dirname(fileURLToPath(import.meta.url)),'scaled4-sample.mjs'),
  git=(d,...args)=>execFileSync('git',['-C',d,...args],{encoding:'utf8'}).trim(),
  source=Object.fromEntries(Object.entries(dirs).map(([k,d])=>[k,{sha:git(d,'rev-parse','HEAD'),dirty:!!git(d,'status','--porcelain'),path:d}]));
for(const [a,s] of Object.entries(source))if(s.dirty)throw Error(a+' dirty');
const orders=['ABC','BCA','CAB'];
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({
  kind:'isomax-phase2-scaled4-shared-hash-v1',moves,blocks,timeoutMs,orders,labels,sources:source,
  topology:{workers:4,wideWorker:0,deepWorkers:[1,2,3],rootFrontier:true}
},null,2)+'\n');

const rows=[];
for(let block=0;block<blocks;block++){
  const order=orders[block%3];
  for(const arm of order){
    const d=dirs[arm],cur={sha:git(d,'rev-parse','HEAD'),dirty:!!git(d,'status','--porcelain')};
    if(cur.dirty||cur.sha!==source[arm].sha)throw Error(arm+' source changed');
    const child=spawnSync(process.execPath,['--experimental-ffi',sample,d,moves,String(timeoutMs)],{
      encoding:'utf8',timeout:timeoutMs+30000,maxBuffer:4*1024*1024
    });
    appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({
      block,order,arm,label:labels[arm],status:child.status,signal:child.signal,error:child.error?.message??null,
      stdout:child.stdout,stderr:child.stderr
    })+'\n');
    if(child.status!==0)throw Error(arm+' sample failed');
    const row={...JSON.parse(child.stdout.trim()),block,order,arm,label:labels[arm]};
    if(row.sourceSha!==source[arm].sha)throw Error(arm+' source mismatch');
    if(row.topology?.workers!==4||row.topology?.wideWorker!==0||JSON.stringify(row.topology?.deepWorkers)!==JSON.stringify([1,2,3]))
      throw Error('topology drift');
    rows.push(row);appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(row)+'\n');
    console.log(JSON.stringify({
      block,order,arm,status:row.status,cycles:row.solveCycles,wallMs:row.wallMs,totalNodes:row.totalNodes,
      sharedHits:row.sharedCacheHits,sharedStores:row.sharedCacheStores,contention:row.sharedCacheStoreContention,
      parallelism:row.topology.availableParallelism
    }));
  }
}

const exact=rows.filter(r=>r.status==='EXACT'),
  resultSet=[...new Set(exact.map(r=>JSON.stringify({rootWdl:r.rootWdl,move:r.move})))];
if(resultSet.length>1)throw Error('exact result drift');
const t95=[null,null,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201],
  summary={kind:'isomax-phase2-scaled4-shared-hash-summary-v1',moves,blocks,timeoutMs,samples:rows.length,
    exactResult:resultSet.length?JSON.parse(resultSet[0]):null,arms:{},paired:{}};
for(const arm of ['A','B','C']){
  const a=rows.filter(r=>r.arm===arm),ex=a.filter(r=>r.status==='EXACT'),
    mean=(arr,key)=>arr.length?arr.reduce((s,r)=>s+Number(r[key]??0),0)/arr.length:null;
  summary.arms[arm]={label:labels[arm],exact:ex.length,timeouts:a.length-ex.length,
    meanCycles:mean(a,'solveCycles'),meanWall:mean(a,'wallMs'),meanCpu:mean(a,'cpuMs'),
    meanNodes:mean(a,'totalNodes'),meanSharedHits:mean(a,'sharedCacheHits'),
    meanSharedStores:mean(a,'sharedCacheStores'),meanContention:mean(a,'sharedCacheStoreContention'),
    parallelism:[...new Set(a.map(r=>r.topology.availableParallelism))]};
}
for(const arm of ['B','C']){
  const allExact=rows.filter(r=>r.arm==='A').every(r=>r.status==='EXACT')&&rows.filter(r=>r.arm===arm).every(r=>r.status==='EXACT');
  summary.paired[arm]={};
  for(const field of ['solveCycles','wallMs','cpuMs','totalNodes','sharedCacheHits','sharedCacheStores','sharedCacheStoreContention']){
    const ratios=[];
    for(let b=0;b<blocks;b++){
      const aa=rows.filter(r=>r.block===b&&r.arm==='A'),bb=rows.filter(r=>r.block===b&&r.arm===arm),
        mean=x=>x.reduce((s,r)=>s+Number(r[field]),0)/x.length;
      ratios.push(mean(bb)/mean(aa));
    }
    const m=ratios.reduce((x,y)=>x+y,0)/ratios.length,
      v=blocks>1?ratios.reduce((s,x)=>s+(x-m)**2,0)/(blocks-1):0,
      se=blocks>1?Math.sqrt(v/blocks):0,t=t95[blocks]??null;
    summary.paired[arm][field]={ratios,meanDeltaPct:(m-1)*100,
      interval95Pct:t===null?null:[(m-t*se-1)*100,(m+t*se-1)*100],exactSolveRatioAdmissible:allExact};
  }
}
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
