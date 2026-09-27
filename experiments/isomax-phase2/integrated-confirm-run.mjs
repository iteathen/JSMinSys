import {appendFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';

const [outArg,aArg,bArg,moves='353335714',blocksArg='8']=process.argv.slice(2);
if(!outArg||!aArg||!bArg)throw Error('usage: confirm-run OUTPUT A B MOVES BLOCKS');
const blocks=Number(blocksArg);if(!Number.isInteger(blocks)||blocks<2||blocks>16)throw RangeError('blocks');
const out=resolve(outArg);if(existsSync(out))throw Error('output exists');mkdirSync(out,{recursive:true});
const dirs={A:resolve(aArg),B:resolve(bArg)},here=dirname(fileURLToPath(import.meta.url)),sample=resolve(here,'integrated-confirm-sample.mjs'),
  git=(d,...args)=>execFileSync('git',['-C',d,...args],{encoding:'utf8'}).trim(),
  src=Object.fromEntries(Object.entries(dirs).map(([k,d])=>[k,{sha:git(d,'rev-parse','HEAD'),dirty:!!git(d,'status','--porcelain'),path:d}]));
if(src.A.dirty||src.B.dirty)throw Error('dirty source');
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({kind:'isomax-phase2-integrated-confirm-v1',moves,blocks,sequence:'ABBA',sources:src},null,2)+'\n');
const rows=[];
for(let block=0;block<blocks;block++)for(const arm of ['A','B','B','A']){
  if(git(dirs[arm],'status','--porcelain')||git(dirs[arm],'rev-parse','HEAD')!==src[arm].sha)throw Error('source changed');
  const child=spawnSync(process.execPath,['--experimental-ffi',sample,dirs[arm],moves],{encoding:'utf8',timeout:moves==='353335714'?90000:30000,maxBuffer:1024*1024});
  appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({block,arm,status:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr})+'\n');
  if(child.status!==0)throw Error(arm+' failed');
  const row={...JSON.parse(child.stdout.trim()),block,arm};if(row.sourceSha!==src[arm].sha)throw Error('source mismatch');
  rows.push(row);appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(row)+'\n');
  console.log(JSON.stringify({block,arm,cycles:row.solveCycles,wallMs:row.wallMs,nodes:row.metrics.nodes,cofactors:row.metrics.cofactors}));
}
const sig=r=>JSON.stringify(r.result),sa=[...new Set(rows.filter(r=>r.arm==='A').map(sig))],sb=[...new Set(rows.filter(r=>r.arm==='B').map(sig))];
if(sa.length!==1||sb.length!==1||sa[0]!==sb[0])throw Error('exact result drift');
const t95=[null,null,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131],stats={};
for(const field of ['solveCycles','cyclesPerNode','wallMs','cpuMs']){
  const ratios=[];
  for(let block=0;block<blocks;block++){const a=rows.filter(r=>r.block===block&&r.arm==='A'),b=rows.filter(r=>r.block===block&&r.arm==='B'),mean=x=>x.reduce((s,r)=>s+Number(r[field]),0)/x.length;ratios.push(mean(b)/mean(a));}
  const mean=ratios.reduce((x,y)=>x+y,0)/ratios.length,v=ratios.reduce((s,x)=>s+(x-mean)**2,0)/(ratios.length-1),se=Math.sqrt(v/ratios.length),t=t95[blocks];
  stats[field]={blockRatios:ratios,meanDeltaPct:(mean-1)*100,interval95Pct:[(mean-t*se-1)*100,(mean+t*se-1)*100]};
}
const mean=(arm,f)=>{const a=rows.filter(r=>r.arm===arm);return a.reduce((s,r)=>s+Number(r[f]),0)/a.length;},
  metricMean=(arm,f)=>{const a=rows.filter(r=>r.arm===arm);return a.reduce((s,r)=>s+Number(r.metrics[f]??0),0)/a.length;};
const metricFields=['nodes','cofactors','cacheHits','cutoffs','cpcExact','cpcBounds','cpcRestrictions'],metrics={A:{},B:{}};
for(const arm of ['A','B'])for(const f of metricFields)metrics[arm][f]=metricMean(arm,f);
const summary={kind:'isomax-phase2-integrated-confirm-summary-v1',moves,blocks,samples:rows.length,stats,
  means:{A:{solveCycles:mean('A','solveCycles'),cyclesPerNode:mean('A','cyclesPerNode'),wallMs:mean('A','wallMs')},
    B:{solveCycles:mean('B','solveCycles'),cyclesPerNode:mean('B','cyclesPerNode'),wallMs:mean('B','wallMs')}},
  metrics,deterministicResult:JSON.parse(sa[0])};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
