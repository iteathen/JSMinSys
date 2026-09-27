// COLD four-arm cofactor factorial controller. No instrumentation enters solver recursion.
import {appendFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {cpus,platform,release} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';

const [outputArg,aArg,bArg,cArg,dArg,cacheMode='local',moves='353335714',blocksArg='8']=process.argv.slice(2);
if(!outputArg||!aArg||!bArg||!cArg||!dArg)
  throw new Error('usage: node run.mjs OUTPUT A B C D local|shared MOVES BLOCKS');
if(!['local','shared'].includes(cacheMode))throw new RangeError('cache mode must be local|shared');
const blocks=Number(blocksArg);
if(!Number.isInteger(blocks)||blocks<4||blocks>16)throw new RangeError('blocks must be 4..16');

const output=resolve(outputArg);
if(existsSync(output))throw new Error('output directory already exists');
mkdirSync(output,{recursive:true});
const dirs={A:resolve(aArg),B:resolve(bArg),C:resolve(cArg),D:resolve(dArg)};
const labels={A:'baseline-c1',B:'dense-remove-c1',C:'dense-subset-c1',D:'dense-both-c1'};
const here=dirname(fileURLToPath(import.meta.url));
const sample=resolve(here,'../isomax-hotloop-baseline/sample.mjs');
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();
const snapshots=Object.fromEntries(Object.entries(dirs).map(([arm,dir])=>[arm,{
  path:dir,sha:git(dir,'rev-parse','HEAD'),dirty:!!git(dir,'status','--porcelain')
}]));
for(const [arm,s] of Object.entries(snapshots))if(s.dirty)throw new Error(`${arm} checkout is dirty`);

const orders=['ABDC','BCAD','CDBA','DACB'];
writeFileSync(resolve(output,'manifest.json'),JSON.stringify({
  kind:'isomax-cofactor-factorial-manifest-v1',
  cacheMode,moves,blocks,orders,
  labels,sources:snapshots,
  runner:{cpu:cpus()[0]?.model??null,platform:platform(),release:release(),node:process.version,v8:process.versions.v8},
  primary:'solveCycles on long/local; representation-only arms must preserve deterministic search signature',
  boundary:'single evaluator, first solve measured; root/geometry/cache preparation excluded; no source instrumentation',
},null,2)+'\n');

const samples=[];
for(let block=0;block<blocks;block++){
  const order=orders[block%orders.length];
  for(const arm of order){
    const source=snapshots[arm],dir=dirs[arm],current={
      sha:git(dir,'rev-parse','HEAD'),dirty:!!git(dir,'status','--porcelain')
    };
    if(current.dirty||current.sha!==source.sha)throw new Error(`${arm} source changed during campaign`);
    const child=spawnSync(process.execPath,['--experimental-ffi',sample,dir,cacheMode,moves],{
      encoding:'utf8',timeout:moves==='353335714'?90000:30000,maxBuffer:1024*1024,
    });
    appendFileSync(resolve(output,'processes.jsonl'),JSON.stringify({
      block,order,arm,label:labels[arm],source,exitCode:child.status,signal:child.signal,
      error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr,
    })+'\n');
    if(child.status!==0)throw new Error(`${arm} sample failed; raw output preserved`);
    const row={...JSON.parse(child.stdout.trim()),block,order,arm,label:labels[arm]};
    if(row.sourceSha!==source.sha)throw new Error(`${arm} sample source mismatch`);
    appendFileSync(resolve(output,'samples.jsonl'),JSON.stringify(row)+'\n');
    samples.push(row);
    console.log(JSON.stringify({block,order,arm,solveCycles:row.solveCycles,wallMs:row.wallMs,
      nodes:row.metrics.nodes,cofactors:row.metrics.cofactors,cyclesPerNode:row.cyclesPerNode}));
  }
}

const signature=row=>JSON.stringify({result:row.result,metrics:row.metrics,sharedStats:row.sharedStats});
const signatures=Object.fromEntries(Object.keys(dirs).map(arm=>[arm,[...new Set(samples.filter(x=>x.arm===arm).map(signature))]]));
for(const [arm,values] of Object.entries(signatures))if(values.length!==1)
  throw new Error(`${arm} deterministic search signature changed across samples`);
const authority=signatures.A[0];
for(const arm of ['B','C','D'])if(signatures[arm][0]!==authority)
  throw new Error(`${arm} changes deterministic search work; factorial is representation-only and rejects this arm`);

const fields=['solveCycles','cyclesPerNode','wallMs','cpuMs'];
const t95=[null,null,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131];
const comparisons={};
for(const arm of ['B','C','D']){
  comparisons[arm]={};
  for(const field of fields){
    const ratios=[];
    for(let block=0;block<blocks;block++){
      const a=samples.find(x=>x.block===block&&x.arm==='A');
      const b=samples.find(x=>x.block===block&&x.arm===arm);
      ratios.push(Number(b[field])/Number(a[field]));
    }
    const mean=ratios.reduce((x,y)=>x+y,0)/ratios.length;
    const variance=ratios.reduce((s,x)=>s+(x-mean)**2,0)/(ratios.length-1);
    const se=Math.sqrt(variance/ratios.length),t=t95[blocks];
    comparisons[arm][field]={blockRatios:ratios,meanDeltaPct:(mean-1)*100,
      interval95Pct:[(mean-t*se-1)*100,(mean+t*se-1)*100]};
  }
}

const means={};
for(const arm of Object.keys(dirs)){
  const rows=samples.filter(x=>x.arm===arm);
  const avg=k=>rows.reduce((s,x)=>s+Number(x[k]),0)/rows.length;
  means[arm]={label:labels[arm],solveCycles:avg('solveCycles'),cyclesPerNode:avg('cyclesPerNode'),
    wallMs:avg('wallMs'),cpuMs:avg('cpuMs'),nodes:rows[0].metrics.nodes,cofactors:rows[0].metrics.cofactors,
    solverHashes:rows[0].solverHashes};
}
const summary={kind:'isomax-cofactor-factorial-summary-v1',cacheMode,moves,blocks,samples:samples.length,
  means,comparisons,deterministic:JSON.parse(authority),
  interpretation:'Screen only. Correctness/work identity is mandatory. A promising arm requires independent confirmation and selected multiworker whole-solve qualification before promotion.'
};
writeFileSync(resolve(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
