// COLD four-arm plan-application factorial. No timing instrumentation enters solver recursion.
import {appendFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {cpus,platform,release} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';

const [outputArg,aArg,bArg,cArg,dArg,moves='353335714',blocksArg='8']=process.argv.slice(2);
if(!outputArg||!aArg||!bArg||!cArg||!dArg)throw Error('usage: run OUTPUT A B C D MOVES BLOCKS');
const blocks=Number(blocksArg);if(!Number.isInteger(blocks)||blocks<4||blocks>16)throw RangeError('blocks 4..16');
const output=resolve(outputArg);if(existsSync(output))throw Error('output exists');mkdirSync(output,{recursive:true});
const dirs={A:resolve(aArg),B:resolve(bArg),C:resolve(cArg),D:resolve(dArg)};
const labels={A:'plan-c1-scan',B:'plan-no-c1-scan',C:'plan-c1-setbits',D:'plan-no-c1-setbits'};
const sample=resolve(dirname(fileURLToPath(import.meta.url)),'../isomax-cofactor-plan/sample.mjs');
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();
const sources=Object.fromEntries(Object.entries(dirs).map(([arm,path])=>[arm,{path,sha:git(path,'rev-parse','HEAD'),dirty:!!git(path,'status','--porcelain')}]));
for(const [arm,s] of Object.entries(sources))if(s.dirty)throw Error(arm+' dirty');
const orders=['ABDC','BCAD','CDBA','DACB'];
writeFileSync(resolve(output,'manifest.json'),JSON.stringify({kind:'isomax-plan-apply-factorial-v1',moves,blocks,orders,labels,sources,
  runner:{cpu:cpus()[0]?.model??null,platform:platform(),release:release(),node:process.version,v8:process.versions.v8},
  primary:'solveCycles; all arms must preserve result and production search metrics',boundary:'fresh process; plan allocation outside measured solve call'},null,2)+'\n');
const rows=[];
for(let block=0;block<blocks;block++){
  const order=orders[block%4];
  for(const arm of order){
    const s=sources[arm],now={sha:git(dirs[arm],'rev-parse','HEAD'),dirty:!!git(dirs[arm],'status','--porcelain')};
    if(now.dirty||now.sha!==s.sha)throw Error(arm+' changed');
    const child=spawnSync(process.execPath,['--experimental-ffi',sample,dirs[arm],moves],{encoding:'utf8',timeout:moves==='353335714'?90000:30000,maxBuffer:1024*1024});
    appendFileSync(resolve(output,'processes.jsonl'),JSON.stringify({block,order,arm,label:labels[arm],source:s,status:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr})+'\n');
    if(child.status!==0)throw Error(arm+' sample failed');
    const row={...JSON.parse(child.stdout.trim()),block,order,arm,label:labels[arm]};
    if(row.sourceSha!==s.sha)throw Error(arm+' source mismatch');
    appendFileSync(resolve(output,'samples.jsonl'),JSON.stringify(row)+'\n');rows.push(row);
    console.log(JSON.stringify({block,order,arm,cycles:row.solveCycles,wallMs:row.wallMs,nodes:row.metrics.nodes,plans:row.planCount}));
  }
}
const sig=x=>JSON.stringify({result:x.result,metrics:x.metrics});
const sigs=Object.fromEntries(Object.keys(dirs).map(a=>[a,[...new Set(rows.filter(x=>x.arm===a).map(sig))]]));
for(const [a,v] of Object.entries(sigs))if(v.length!==1)throw Error(a+' nondeterministic search signature');
for(const a of ['B','C','D'])if(sigs[a][0]!==sigs.A[0])throw Error(a+' search work changed');
const fields=['solveCycles','cyclesPerNode','wallMs','cpuMs'],t95=[null,null,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131];
const comparisons={};
for(const arm of ['B','C','D']){
  comparisons[arm]={};
  for(const field of fields){
    const ratios=[];
    for(let b=0;b<blocks;b++){const a=rows.find(x=>x.block===b&&x.arm==='A'),x=rows.find(x=>x.block===b&&x.arm===arm);ratios.push(Number(x[field])/Number(a[field]));}
    const mean=ratios.reduce((x,y)=>x+y,0)/ratios.length,variance=ratios.reduce((s,x)=>s+(x-mean)**2,0)/(ratios.length-1),se=Math.sqrt(variance/ratios.length),t=t95[blocks];
    comparisons[arm][field]={blockRatios:ratios,meanDeltaPct:(mean-1)*100,interval95Pct:[(mean-t*se-1)*100,(mean+t*se-1)*100]};
  }
}
const means={};
for(const arm of Object.keys(dirs)){const a=rows.filter(x=>x.arm===arm),avg=k=>a.reduce((s,x)=>s+Number(x[k]),0)/a.length;
  means[arm]={label:labels[arm],solveCycles:avg('solveCycles'),cyclesPerNode:avg('cyclesPerNode'),wallMs:avg('wallMs'),cpuMs:avg('cpuMs'),planCount:avg('planCount'),planBytes:a[0].planBytes,nodes:a[0].metrics.nodes,cofactors:a[0].metrics.cofactors};}
const summary={kind:'isomax-plan-apply-factorial-summary-v1',moves,blocks,samples:rows.length,means,comparisons,deterministic:JSON.parse(sigs.A[0])};
writeFileSync(resolve(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
