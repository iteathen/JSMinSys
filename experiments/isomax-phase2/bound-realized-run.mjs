// Phase-2 realized local zero-bound A/B/C/D controller.
// A = frozen Stage-9 denominator, B = search-derived bounds,
// C = CPC-derived bounds, D = combined. Search-work changes are expected.
import {appendFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {cpus,platform,release} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';

const [outArg,libraryArg,moves='353335714',blocksArg='8']=process.argv.slice(2);
if(!outArg||!libraryArg)throw Error('usage: node bound-realized-run.mjs OUTPUT LIBRARY MOVES BLOCKS');
const blocks=Number(blocksArg);if(!Number.isInteger(blocks)||blocks<4||blocks>16)throw RangeError('blocks 4..16');
const out=resolve(outArg),library=resolve(libraryArg);
if(existsSync(out))throw Error('output exists');mkdirSync(out,{recursive:true});
const here=dirname(fileURLToPath(import.meta.url)),
  hook=resolve(here,'bound-realized-hook.mjs'),
  sample=resolve(here,'../isomax-cofactor-plan/sample.mjs'),
  git=(...args)=>execFileSync('git',['-C',library,...args],{encoding:'utf8'}).trim(),
  source={path:library,sha:git('rev-parse','HEAD'),dirty:!!git('status','--porcelain')};
if(source.dirty)throw Error('library checkout dirty');

const labels={A:'stage9-denominator',B:'search-bounds',C:'cpc-bounds',D:'combined-bounds'},
  policies={A:null,B:'search',C:'cpc',D:'both'},
  orders=['ABDC','BCAD','CDBA','DACB'];
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({
  kind:'isomax-phase2-realized-zero-bound-v1',moves,blocks,orders,labels,source,
  runner:{cpu:cpus()[0]?.model??null,platform:platform(),release:release(),node:process.version,v8:process.versions.v8},
  primary:'whole solveCycles; search-work changes allowed',
  authority:'frozen Stage-9 source 10380f79af68dc1f57455d535814ac0a7eacea33',
},null,2)+'\n');

const rows=[];
for(let block=0;block<blocks;block++){
  const order=orders[block%orders.length];
  for(const arm of order){
    const current={sha:git('rev-parse','HEAD'),dirty:!!git('status','--porcelain')};
    if(current.dirty||current.sha!==source.sha)throw Error('library source changed');
    const args=['--experimental-ffi'];
    if(policies[arm])args.push('--import',pathToFileURL(hook).href);
    args.push(sample,library,moves);
    const child=spawnSync(process.execPath,args,{
      encoding:'utf8',timeout:moves==='353335714'?90000:30000,maxBuffer:1024*1024,
      env:policies[arm]?{...process.env,ISOMAX_BOUND_POLICY:policies[arm]}:process.env,
    });
    appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({
      block,order,arm,label:labels[arm],policy:policies[arm],exitCode:child.status,signal:child.signal,
      error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr,
    })+'\n');
    if(child.status!==0)throw Error(arm+' sample failed; raw output preserved');
    const row={...JSON.parse(child.stdout.trim()),block,order,arm,label:labels[arm],policy:policies[arm]};
    if(row.sourceSha!==source.sha)throw Error(arm+' source identity mismatch');
    appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(row)+'\n');rows.push(row);
    console.log(JSON.stringify({
      block,order,arm,cycles:row.solveCycles,wallMs:row.wallMs,nodes:row.metrics.nodes,
      cofactors:row.metrics.cofactors,cacheHits:row.metrics.cacheHits,cutoffs:row.metrics.cutoffs,
      cpcExact:row.metrics.cpcExact,cpcBounds:row.metrics.cpcBounds,cpcRestrictions:row.metrics.cpcRestrictions
    }));
  }
}

const resultSig=r=>JSON.stringify(r.result);
const sigs=Object.fromEntries(Object.keys(labels).map(a=>[a,[...new Set(rows.filter(r=>r.arm===a).map(resultSig))]]));
for(const [a,v] of Object.entries(sigs))if(v.length!==1)throw Error(a+' nondeterministic result');
for(const a of ['B','C','D'])if(sigs[a][0]!==sigs.A[0])throw Error(a+' exact result/root move drift');

const t95=[null,null,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131],
  fields=['solveCycles','cyclesPerNode','wallMs','cpuMs'],
  metricFields=['nodes','cofactors','cacheHits','cutoffs','cpcExact','cpcBounds','cpcRestrictions'],
  comparisons={};
for(const arm of ['B','C','D']){
  comparisons[arm]={};
  for(const field of fields){
    const ratios=[];
    for(let b=0;b<blocks;b++){
      const a=rows.find(r=>r.block===b&&r.arm==='A'),x=rows.find(r=>r.block===b&&r.arm===arm);
      ratios.push(Number(x[field])/Number(a[field]));
    }
    const mean=ratios.reduce((x,y)=>x+y,0)/ratios.length,
      variance=ratios.reduce((s,x)=>s+(x-mean)**2,0)/(ratios.length-1),
      se=Math.sqrt(variance/ratios.length),t=t95[blocks];
    comparisons[arm][field]={blockRatios:ratios,meanDeltaPct:(mean-1)*100,
      interval95Pct:[(mean-t*se-1)*100,(mean+t*se-1)*100]};
  }
}
const means={};
for(const arm of Object.keys(labels)){
  const a=rows.filter(r=>r.arm===arm),avg=f=>a.reduce((s,r)=>s+Number(r[f]),0)/a.length;
  means[arm]={label:labels[arm],solveCycles:avg('solveCycles'),cyclesPerNode:avg('cyclesPerNode'),
    wallMs:avg('wallMs'),cpuMs:avg('cpuMs'),metrics:{}};
  for(const m of metricFields)means[arm].metrics[m]=a.reduce((s,r)=>s+Number(r.metrics[m]??0),0)/a.length;
}
const metricDeltas={};
for(const arm of ['B','C','D']){
  metricDeltas[arm]={};
  for(const m of metricFields){
    const a=means.A.metrics[m],b=means[arm].metrics[m];
    metricDeltas[arm][m]={absolute:b-a,deltaPct:a?((b/a)-1)*100:null};
  }
}
const summary={kind:'isomax-phase2-realized-zero-bound-summary-v1',moves,blocks,samples:rows.length,
  means,comparisons,metricDeltas,deterministicResult:JSON.parse(sigs.A[0]),
  interpretation:'Phase-2 structural/search screen. Judge total cycles/wall first; node reduction alone is insufficient.'};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
